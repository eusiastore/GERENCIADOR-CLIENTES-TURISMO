import { Context } from 'hono';
import { Bindings, Variables, Viagem } from '../types';
import { registrarHistoricoViagem } from '../utils/db-helpers';

export class ViagemController {
  static async index(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { results } = await c.env.DB.prepare(`
        SELECT
          v.*,
          COUNT(DISTINCT CASE WHEN p.status_cancelamento = 0 THEN p.id END) AS total_passageiros,
          COALESCE(SUM(CASE WHEN p.status_cancelamento = 0 THEN p.valor_total ELSE 0 END), 0) AS total_arrecadado_previsto,
          COALESCE(SUM(CASE WHEN p.status_cancelamento = 0 THEN p.valor_pago ELSE 0 END), 0) AS total_recebido,
          (v.capacidade_maxima - COUNT(DISTINCT CASE WHEN p.status_cancelamento = 0 THEN p.id END)) AS vagas_restantes
        FROM viagens v
        LEFT JOIN passageiros_viagem p ON p.viagem_id = v.id
        GROUP BY v.id
        ORDER BY v.data_viagem ASC
      `).all<Viagem>();

      return c.json({ success: true, data: results });
    } catch (error) {
      console.error('Erro ao listar viagens:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar viagens.' }, 500);
    }
  }

  static async show(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const viagem = await c.env.DB.prepare(
        'SELECT * FROM viagens WHERE id = ? LIMIT 1'
      ).bind(id).first<Viagem>();

      if (!viagem) {
        return c.json({ success: false, data: null, message: 'Viagem não encontrada.' }, 404);
      }

      return c.json({ success: true, data: viagem });
    } catch (error) {
      console.error('Erro ao exibir viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar detalhes da viagem.' }, 500);
    }
  }

  static async resumo(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));

      // Totais de passageiros
      const pax = await c.env.DB.prepare(`
        SELECT
          COUNT(id) AS total_passageiros,
          COALESCE(SUM(valor_total), 0) AS valor_total_previsto,
          COALESCE(SUM(valor_pago), 0) AS valor_total_recebido,
          COALESCE(SUM(valor_total), 0) - COALESCE(SUM(valor_pago), 0) AS a_receber
        FROM passageiros_viagem
        WHERE viagem_id = ? AND status_cancelamento = 0
      `).bind(id).first<{
        total_passageiros: number;
        valor_total_previsto: number;
        valor_total_recebido: number;
        a_receber: number;
      }>();

      // Totais de despesas
      const desp = await c.env.DB.prepare(`
        SELECT
          COALESCE(SUM(valor_custo), 0) AS total_custo_previsto,
          COALESCE(SUM(valor_pago), 0) AS total_despesas_pagas,
          COALESCE(SUM(valor_custo), 0) - COALESCE(SUM(valor_pago), 0) AS saldo_despesas
        FROM despesas_viagem
        WHERE viagem_id = ?
      `).bind(id).first<{
        total_custo_previsto: number;
        total_despesas_pagas: number;
        saldo_despesas: number;
      }>();

      // Viagem info
      const vInfo = await c.env.DB.prepare(
        'SELECT * FROM viagens WHERE id = ? LIMIT 1'
      ).bind(id).first<Viagem>();

      if (!vInfo) {
        return c.json({ success: false, data: null, message: 'Viagem não encontrada.' }, 404);
      }

      const cap = Number(vInfo.capacidade_maxima) || 46;
      const totalPax = Number(pax?.total_passageiros) || 0;
      const totalReceb = Number(pax?.valor_total_recebido) || 0;
      const totalPrev = Number(pax?.valor_total_previsto) || 0;
      const totalDesp = Number(desp?.total_custo_previsto) || 0;
      const despPagas = Number(desp?.total_despesas_pagas) || 0;

      const custoPorPax = totalPax > 0 ? Number((totalDesp / totalPax).toFixed(2)) : 0;
      const lucroAtual = Number((totalReceb - despPagas).toFixed(2));
      const lucroEsperado = Number((totalPrev - totalDesp).toFixed(2));

      return c.json({
        success: true,
        data: {
          viagem: vInfo,
          capacidade_maxima: cap,
          reservas: totalPax,
          vagas_restantes: Math.max(0, cap - totalPax),
          total_passageiros: totalPax,
          valor_total_previsto: totalPrev,
          valor_total_recebido: totalReceb,
          a_receber: Number((totalPrev - totalReceb).toFixed(2)),
          total_custo_previsto: totalDesp,
          total_despesas_pagas: despPagas,
          saldo_despesas: Number((totalDesp - despPagas).toFixed(2)),
          custo_por_pax: custoPorPax,
          lucro_atual: lucroAtual,
          lucro_esperado: lucroEsperado
        }
      });
    } catch (error) {
      console.error('Erro ao gerar resumo da viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao gerar balanço da viagem.' }, 500);
    }
  }

  static async historico(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM historico_viagem WHERE viagem_id = ? ORDER BY created_at DESC'
      ).bind(id).all();

      return c.json({ success: true, data: results });
    } catch (error) {
      console.error('Erro ao buscar histórico da viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar histórico da viagem.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const {
        nome_destino,
        data_viagem,
        capacidade_maxima = 46,
        ultima_data_pagamento,
        status = 'ativa',
        observacoes,
        valor_padrao = 0
      } = await c.req.json();

      if (!nome_destino || !data_viagem) {
        return c.json({ success: false, data: null, message: 'Destino e data da viagem são obrigatórios.' }, 422);
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO viagens (
          nome_destino, data_viagem, capacidade_maxima, ultima_data_pagamento, status, observacoes, valor_padrao
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        String(nome_destino).trim(),
        String(data_viagem),
        Number(capacidade_maxima),
        ultima_data_pagamento || null,
        status,
        observacoes || null,
        Number(valor_padrao)
      ).run();

      const newId = Number(result.meta.last_row_id);
      await registrarHistoricoViagem(c.env.DB, newId, null, 'Viagem Criada', `Viagem para ${nome_destino} cadastrada com sucesso.`);

      const viagem = await c.env.DB.prepare('SELECT * FROM viagens WHERE id = ?').bind(newId).first();
      return c.json({ success: true, data: viagem, message: 'Viagem criada com sucesso!' }, 201);
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao cadastrar viagem.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const {
        nome_destino,
        data_viagem,
        capacidade_maxima,
        ultima_data_pagamento,
        status,
        observacoes,
        valor_padrao
      } = await c.req.json();

      const existing = await c.env.DB.prepare('SELECT * FROM viagens WHERE id = ?').bind(id).first<Viagem>();
      if (!existing) {
        return c.json({ success: false, data: null, message: 'Viagem não encontrada.' }, 404);
      }

      await c.env.DB.prepare(`
        UPDATE viagens SET
          nome_destino = COALESCE(?, nome_destino),
          data_viagem = COALESCE(?, data_viagem),
          capacidade_maxima = COALESCE(?, capacidade_maxima),
          ultima_data_pagamento = ?,
          status = COALESCE(?, status),
          observacoes = ?,
          valor_padrao = COALESCE(?, valor_padrao),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        nome_destino ? String(nome_destino).trim() : null,
        data_viagem || null,
        capacidade_maxima !== undefined ? Number(capacidade_maxima) : null,
        ultima_data_pagamento !== undefined ? (ultima_data_pagamento || null) : existing.ultima_data_pagamento,
        status || null,
        observacoes !== undefined ? (observacoes || null) : existing.observacoes,
        valor_padrao !== undefined ? Number(valor_padrao) : null,
        id
      ).run();

      await registrarHistoricoViagem(c.env.DB, id, null, 'Viagem Atualizada', 'Informações da viagem foram atualizadas.');

      const updated = await c.env.DB.prepare('SELECT * FROM viagens WHERE id = ?').bind(id).first();
      return c.json({ success: true, data: updated, message: 'Viagem atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar viagem.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      await c.env.DB.prepare('DELETE FROM viagens WHERE id = ?').bind(id).run();
      return c.json({ success: true, data: null, message: 'Viagem removida com sucesso!' });
    } catch (error) {
      console.error('Erro ao deletar viagem:', error);
      return c.json({ success: false, data: null, message: 'Erro ao remover viagem.' }, 500);
    }
  }
}
