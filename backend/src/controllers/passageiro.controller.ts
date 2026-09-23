import { Context } from 'hono';
import { Bindings, Variables, PassageiroViagem, ParcelaPassageiro } from '../types';
import { registrarHistoricoViagem } from '../utils/db-helpers';

export class PassageiroController {
  static async byViagem(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const viagemId = Number(c.req.param('id'));

      const { results: passageiros } = await c.env.DB.prepare(`
        SELECT p.*, c.nome_completo as nome_titular, c.cpf as cpf_titular, c.saldo_credito as saldo_credito_titular
        FROM passageiros_viagem p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.viagem_id = ?
        ORDER BY p.id ASC
      `).bind(viagemId).all<PassageiroViagem>();

      if (!passageiros || passageiros.length === 0) {
        return c.json({ success: true, data: [] });
      }

      const paxIds = passageiros.map(p => p.id);
      const placeholders = paxIds.map(() => '?').join(',');
      const { results: parcelas } = await c.env.DB.prepare(`
        SELECT * FROM parcelas_passageiro
        WHERE passageiro_id IN (${placeholders})
        ORDER BY passageiro_id ASC, numero_parcela ASC
      `).bind(...paxIds).all<ParcelaPassageiro>();

      const parcelasMap: Record<number, ParcelaPassageiro[]> = {};
      if (parcelas) {
        for (const parc of parcelas) {
          if (!parcelasMap[parc.passageiro_id]) {
            parcelasMap[parc.passageiro_id] = [];
          }
          parcelasMap[parc.passageiro_id].push(parc);
        }
      }

      const resultado = passageiros.map(p => ({
        ...p,
        parcelas: parcelasMap[p.id] || []
      }));

      return c.json({ success: true, data: resultado });
    } catch (error) {
      console.error('Erro ao listar passageiros por viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar passageiros da viagem.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const {
        viagem_id,
        cliente_id,
        nome,
        contato_whatsapp,
        forma_pagamento = 'pix',
        observacoes,
        valor_total = 0,
        valor_pago = 0,
        num_parcelas = 1,
        parcelas
      } = await c.req.json();

      if (!viagem_id || !nome) {
        return c.json({ success: false, data: null, message: 'Viagem e Nome do passageiro são obrigatórios.' }, 422);
      }

      const cleanNome = String(nome).trim().toUpperCase();
      const nParcelas = Number(num_parcelas) >= 0 ? Number(num_parcelas) : 1;
      const vTotal = Number(valor_total) || 0;
      const vPago = Number(valor_pago) || 0;

      const resPax = await c.env.DB.prepare(`
        INSERT INTO passageiros_viagem (
          viagem_id, cliente_id, nome, contato_whatsapp, forma_pagamento, observacoes, valor_total, valor_pago, num_parcelas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        Number(viagem_id),
        cliente_id ? Number(cliente_id) : null,
        cleanNome,
        contato_whatsapp || null,
        forma_pagamento,
        observacoes || null,
        vTotal,
        vPago,
        nParcelas
      ).run();

      const passageiroId = Number(resPax.meta.last_row_id);

      // Gerar parcelas
      if (Array.isArray(parcelas) && parcelas.length > 0) {
        for (const p of parcelas) {
          const status = p.status_pagamento || 'pendente';
          const forma = p.forma_pagamento || forma_pagamento;
          const valor = Number(p.valor) || 0;

          await c.env.DB.prepare(`
            INSERT INTO parcelas_passageiro (
              passageiro_id, numero_parcela, valor, data_vencimento, data_pagamento, status_pagamento, forma_pagamento
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            passageiroId,
            Number(p.numero_parcela),
            valor,
            p.data_vencimento || null,
            p.data_pagamento || null,
            status,
            forma
          ).run();

          // Se pago com crédito da agência na criação
          if (status === 'pago' && forma === 'credito_agencia' && cliente_id) {
            await c.env.DB.prepare(
              'UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?'
            ).bind(valor, Number(cliente_id)).run();

            await c.env.DB.prepare(`
              INSERT INTO historico_creditos (cliente_id, tipo, valor, descricao)
              VALUES (?, 'saida', ?, ?)
            `).bind(
              Number(cliente_id),
              valor,
              `Abatimento para parcela ${p.numero_parcela} do passageiro ${cleanNome}.`
            ).run();
          }
        }
      } else if (nParcelas > 0) {
        // Gera parcelas automáticas
        const valorPorParcela = Number((vTotal / nParcelas).toFixed(2));
        for (let i = 1; i <= nParcelas; i++) {
          await c.env.DB.prepare(`
            INSERT INTO parcelas_passageiro (
              passageiro_id, numero_parcela, valor, status_pagamento, forma_pagamento
            ) VALUES (?, ?, ?, 'pendente', ?)
          `).bind(
            passageiroId,
            i,
            valorPorParcela,
            forma_pagamento
          ).run();
        }
      }

