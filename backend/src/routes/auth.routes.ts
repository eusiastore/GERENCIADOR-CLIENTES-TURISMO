import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

authRoutes.post('/login', AuthController.login);
authRoutes.post('/register', AuthController.register);
authRoutes.get('/me', authMiddleware, AuthController.me);

export default authRoutes;
