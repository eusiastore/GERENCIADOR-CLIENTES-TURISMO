import { Hono } from 'hono';
import { UsuarioController } from '../controllers/usuario.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const usuarioRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

usuarioRoutes.use('*', authMiddleware);

usuarioRoutes.get('/', adminMiddleware, UsuarioController.index);
usuarioRoutes.post('/', adminMiddleware, UsuarioController.store);
usuarioRoutes.get('/:id', UsuarioController.show);
usuarioRoutes.put('/:id', UsuarioController.update);
usuarioRoutes.delete('/:id', adminMiddleware, UsuarioController.destroy);

export default usuarioRoutes;
