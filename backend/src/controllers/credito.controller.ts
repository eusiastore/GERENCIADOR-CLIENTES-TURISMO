import { Context } from 'hono';
import { Bindings, Variables, Cliente, HistoricoCredito } from '../types';

export class CreditoController {
  static async index(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { results: resumo } = await c.env.DB.prepare(`
        SELECT id as cliente_id, nome_completo, cpf, saldo_credito
        FROM clientes
        WHERE saldo_credito > 0
        ORDER BY nome_completo ASC
      `).all<{ cliente_id: number; nome_completo: string; cpf: string; saldo_credito: number }>();

      const { results: historico } = await c.env.DB.prepare(`
        SELECT h.*, c.nome_completo, c.cpf
        FROM historico_creditos h
        JOIN clientes c ON h.cliente_id = c.id
        ORDER BY h.created_at DESC
      `).all<HistoricoCredito>();

      return c.json({
        success: true,
        data: {
          resumo: resumo || [],
          historico: historico || []
        }
      });
    } catch (error) {
      console.error('Erro ao listar créditos:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar créditos.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { cliente_id, valor, tipo, descricao } = await c.req.json();

      if (!cliente_id || !valor || !tipo) {
        return c.json({ success: false, data: null, message: 'Cliente, valor e tipo (entrada/saida) são obrigatórios.' }, 422);
      }

      const numValor = Number(valor);
      const cId = Number(cliente_id);

      if (numValor <= 0) {
        return c.json({ success: false, data: null, message: 'O valor deve ser maior que zero.' }, 422);
      }

      await c.env.DB.prepare(`
        INSERT INTO historico_creditos (cliente_id, tipo, valor, descricao)
        VALUES (?, ?, ?, ?)
      `).bind(cId, tipo, numValor, descricao || null).run();

      if (tipo === 'entrada') {
        await c.env.DB.prepare('UPDATE clientes SET saldo_credito = saldo_credito + ? WHERE id = ?').bind(numValor, cId).run();
      } else {
        await c.env.DB.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').bind(numValor, cId).run();
      }

      const clienteAtualizado = await c.env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(cId).first<Cliente>();
      return c.json({ success: true, data: clienteAtualizado, message: 'Crédito registrado com sucesso!' }, 201);
    } catch (error) {
      console.error('Erro ao registrar crédito:', error);
      return c.json({ success: false, data: null, message: 'Erro ao registrar crédito.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const { descricao } = await c.req.json();

      await c.env.DB.prepare('UPDATE historico_creditos SET descricao = ? WHERE id = ?').bind(descricao || null, id).run();
      return c.json({ success: true, data: null, message: 'Descrição do crédito atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar crédito:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar crédito.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const hist = await c.env.DB.prepare('SELECT * FROM historico_creditos WHERE id = ? LIMIT 1').bind(id).first<{
        id: number;
        cliente_id: number;
        tipo: string;
        valor: number;
      }>();

      if (!hist) {
        return c.json({ success: false, data: null, message: 'Registro de crédito não encontrado.' }, 404);
      }

      const valor = Number(hist.valor);
      const cId = Number(hist.cliente_id);

      // Estornar saldo
      if (hist.tipo === 'entrada') {
        await c.env.DB.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').bind(valor, cId).run();
      } else {
        await c.env.DB.prepare('UPDATE clientes SET saldo_credito = saldo_credito + ? WHERE id = ?').bind(valor, cId).run();
      }

      await c.env.DB.prepare('DELETE FROM historico_creditos WHERE id = ?').bind(id).run();

      return c.json({ success: true, data: null, message: 'Crédito excluído e estornado com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir crédito:', error);
      return c.json({ success: false, data: null, message: 'Erro ao excluir crédito.' }, 500);
    }
  }
}