      // Recalcular valor pago
      const somaPaga = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(valor), 0) AS total
        FROM parcelas_passageiro
        WHERE passageiro_id = ? AND status_pagamento = 'pago'
      `).bind(passageiroId).first<{ total: number }>();

      await c.env.DB.prepare(`
        UPDATE passageiros_viagem SET valor_pago = ? WHERE id = ?
      `).bind(Number(somaPaga?.total || 0), passageiroId).run();

      await registrarHistoricoViagem(
        c.env.DB,
        Number(viagem_id),
        cleanNome,
        'Passageiro Cadastrado',
        `Passageiro ${cleanNome} adicionado na viagem no valor de R$ ${vTotal.toFixed(2)}.`
      );

      const paxCriado = await c.env.DB.prepare(
        'SELECT * FROM passageiros_viagem WHERE id = ?'
      ).bind(passageiroId).first();

      return c.json({ success: true, data: paxCriado, message: 'Passageiro adicionado com sucesso!' }, 201);
    } catch (error) {
      console.error('Erro ao cadastrar passageiro:', error);
      return c.json({ success: false, data: null, message: 'Erro ao cadastrar passageiro.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const {
        cliente_id,
        nome,
        contato_whatsapp,
        forma_pagamento,
        observacoes,
        valor_total,
        status_cancelamento,
        multa_cancelamento
      } = await c.req.json();

      const pax = await c.env.DB.prepare(
        'SELECT * FROM passageiros_viagem WHERE id = ? LIMIT 1'
      ).bind(id).first<PassageiroViagem>();

      if (!pax) {
        return c.json({ success: false, data: null, message: 'Passageiro não encontrado.' }, 404);
      }

      const cleanNome = nome ? String(nome).trim().toUpperCase() : pax.nome;

      await c.env.DB.prepare(`
        UPDATE passageiros_viagem SET
          cliente_id = ?,
          nome = ?,
          contato_whatsapp = ?,
          forma_pagamento = COALESCE(?, forma_pagamento),
          observacoes = ?,
          valor_total = COALESCE(?, valor_total),
          status_cancelamento = COALESCE(?, status_cancelamento),
          multa_cancelamento = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        cliente_id !== undefined ? (cliente_id ? Number(cliente_id) : null) : pax.cliente_id,
        cleanNome,
        contato_whatsapp !== undefined ? (contato_whatsapp || null) : pax.contato_whatsapp,
        forma_pagamento || null,
        observacoes !== undefined ? (observacoes || null) : pax.observacoes,
        valor_total !== undefined ? Number(valor_total) : null,
        status_cancelamento !== undefined ? Number(status_cancelamento) : null,
        multa_cancelamento !== undefined ? (Number(multa_cancelamento) || 0) : pax.multa_cancelamento,
        id
      ).run();

      if (status_cancelamento !== undefined && Number(status_cancelamento) !== pax.status_cancelamento) {
        const acao = Number(status_cancelamento) === 1 ? 'Passageiro Cancelado' : 'Cancelamento Revertido';
        await registrarHistoricoViagem(
          c.env.DB,
          pax.viagem_id,
          cleanNome,
          acao,
          `Status de cancelamento alterado. Multa: R$ ${multa_cancelamento || 0}`
        );
      }

      const updated = await c.env.DB.prepare('SELECT * FROM passageiros_viagem WHERE id = ?').bind(id).first();
      return c.json({ success: true, data: updated, message: 'Passageiro atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar passageiro:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar passageiro.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));

      const pax = await c.env.DB.prepare(
        'SELECT * FROM passageiros_viagem WHERE id = ? LIMIT 1'
      ).bind(id).first<PassageiroViagem>();

      if (pax) {
        await registrarHistoricoViagem(
          c.env.DB,
          pax.viagem_id,
          pax.nome,
          'Passageiro Excluído',
          `Passageiro ${pax.nome} foi removido da viagem.`
        );
      }

      await c.env.DB.prepare('DELETE FROM passageiros_viagem WHERE id = ?').bind(id).run();
      return c.json({ success: true, data: null, message: 'Passageiro removido com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir passageiro:', error);
      return c.json({ success: false, data: null, message: 'Erro ao remover passageiro.' }, 500);
    }
  }
}
