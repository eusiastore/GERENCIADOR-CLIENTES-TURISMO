-- Seed inicial para desenvolvimento local
-- Senha padrão para o admin: admin123 (hash bcrypt)
INSERT OR IGNORE INTO usuarios (id, nome, email, senha, role, status) 
VALUES (
  1,
  'Administrador TrevoTour',
  'admin@trevotour.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  'ativo'
);
