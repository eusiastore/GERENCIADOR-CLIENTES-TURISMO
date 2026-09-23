import { Hono } from 'hono';
import { PassageiroController } from '../controllers/passageiro.controller';
import { ParcelaController } from '../controllers/parcela.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { Bindings, Variables } from '../types';

const passageiroRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

passageiroRoutes.use('*', authMiddleware);

passageiroRoutes.get('/viagem/:id', PassageiroController.byViagem);
passageiroRoutes.post('/', PassageiroController.store);
passageiroRoutes.put('/:id', PassageiroController.update);
passageiroRoutes.delete('/:id', adminMiddleware, PassageiroController.destroy);
passageiroRoutes.get('/:passageiroId/parcelas', ParcelaController.byPassageiro);

export default passageiroRoutes;
