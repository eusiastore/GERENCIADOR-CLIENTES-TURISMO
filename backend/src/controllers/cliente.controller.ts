import { Context } from 'hono';
import { Bindings, Variables, Cliente } from '../types';

export class ClienteController {
  static async index(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { results } = await c.env.DB.prepare(`
        SELECT * FROM clientes ORDER BY nome_completo ASC
      `).all<Cliente>();

      return c.json({ success: true, data: results });
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar clientes.' }, 500);
    }
  }

  static async show(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const cliente = await c.env.DB.prepare(
        'SELECT * FROM clientes WHERE id = ? LIMIT 1'
      ).bind(id).first<Cliente>();

      if (!cliente) {
        return c.json({ success: false, data: null, message: 'Cliente não encontrado.' }, 404);
      }

      return c.json({ success: true, data: cliente });
    } catch (error) {
      console.error('Erro ao exibir cliente:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar cliente.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { nome_completo, cpf, data_nascimento, contato } = await c.req.json();

      if (!nome_completo || !cpf) {
        return c.json({ success: false, data: null, message: 'Nome completo e CPF são obrigatórios.' }, 422);
      }

      const cleanCpf = String(cpf).replace(/\D/g, '');
      const cleanNome = String(nome_completo).trim().toUpperCase();

      const existing = await c.env.DB.prepare(
        'SELECT id FROM clientes WHERE cpf = ? LIMIT 1'
      ).bind(cleanCpf).first();

      if (existing) {
        return c.json({ success: false, data: null, message: 'Já existe um cliente cadastrado com este CPF.' }, 409);
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO clientes (nome_completo, cpf, data_nascimento, contato)
        VALUES (?, ?, ?, ?)
      `).bind(
        cleanNome,
        cleanCpf,
        data_nascimento || null,
        contato || null
      ).run();

      const newId = Number(result.meta.last_row_id);
      const newClient = await c.env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(newId).first();

      return c.json({ success: true, data: newClient, message: 'Cliente cadastrado com sucesso!' }, 201);
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      return c.json({ success: false, data: null, message: error.message || 'Erro ao cadastrar cliente.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const { nome_completo, cpf, data_nascimento, contato } = await c.req.json();

      const existing = await c.env.DB.prepare('SELECT * FROM clientes WHERE id = ? LIMIT 1').bind(id).first<Cliente>();
      if (!existing) {
        return c.json({ success: false, data: null, message: 'Cliente não encontrado.' }, 404);
      }

      if (cpf) {
        const cleanCpf = String(cpf).replace(/\D/g, '');
        const dup = await c.env.DB.prepare(
          'SELECT id FROM clientes WHERE cpf = ? AND id != ? LIMIT 1'
        ).bind(cleanCpf, id).first();

        if (dup) {
          return c.json({ success: false, data: null, message: 'Já existe outro cliente com este CPF.' }, 409);
        }
      }

      const cleanNome = nome_completo ? String(nome_completo).trim().toUpperCase() : existing.nome_completo;
      const finalCpf = cpf ? String(cpf).replace(/\D/g, '') : existing.cpf;

      await c.env.DB.prepare(`
        UPDATE clientes SET
          nome_completo = ?,
          cpf = ?,
          data_nascimento = ?,
          contato = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        cleanNome,
        finalCpf,
        data_nascimento !== undefined ? (data_nascimento || null) : existing.data_nascimento,
        contato !== undefined ? (contato || null) : existing.contato,
        id
      ).run();

      const updated = await c.env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(id).first();
      return c.json({ success: true, data: updated, message: 'Cliente atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar cliente.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      await c.env.DB.prepare('DELETE FROM clientes WHERE id = ?').bind(id).run();
      return c.json({ success: true, data: null, message: 'Cliente excluído com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      return c.json({ success: false, data: null, message: 'Erro ao excluir cliente.' }, 500);
    }
  }

  static async extrato(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));

      const cliente = await c.env.DB.prepare('SELECT * FROM clientes WHERE id = ? LIMIT 1').bind(id).first<Cliente>();
      if (!cliente) {
        return c.json({ success: false, data: null, message: 'Cliente não encontrado.' }, 404);
      }

      const { results: passagens } = await c.env.DB.prepare(`
        SELECT p.id as passageiro_id, p.viagem_id, p.valor_total, v.nome_destino, v.data_viagem
        FROM passageiros_viagem p
        JOIN viagens v ON p.viagem_id = v.id
        WHERE p.cliente_id = ?
        ORDER BY v.data_viagem DESC, p.id ASC
      `).bind(id).all<{ passageiro_id: number; viagem_id: number; valor_total: number; nome_destino: string; data_viagem: string }>();

      const { results: parcelas } = await c.env.DB.prepare(`
        SELECT pr.valor, COALESCE(DATE(pr.data_pagamento), DATE(pr.updated_at), DATE('now')) as data_pag, p.viagem_id
        FROM parcelas_passageiro pr
        JOIN passageiros_viagem p ON pr.passageiro_id = p.id
        WHERE p.cliente_id = ? AND pr.status_pagamento = 'pago'
      `).bind(id).all<{ valor: number; data_pag: string; viagem_id: number }>();

      const viagensMap: Record<number, { nome: string; qtd_adt: number; valor_total: number; pagamentos: Record<string, number> }> = {};
      let totalGeral = 0;
      let pagoGeral = 0;

      if (passagens) {
        for (const p of passagens) {
          const vId = p.viagem_id;
          if (!viagensMap[vId]) {
            viagensMap[vId] = {
              nome: p.nome_destino,
              qtd_adt: 0,
              valor_total: 0,
              pagamentos: {}
            };
          }
          viagensMap[vId].qtd_adt += 1;
          viagensMap[vId].valor_total += Number(p.valor_total);
          totalGeral += Number(p.valor_total);
        }
      }

      if (parcelas) {
        for (const pr of parcelas) {
          const vId = pr.viagem_id;
          const dataPag = String(pr.data_pag).substring(0, 10);
          if (viagensMap[vId]) {
            if (!viagensMap[vId].pagamentos[dataPag]) {
              viagensMap[vId].pagamentos[dataPag] = 0;
            }
            viagensMap[vId].pagamentos[dataPag] += Number(pr.valor);
          }
          pagoGeral += Number(pr.valor);
        }
      }

      let texto = `📄 *EXTRATO DO CLIENTE*\n`;
      texto += `👤 *Nome:* ${cliente.nome_completo}\n`;
      texto += `💳 *Saldo de Crédito:* R$ ${Number(cliente.saldo_credito || 0).toFixed(2)}\n`;
      texto += `--------------------------------------\n\n`;

      const viagensList = Object.values(viagensMap);
      if (viagensList.length === 0) {
        texto += `Nenhuma excursão registrada para este cliente.\n\n`;
      } else {
        for (const v of viagensList) {
          texto += `*${v.nome.toUpperCase()}* - ${v.qtd_adt} PAX (R$ ${v.valor_total.toFixed(2)})\n`;
          const datas = Object.keys(v.pagamentos).sort();
          if (datas.length === 0) {
            texto += `Nenhum pagamento registrado.\n`;
          } else {
            for (const d of datas) {
              const val = v.pagamentos[d];
              const parts = d.split('-');
              const fmtDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
              texto += `R$ ${val.toFixed(2)} - ${fmtDate}\n`;
            }
          }
          texto += `\n`;
        }
      }

      texto += `--------------------------------------\n`;
      texto += `*RESUMO GERAL*\n`;
      texto += `TOTAL PAGO: R$ ${pagoGeral.toFixed(2)}\n`;
      const saldoDevedor = totalGeral - pagoGeral;
      texto += `TOTAL RESTANTE: R$ ${Math.max(0, saldoDevedor).toFixed(2)}\n`;

      return c.json({
        success: true,
        data: {
          cliente,
          texto,
          totalGeral,
          pagoGeral,
          saldoDevedor: Math.max(0, saldoDevedor),
          viagens: viagensList
        }
      });
    } catch (error) {
      console.error('Erro ao gerar extrato:', error);
      return c.json({ success: false, data: null, message: 'Erro ao gerar extrato do cliente.' }, 500);
    }
  }
}
