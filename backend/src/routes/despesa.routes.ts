import { Hono } from 'hono';
import { DespesaController } from '../controllers/despesa.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const despesaRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

despesaRoutes.use('*', authMiddleware);

despesaRoutes.get('/viagem/:viagemId', DespesaController.byViagem);
despesaRoutes.post('/', DespesaController.store);
despesaRoutes.put('/:id', DespesaController.update);
despesaRoutes.delete('/:id', adminMiddleware, DespesaController.destroy);

export default despesaRoutes;
