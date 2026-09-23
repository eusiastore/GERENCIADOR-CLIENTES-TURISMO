import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { Bindings, Variables } from './types';

import authRoutes from './routes/auth.routes';
import viagemRoutes from './routes/viagem.routes';
import passageiroRoutes from './routes/passageiro.routes';
import parcelaRoutes from './routes/parcela.routes';
import clienteRoutes from './routes/cliente.routes';
import creditoRoutes from './routes/credito.routes';
import despesaRoutes from './routes/despesa.routes';
import usuarioRoutes from './routes/usuario.routes';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Security Headers
app.use('*', secureHeaders());

// CORS Config
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // Se não houver origin ou for localhost/qualquer no ambiente local
      return origin || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'TrevoTour API (Cloudflare Workers + D1 SQLite)',
    timestamp: new Date().toISOString()
  });
});

// Root check
app.get('/', (c) => {
  return c.json({
    message: 'TrevoTour Cloudflare Workers API rodando com sucesso.',
    docs: '/api/health'
  });
});

// Mount Routes
app.route('/api/auth', authRoutes);
app.route('/api/viagens', viagemRoutes);
app.route('/api/passageiros', passageiroRoutes);
app.route('/api/parcelas', parcelaRoutes);
app.route('/api/clientes', clienteRoutes);
app.route('/api/creditos', creditoRoutes);
app.route('/api/despesas', despesaRoutes);
app.route('/api/usuarios', usuarioRoutes);

// Error Handling
app.onError((err, c) => {
  console.error('Unhandled API Error:', err);
  return c.json({
    success: false,
    data: null,
    message: err.message || 'Erro interno do servidor.'
  }, 500);
});

// Not Found
app.notFound((c) => {
  return c.json({
    success: false,
    data: null,
    message: 'Rota não encontrada.'
  }, 404);
});

export default app;
