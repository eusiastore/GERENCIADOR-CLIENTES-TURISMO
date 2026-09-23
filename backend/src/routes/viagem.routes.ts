import { Hono } from 'hono';
import { ViagemController } from '../controllers/viagem.controller';
import { PassageiroController } from '../controllers/passageiro.controller';
import { DespesaController } from '../controllers/despesa.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const viagemRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

viagemRoutes.use('*', authMiddleware);

viagemRoutes.get('/', ViagemController.index);
viagemRoutes.post('/', ViagemController.store);
viagemRoutes.get('/:id', ViagemController.show);
viagemRoutes.put('/:id', ViagemController.update);
viagemRoutes.delete('/:id', adminMiddleware, ViagemController.destroy);

viagemRoutes.get('/:id/resumo', ViagemController.resumo);
viagemRoutes.get('/:id/historico', ViagemController.historico);
viagemRoutes.get('/:id/passageiros', PassageiroController.byViagem);
viagemRoutes.get('/:viagemId/despesas', DespesaController.byViagem);

export default viagemRoutes;
