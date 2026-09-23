import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { Bindings, Variables, Usuario } from '../types';

export class UsuarioController {
  static async index(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { results } = await c.env.DB.prepare(`
        SELECT id, nome, email, role, status, created_at, updated_at
        FROM usuarios
        ORDER BY id ASC
      `).all<Usuario>();

      return c.json({ success: true, data: results, message: 'Lista de usuários recuperada com sucesso.' });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar usuários.' }, 500);
    }
  }

  static async show(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const user = c.get('user');

      if (user?.role !== 'admin' && user?.id !== id) {
        return c.json({ success: false, data: null, message: 'Acesso negado.' }, 403);
      }

      const dbUser = await c.env.DB.prepare(`
        SELECT id, nome, email, role, status, created_at, updated_at
        FROM usuarios
        WHERE id = ?
        LIMIT 1
      `).bind(id).first<Usuario>();

      if (!dbUser) {
        return c.json({ success: false, data: null, message: 'Usuário não encontrado.' }, 404);
      }

      return c.json({ success: true, data: dbUser });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return c.json({ success: false, data: null, message: 'Erro ao buscar usuário.' }, 500);
    }
  }

  static async store(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { nome, email, senha, role = 'usuario', status = 'ativo' } = await c.req.json();

      if (!nome || !email || !senha) {
        return c.json({ success: false, data: null, message: 'Nome, e-mail e senha são obrigatórios.' }, 422);
      }

      if (String(nome).trim().length < 2) {
        return c.json({ success: false, data: null, message: 'O nome deve ter no mínimo 2 caracteres.' }, 422);
      }

      if (String(senha).length < 6) {
        return c.json({ success: false, data: null, message: 'A senha deve ter no mínimo 6 caracteres.' }, 422);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existing = await c.env.DB.prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1').bind(cleanEmail).first();

      if (existing) {
        return c.json({ success: false, data: null, message: 'Este e-mail já está cadastrado.' }, 409);
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const result = await c.env.DB.prepare(`
        INSERT INTO usuarios (nome, email, senha, role, status)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        String(nome).trim(),
        cleanEmail,
        senhaHash,
        role === 'admin' ? 'admin' : 'usuario',
        status === 'inativo' ? 'inativo' : 'ativo'
      ).run();

      const newId = Number(result.meta.last_row_id);
      const newUser = await c.env.DB.prepare(`
        SELECT id, nome, email, role, status, created_at, updated_at
        FROM usuarios WHERE id = ?
      `).bind(newId).first();

      return c.json({ success: true, data: newUser, message: 'Usuário cadastrado com sucesso!' }, 201);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return c.json({ success: false, data: null, message: 'Erro ao cadastrar usuário.' }, 500);
    }
  }

  static async update(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const user = c.get('user');

      if (user?.role !== 'admin' && user?.id !== id) {
        return c.json({ success: false, data: null, message: 'Acesso negado.' }, 403);
      }

      const currentUser = await c.env.DB.prepare('SELECT * FROM usuarios WHERE id = ? LIMIT 1').bind(id).first<Usuario>();
      if (!currentUser) {
        return c.json({ success: false, data: null, message: 'Usuário não encontrado.' }, 404);
      }

      const { nome, email, senha, role, status } = await c.req.json();

      const cleanNome = nome ? String(nome).trim() : currentUser.nome;
      const cleanEmail = email ? String(email).trim().toLowerCase() : currentUser.email;

      if (email && cleanEmail !== currentUser.email) {
        const dup = await c.env.DB.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1').bind(cleanEmail, id).first();
        if (dup) {
          return c.json({ success: false, data: null, message: 'Este e-mail já está em uso.' }, 409);
        }
      }

      let newRole = currentUser.role;
      let newStatus = currentUser.status;

      if (user?.role === 'admin') {
        if (role && (role === 'admin' || role === 'usuario')) {
          if (id === user.id && role !== 'admin') {
            const adminCount = await c.env.DB.prepare("SELECT COUNT(*) as c FROM usuarios WHERE role = 'admin' AND status = 'ativo'").first<{ c: number }>();
            if (Number(adminCount?.c || 0) <= 1) {
              return c.json({ success: false, data: null, message: 'Não é possível alterar o cargo do único administrador ativo.' }, 400);
            }
          }
          newRole = role;
        }

        if (status && (status === 'ativo' || status === 'inativo')) {
          if (id === user.id && status === 'inativo') {
            return c.json({ success: false, data: null, message: 'Você não pode desativar seu próprio usuário logado.' }, 400);
          }
          newStatus = status;
        }
      }

      if (senha && String(senha).trim().length >= 6) {
        const hash = await bcrypt.hash(senha, 10);
        await c.env.DB.prepare(`
          UPDATE usuarios SET nome = ?, email = ?, senha = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(cleanNome, cleanEmail, hash, newRole, newStatus, id).run();
      } else {
        await c.env.DB.prepare(`
          UPDATE usuarios SET nome = ?, email = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(cleanNome, cleanEmail, newRole, newStatus, id).run();
      }

      const updated = await c.env.DB.prepare(`
        SELECT id, nome, email, role, status, created_at, updated_at FROM usuarios WHERE id = ?
      `).bind(id).first();

      return c.json({ success: true, data: updated, message: 'Usuário atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return c.json({ success: false, data: null, message: 'Erro ao atualizar usuário.' }, 500);
    }
  }

  static async destroy(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const id = Number(c.req.param('id'));
      const user = c.get('user');

      if (id === user?.id) {
        return c.json({ success: false, data: null, message: 'Você não pode excluir seu próprio usuário logado.' }, 400);
      }

      const existing = await c.env.DB.prepare('SELECT role FROM usuarios WHERE id = ? LIMIT 1').bind(id).first<{ role: string }>();
      if (!existing) {
        return c.json({ success: false, data: null, message: 'Usuário não encontrado.' }, 404);
      }

      if (existing.role === 'admin') {
        const adminCount = await c.env.DB.prepare("SELECT COUNT(*) as c FROM usuarios WHERE role = 'admin'").first<{ c: number }>();
        if (Number(adminCount?.c || 0) <= 1) {
          return c.json({ success: false, data: null, message: 'Não é possível excluir o único administrador do sistema.' }, 400);
        }
      }

      await c.env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
      return c.json({ success: true, data: null, message: 'Usuário removido com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return c.json({ success: false, data: null, message: 'Erro ao excluir usuário.' }, 500);
    }
  }
}
