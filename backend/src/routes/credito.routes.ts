import { Hono } from 'hono';
import { CreditoController } from '../controllers/credito.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const creditoRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

creditoRoutes.use('*', authMiddleware);

creditoRoutes.get('/', CreditoController.index);
creditoRoutes.post('/', CreditoController.store);
creditoRoutes.put('/:id', CreditoController.update);
creditoRoutes.delete('/:id', adminMiddleware, CreditoController.destroy);

export default creditoRoutes;
