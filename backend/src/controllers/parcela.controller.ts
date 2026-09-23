import { Context } from 'hono';
import { Bindings, Variables, ParcelaPassageiro } from '../types';

export class ParcelaController {
  static async byPassageiro(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const passageiroId = Number(c.req.param('passageiroId'));
      const { results } = await c.env.DB.prepare(`
        SELECT * FROM parcelas_passageiro
        WHERE passageiro_id = ?
        ORDER BY numero_parcela ASC
      `).bind(passageiroId).all<ParcelaPassageiro>();

      return c.json({ success: true, data: results });
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar parcelas.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { passageiro_id, parcelas, append } = await c.req.json();

      if (!passageiro_id || !Array.isArray(parcelas) || parcelas.length === 0) {
        return c.json({ success: false, data: null, message: 'Passageiro e lista de parcelas são obrigatórios.' }, 422);
      }

      const pId = Number(passageiro_id);

      if (!append) {
        await c.env.DB.prepare('DELETE FROM parcelas_passageiro WHERE passageiro_id = ?').bind(pId).run();
      }

      const paxInfo = await c.env.DB.prepare(`
        SELECT p.viagem_id, p.nome, p.cliente_id, p.valor_total
        FROM passageiros_viagem p
        WHERE p.id = ?
      `).bind(pId).first<{ viagem_id: number; nome: string; cliente_id: number | null; valor_total: number }>();

      for (const parc of parcelas) {
        const status = parc.status_pagamento || 'pendente';
        const forma = parc.forma_pagamento || null;
        const valor = Number(parc.valor) || 0;

        // Se está adicionando uma parcela paga (avulsa), abater de parcelas pendentes existentes
        if (append && status === 'pago' && valor > 0) {
          const { results: pendingRows } = await c.env.DB.prepare(`
            SELECT id, numero_parcela, valor
            FROM parcelas_passageiro
            WHERE passageiro_id = ? AND status_pagamento != 'pago'
            ORDER BY numero_parcela ASC
          `).bind(pId).all<{ id: number; numero_parcela: number; valor: number }>();

          let restanteParaAbater = valor;
          if (pendingRows) {
            for (const pend of pendingRows) {
              if (restanteParaAbater <= 0) break;
              const valPend = Number(pend.valor) || 0;

              if (valPend <= restanteParaAbater) {
                restanteParaAbater -= valPend;
                await c.env.DB.prepare('DELETE FROM parcelas_passageiro WHERE id = ?').bind(pend.id).run();
              } else {
                const novoSaldoPend = Number((valPend - restanteParaAbater).toFixed(2));
                await c.env.DB.prepare('UPDATE parcelas_passageiro SET valor = ? WHERE id = ?').bind(novoSaldoPend, pend.id).run();
                restanteParaAbater = 0;
              }
            }
          }
        }

        await c.env.DB.prepare(`
          INSERT INTO parcelas_passageiro (
            passageiro_id, numero_parcela, valor, data_vencimento, data_pagamento, status_pagamento, forma_pagamento
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          pId,
          Number(parc.numero_parcela) || 1,
          valor,
          parc.data_vencimento || null,
          status === 'pago' ? (parc.data_pagamento || new Date().toISOString().substring(0, 10)) : null,
          status,
          forma
        ).run();

        // Se baixada com credito_agencia
        if (status === 'pago' && forma === 'credito_agencia' && paxInfo?.cliente_id) {
          const clienteId = Number(paxInfo.cliente_id);
          await c.env.DB.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').bind(valor, clienteId).run();
          await c.env.DB.prepare(`
            INSERT INTO historico_creditos (cliente_id, tipo, valor, descricao)
            VALUES (?, 'saida', ?, ?)
          `).bind(clienteId, valor, `Abatimento para parcela ${parc.numero_parcela} do passageiro ${paxInfo.nome}.`).run();
        }
      }

      // Recalcular valor pago do passageiro
      const sumRow = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(valor), 0) as total_pago
        FROM parcelas_passageiro
        WHERE passageiro_id = ? AND status_pagamento = 'pago'
      `).bind(pId).first<{ total_pago: number }>();

      const totalPagoAtual = Number(sumRow?.total_pago || 0);
      const valorTotalViagem = Number(paxInfo?.valor_total || 0);

      // Se o total pago atingiu ou superou o valor total do passageiro, limpar parcelas pendentes residuais
      if (totalPagoAtual >= valorTotalViagem && valorTotalViagem > 0) {
        await c.env.DB.prepare(`
          DELETE FROM parcelas_passageiro
          WHERE passageiro_id = ? AND status_pagamento != 'pago'
        `).bind(pId).run();
      }

      // Renumerar todas as parcelas do passageiro de forma limpa
      const { results: allParcelas } = await c.env.DB.prepare(`
        SELECT id FROM parcelas_passageiro
        WHERE passageiro_id = ?
        ORDER BY id ASC
      `).bind(pId).all<{ id: number }>();

      if (allParcelas) {
        for (let i = 0; i < allParcelas.length; i++) {
          await c.env.DB.prepare('UPDATE parcelas_passageiro SET numero_parcela = ? WHERE id = ?').bind(i + 1, allParcelas[i].id).run();
        }
      }

      await c.env.DB.prepare(`
        UPDATE passageiros_viagem SET valor_pago = ? WHERE id = ?
      `).bind(totalPagoAtual, pId).run();

      // Registrar histórico
      if (paxInfo?.viagem_id) {
        const totalAdicionado = parcelas.reduce((acc: number, pr: any) => acc + (Number(pr.valor) || 0), 0);
        await c.env.DB.prepare(`
          INSERT INTO historico_viagem (viagem_id, passageiro_nome, acao, detalhes) VALUES (?, ?, ?, ?)
        `).bind(
          paxInfo.viagem_id,
          paxInfo.nome ? String(paxInfo.nome).toUpperCase().trim() : 'SISTEMA',
          'Parcela Adicionada',
          `${parcelas.length} nova(s) parcela(s) lançada(s) totalizando R$ ${totalAdicionado.toFixed(2)}.`
        ).run();
      }

      const { results: updatedParcelas } = await c.env.DB.prepare(`
        SELECT * FROM parcelas_passageiro WHERE passageiro_id = ? ORDER BY numero_parcela ASC
      `).bind(pId).all();

      return c.json({ success: true, data: updatedParcelas, message: 'Parcelas salvas com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar parcelas:', error);
      return c.json({ success: false, data: null, message: 'Erro ao processar parcelas.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const { status_pagamento, data_pagamento, valor, data_vencimento, forma_pagamento } = await c.req.json();

      const atual = await c.env.DB.prepare(`
        SELECT pp.*, p.viagem_id, p.nome as passageiro_nome, p.cliente_id, p.valor_total
        FROM parcelas_passageiro pp
        JOIN passageiros_viagem p ON pp.passageiro_id = p.id
        WHERE pp.id = ?
        LIMIT 1
      `).bind(id).first<{
        id: number;
        passageiro_id: number;
        numero_parcela: number;
        valor: number;
        data_vencimento: string | null;
        data_pagamento: string | null;
        status_pagamento: string;
        forma_pagamento: string | null;
        viagem_id: number;
        passageiro_nome: string;
        cliente_id: number | null;
        valor_total: number;
      }>();

      if (!atual) {
        return c.json({ success: false, data: null, message: 'Parcela não encontrada.' }, 404);
      }

      const novoStatus = status_pagamento || atual.status_pagamento;
      const novaForma = forma_pagamento !== undefined ? forma_pagamento : atual.forma_pagamento;
      const valorFinal = valor !== undefined ? Number(valor) : Number(atual.valor);
      const finalDataPag = novoStatus === 'pago' ? (data_pagamento || atual.data_pagamento || new Date().toISOString().substring(0, 10)) : null;

      await c.env.DB.prepare(`
        UPDATE parcelas_passageiro SET
          status_pagamento = ?,
          data_pagamento = ?,
          valor = ?,
          data_vencimento = ?,
          forma_pagamento = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        novoStatus,
        finalDataPag,
        valorFinal,
        data_vencimento !== undefined ? (data_vencimento || null) : atual.data_vencimento,
        novaForma,
        id
      ).run();

      // Se marcando como pago pela primeira vez com crédito de agência
      if (novoStatus === 'pago' && atual.status_pagamento !== 'pago' && novaForma === 'credito_agencia' && atual.cliente_id) {
        const clienteId = Number(atual.cliente_id);
        await c.env.DB.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').bind(valorFinal, clienteId).run();
        await c.env.DB.prepare(`
          INSERT INTO historico_creditos (cliente_id, tipo, valor, descricao)
          VALUES (?, 'saida', ?, ?)
        `).bind(clienteId, valorFinal, `Baixa da parcela ${atual.numero_parcela} do passageiro ${atual.passageiro_nome}.`).run();
      }

      // Recalcular valor pago do passageiro
      const sumRow = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(valor), 0) as total_pago
        FROM parcelas_passageiro
        WHERE passageiro_id = ? AND status_pagamento = 'pago'
      `).bind(atual.passageiro_id).first<{ total_pago: number }>();

      const totalPagoAtual = Number(sumRow?.total_pago || 0);
      const valorTotalViagem = Number(atual.valor_total || 0);

      // Se o total pago atingiu ou superou o valor total, limpar pendentes residuais
      if (totalPagoAtual >= valorTotalViagem && valorTotalViagem > 0) {
        await c.env.DB.prepare(`
          DELETE FROM parcelas_passageiro
          WHERE passageiro_id = ? AND status_pagamento != 'pago'
        `).bind(atual.passageiro_id).run();
      }

      // Renumerar parcelas
      const { results: allParcelas } = await c.env.DB.prepare(`
        SELECT id FROM parcelas_passageiro
        WHERE passageiro_id = ?
        ORDER BY id ASC
      `).bind(atual.passageiro_id).all<{ id: number }>();

      if (allParcelas) {
        for (let i = 0; i < allParcelas.length; i++) {
          await c.env.DB.prepare('UPDATE parcelas_passageiro SET numero_parcela = ? WHERE id = ?').bind(i + 1, allParcelas[i].id).run();
        }
      }

      await c.env.DB.prepare(`
        UPDATE passageiros_viagem SET valor_pago = ? WHERE id = ?
      `).bind(totalPagoAtual, atual.passageiro_id).run();

      // Registrar histórico
      if (status_pagamento && status_pagamento !== atual.status_pagamento) {
        const acao = status_pagamento === 'pago' ? 'Pagamento Recebido' : 'Pagamento Estornado';
        await c.env.DB.prepare(`
          INSERT INTO historico_viagem (viagem_id, passageiro_nome, acao, detalhes) VALUES (?, ?, ?, ?)
        `).bind(
          atual.viagem_id,
          atual.passageiro_nome ? String(atual.passageiro_nome).toUpperCase().trim() : 'SISTEMA',
          acao,
          `Parcela #${atual.numero_parcela} alterada para ${status_pagamento.toUpperCase()} (R$ ${valorFinal.toFixed(2)} - Forma: ${String(novaForma).toUpperCase()}).`
        ).run();
      }

      const resAtual = await c.env.DB.prepare('SELECT * FROM parcelas_passageiro WHERE id = ?').bind(id).first();
      return c.json({ success: true, data: resAtual, message: 'Parcela atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar parcela.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));

      const parc = await c.env.DB.prepare(`
        SELECT pp.*, p.viagem_id, p.nome as passageiro_nome
        FROM parcelas_passageiro pp
        JOIN passageiros_viagem p ON pp.passageiro_id = p.id
        WHERE pp.id = ?
        LIMIT 1
      `).bind(id).first<{
        id: number;
        passageiro_id: number;
        numero_parcela: number;
        valor: number;
        status_pagamento: string;
        viagem_id: number;
        passageiro_nome: string;
      }>();

      if (!parc) {
        return c.json({ success: false, data: null, message: 'Parcela não encontrada.' }, 404);
      }

      const pId = parc.passageiro_id;
      const valorParc = Number(parc.valor) || 0;

      await c.env.DB.prepare('DELETE FROM parcelas_passageiro WHERE id = ?').bind(id).run();

      // Renumerar parcelas restantes
      const { results: allParcelas } = await c.env.DB.prepare(`
        SELECT id FROM parcelas_passageiro
        WHERE passageiro_id = ?
        ORDER BY id ASC
      `).bind(pId).all<{ id: number }>();

      if (allParcelas) {
        for (let i = 0; i < allParcelas.length; i++) {
          await c.env.DB.prepare('UPDATE parcelas_passageiro SET numero_parcela = ? WHERE id = ?').bind(i + 1, allParcelas[i].id).run();
        }
      }

      // Recalcular valor pago
      const sumRow = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(valor), 0) as total_pago
        FROM parcelas_passageiro
        WHERE passageiro_id = ? AND status_pagamento = 'pago'
      `).bind(pId).first<{ total_pago: number }>();

      const totalPagoAtual = Number(sumRow?.total_pago || 0);

      await c.env.DB.prepare(`
        UPDATE passageiros_viagem SET valor_pago = ? WHERE id = ?
      `).bind(totalPagoAtual, pId).run();

      // Registrar no histórico da viagem
      await c.env.DB.prepare(`
        INSERT INTO historico_viagem (viagem_id, passageiro_nome, acao, detalhes) VALUES (?, ?, ?, ?)
      `).bind(
        Number(parc.viagem_id),
        parc.passageiro_nome ? String(parc.passageiro_nome).toUpperCase().trim() : 'SISTEMA',
        'Parcela Excluída',
        `Parcela #${parc.numero_parcela} no valor de R$ ${valorParc.toFixed(2)} (${String(parc.status_pagamento).toUpperCase()}) foi excluída permanentemente.`
      ).run();

      return c.json({ success: true, data: null, message: 'Parcela excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir parcela:', error);
      return c.json({ success: false, data: null, message: 'Erro ao excluir parcela.' }, 500);
    }
  }
}
