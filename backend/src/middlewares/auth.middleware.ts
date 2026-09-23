import { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { Bindings, Variables, AuthUserPayload } from '../types';

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, data: null, message: 'Token de autenticação não fornecido.' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = c.env.JWT_SECRET || 'trevotour_jwt_secret_change_in_production';

  try {
    const decoded = await verify(token, secret, 'HS256') as unknown as AuthUserPayload;
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ success: false, data: null, message: 'Token inválido ou expirado.' }, 401);
  }
};

export const adminMiddleware: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, data: null, message: 'Acesso restrito para administradores.' }, 403);
  }
  await next();
};
