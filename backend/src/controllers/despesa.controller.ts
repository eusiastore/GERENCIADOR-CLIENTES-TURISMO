import { Context } from 'hono';
import { Bindings, Variables, DespesaViagem } from '../types';
import { registrarHistoricoViagem } from '../utils/db-helpers';

export class DespesaController {
  static async byViagem(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const viagemId = Number(c.req.param('viagemId'));
      const { results } = await c.env.DB.prepare(`
        SELECT * FROM despesas_viagem
        WHERE viagem_id = ?
        ORDER BY categoria ASC
      `).bind(viagemId).all<DespesaViagem>();

      return c.json({ success: true, data: results });
    } catch (error) {
      console.error('Erro ao listar despesas:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar despesas da viagem.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const {
        viagem_id,
        categoria,
        descricao,
        valor_custo,
        valor_pago = 0,
        entrada_valor = 0,
        data_reserva,
        parcela_1_valor = 0,
        parcela_1_data,
        parcela_2_valor = 0,
        parcela_2_data,
        parcela_3_valor = 0,
        parcela_3_data,
        parcela_4_valor = 0,
        parcela_4_data,
        empresa,
        contato_empresa,
        observacoes
      } = await c.req.json();

      if (!viagem_id || !categoria || valor_custo === undefined) {
        return c.json({ success: false, data: null, message: 'Viagem, categoria e valor de custo são obrigatórios.' }, 422);
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO despesas_viagem (
          viagem_id, categoria, descricao, valor_custo, valor_pago,
          entrada_valor, data_reserva,
          parcela_1_valor, parcela_1_data,
          parcela_2_valor, parcela_2_data,
          parcela_3_valor, parcela_3_data,
          parcela_4_valor, parcela_4_data,
          empresa, contato_empresa, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        Number(viagem_id),
        categoria,
        descricao || null,
        Number(valor_custo),
        Number(valor_pago),
        Number(entrada_valor),
        data_reserva || null,
        Number(parcela_1_valor),
        parcela_1_data || null,
        Number(parcela_2_valor),
        parcela_2_data || null,
        Number(parcela_3_valor),
        parcela_3_data || null,
        Number(parcela_4_valor),
        parcela_4_data || null,
        empresa || null,
        contato_empresa || null,
        observacoes || null
      ).run();

      const newId = Number(result.meta.last_row_id);
      await registrarHistoricoViagem(
        c.env.DB,
        Number(viagem_id),
        'DESPESA',
        'Despesa Adicionada',
        `Categoria: ${String(categoria).toUpperCase()} no valor de R$ ${Number(valor_custo).toFixed(2)}`
      );

      const newDesp = await c.env.DB.prepare('SELECT * FROM despesas_viagem WHERE id = ?').bind(newId).first();
      return c.json({ success: true, data: newDesp, message: 'Despesa cadastrada com sucesso!' }, 201);
    } catch (error) {
      console.error('Erro ao cadastrar despesa:', error);
      return c.json({ success: false, data: null, message: 'Erro ao cadastrar despesa.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const existing = await c.env.DB.prepare('SELECT * FROM despesas_viagem WHERE id = ? LIMIT 1').bind(id).first<DespesaViagem>();

      if (!existing) {
        return c.json({ success: false, data: null, message: 'Despesa não encontrada.' }, 404);
      }

      const {
        categoria,
        descricao,
        valor_custo,
        valor_pago,
        entrada_valor,
        data_reserva,
        parcela_1_valor,
        parcela_1_data,
        parcela_2_valor,
        parcela_2_data,
        parcela_3_valor,
        parcela_3_data,
        parcela_4_valor,
        parcela_4_data,
        empresa,
        contato_empresa,
        observacoes
      } = await c.req.json();

      await c.env.DB.prepare(`
        UPDATE despesas_viagem SET
          categoria = COALESCE(?, categoria),
          descricao = ?,
          valor_custo = COALESCE(?, valor_custo),
          valor_pago = COALESCE(?, valor_pago),
          entrada_valor = ?,
          data_reserva = ?,
          parcela_1_valor = ?,
          parcela_1_data = ?,
          parcela_2_valor = ?,
          parcela_2_data = ?,
          parcela_3_valor = ?,
          parcela_3_data = ?,
          parcela_4_valor = ?,
          parcela_4_data = ?,
          empresa = ?,
          contato_empresa = ?,
          observacoes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        categoria || null,
        descricao !== undefined ? (descricao || null) : existing.descricao,
        valor_custo !== undefined ? Number(valor_custo) : null,
        valor_pago !== undefined ? Number(valor_pago) : null,
        entrada_valor !== undefined ? Number(entrada_valor) : existing.entrada_valor,
        data_reserva !== undefined ? (data_reserva || null) : existing.data_reserva,
        parcela_1_valor !== undefined ? Number(parcela_1_valor) : existing.parcela_1_valor,
        parcela_1_data !== undefined ? (parcela_1_data || null) : existing.parcela_1_data,
        parcela_2_valor !== undefined ? Number(parcela_2_valor) : existing.parcela_2_valor,
        parcela_2_data !== undefined ? (parcela_2_data || null) : existing.parcela_2_data,
        parcela_3_valor !== undefined ? Number(parcela_3_valor) : existing.parcela_3_valor,
        parcela_3_data !== undefined ? (parcela_3_data || null) : existing.parcela_3_data,
        parcela_4_valor !== undefined ? Number(parcela_4_valor) : existing.parcela_4_valor,
        parcela_4_data !== undefined ? (parcela_4_data || null) : existing.parcela_4_data,
        empresa !== undefined ? (empresa || null) : existing.empresa,
        contato_empresa !== undefined ? (contato_empresa || null) : existing.contato_empresa,
        observacoes !== undefined ? (observacoes || null) : existing.observacoes,
        id
      ).run();

      await registrarHistoricoViagem(
        c.env.DB,
        existing.viagem_id,
        'DESPESA',
        'Despesa Editada',
        `Uma despesa de ${String(existing.categoria).toUpperCase()} foi atualizada.`
      );

      const updated = await c.env.DB.prepare('SELECT * FROM despesas_viagem WHERE id = ?').bind(id).first();
      return c.json({ success: true, data: updated, message: 'Despesa atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar despesa.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const existing = await c.env.DB.prepare('SELECT * FROM despesas_viagem WHERE id = ? LIMIT 1').bind(id).first<DespesaViagem>();

      if (existing) {
        await registrarHistoricoViagem(
          c.env.DB,
          existing.viagem_id,
          'DESPESA',
          'Despesa Excluída',
          `A despesa de ${String(existing.categoria).toUpperCase()} foi removida.`
        );
      }

      await c.env.DB.prepare('DELETE FROM despesas_viagem WHERE id = ?').bind(id).run();
      return c.json({ success: true, data: null, message: 'Despesa excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      return c.json({ success: false, data: null, message: 'Erro ao excluir despesa.' }, 500);
    }
  }
}
