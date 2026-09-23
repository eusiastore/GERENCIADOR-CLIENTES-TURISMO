import { Hono } from 'hono';
import { ClienteController } from '../controllers/cliente.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const clienteRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

clienteRoutes.use('*', authMiddleware);

clienteRoutes.get('/', ClienteController.index);
clienteRoutes.post('/', ClienteController.store);
clienteRoutes.get('/:id', ClienteController.show);
clienteRoutes.put('/:id', ClienteController.update);
clienteRoutes.delete('/:id', adminMiddleware, ClienteController.destroy);
clienteRoutes.get('/:id/extrato', ClienteController.extrato);

export default clienteRoutes;
