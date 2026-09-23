import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { Bindings, Variables, Usuario } from '../types';

export class AuthController {
  static async login(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { email, senha } = await c.req.json();

      if (!email || !senha) {
        return c.json({ success: false, data: null, message: 'Por favor, informe e-mail e senha.' }, 422);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const user = await c.env.DB.prepare(
        'SELECT * FROM usuarios WHERE email = ? LIMIT 1'
      ).bind(cleanEmail).first<Usuario>();

      if (!user) {
        return c.json({ success: false, data: null, message: 'E-mail ou senha inválidos.' }, 401);
      }

      const valid = await bcrypt.compare(senha, user.senha || '');
      if (!valid) {
        return c.json({ success: false, data: null, message: 'E-mail ou senha inválidos.' }, 401);
      }

      if (user.status !== 'ativo') {
        return c.json({ success: false, data: null, message: 'Sua conta está inativa. Contate o administrador.' }, 403);
      }

      const secret = c.env.JWT_SECRET || 'trevotour_jwt_secret_change_in_production';

      const payload = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        status: user.status
      };

      const token = await sign(payload, secret, 'HS256');

      return c.json({
        success: true,
        data: {
          user: payload,
          token
        },
        message: 'Login realizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return c.json({ success: false, data: null, message: 'Erro ao processar login.' }, 500);
    }
  }

  static async register(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const { nome, email, senha, role } = await c.req.json();

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

      const existing = await c.env.DB.prepare(
        'SELECT id FROM usuarios WHERE email = ? LIMIT 1'
      ).bind(cleanEmail).first();

      if (existing) {
        return c.json({ success: false, data: null, message: 'Este e-mail já está cadastrado no sistema.' }, 409);
      }

      const userRole = role === 'admin' ? 'admin' : 'usuario';
      const senhaHash = await bcrypt.hash(senha, 10);

      const result = await c.env.DB.prepare(
        'INSERT INTO usuarios (nome, email, senha, role, status) VALUES (?, ?, ?, ?, ?)'
      ).bind(String(nome).trim(), cleanEmail, senhaHash, userRole, 'ativo').run();

      const newUserId = result.meta.last_row_id;

      const newUser = {
        id: Number(newUserId),
        nome: String(nome).trim(),
        email: cleanEmail,
        role: userRole as 'admin' | 'usuario',
        status: 'ativo' as const
      };

      const secret = c.env.JWT_SECRET || 'trevotour_jwt_secret_change_in_production';
      const token = await sign(newUser, secret, 'HS256');

      return c.json({
        success: true,
        data: {
          user: newUser,
          token
        },
        message: 'Cadastro realizado com sucesso!'
      }, 201);
    } catch (error) {
      console.error('Erro no registro:', error);
      return c.json({ success: false, data: null, message: 'Erro ao processar cadastro.' }, 500);
    }
  }

  static async me(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ success: false, data: null, message: 'Não autenticado.' }, 401);
      }

      const dbUser = await c.env.DB.prepare(
        'SELECT id, nome, email, role, status, created_at, updated_at FROM usuarios WHERE id = ? LIMIT 1'
      ).bind(user.id).first<Usuario>();

      if (!dbUser || dbUser.status !== 'ativo') {
        return c.json({ success: false, data: null, message: 'Sessão expirada ou usuário inativo.' }, 401);
      }

      return c.json({
        success: true,
        data: dbUser,
        message: 'Usuário autenticado com sucesso.'
      });
    } catch (error) {
      console.error('Erro no auth/me:', error);
      return c.json({ success: false, data: null, message: 'Erro ao validar sessão.' }, 500);
    }
  }
}
