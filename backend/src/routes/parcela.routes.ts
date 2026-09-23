import { Hono } from 'hono';
import { ParcelaController } from '../controllers/parcela.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const parcelaRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

parcelaRoutes.use('*', authMiddleware);

parcelaRoutes.get('/passageiro/:passageiroId', ParcelaController.byPassageiro);
parcelaRoutes.post('/', ParcelaController.store);
parcelaRoutes.put('/:id', ParcelaController.update);
parcelaRoutes.delete('/:id', adminMiddleware, ParcelaController.destroy);

export default parcelaRoutes;
