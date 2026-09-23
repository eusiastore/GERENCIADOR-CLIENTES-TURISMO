-- ============================================================
-- SISTEMA TREVOTOUR - SCHEMA COMPLETO DO BANCO DE DADOS D1 (SQLite)
-- Compatível nativamente com Cloudflare D1 e SQLite 3
-- ============================================================

-- TABELA: usuarios (Autenticação e Permissões)
CREATE TABLE IF NOT EXISTS usuarios (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  senha                 TEXT NOT NULL,
  role                  TEXT NOT NULL CHECK(role IN ('admin', 'usuario')) DEFAULT 'usuario',
  status                TEXT NOT NULL CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: viagens
CREATE TABLE IF NOT EXISTS viagens (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_destino          TEXT NOT NULL,
  data_viagem           TEXT NOT NULL,
  capacidade_maxima     INTEGER NOT NULL DEFAULT 46,
  ultima_data_pagamento TEXT NULL,
  status                TEXT NOT NULL CHECK(status IN ('ativa', 'encerrada', 'cancelada')) DEFAULT 'ativa',
  observacoes           TEXT NULL,
  valor_padrao          REAL NOT NULL DEFAULT 0.00,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: clientes (Base global de clientes da agência)
CREATE TABLE IF NOT EXISTS clientes (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_completo         TEXT NOT NULL,
  cpf                   TEXT NOT NULL UNIQUE,
  data_nascimento       TEXT NULL,
  contato               TEXT NULL,
  saldo_credito         REAL NOT NULL DEFAULT 0.00,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: passageiros_viagem
CREATE TABLE IF NOT EXISTS passageiros_viagem (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  viagem_id             INTEGER NOT NULL,
  cliente_id            INTEGER NULL,
  nome                  TEXT NOT NULL,
  contato_whatsapp      TEXT NULL,
  forma_pagamento       TEXT NOT NULL CHECK(forma_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'credito_agencia', 'misto')) DEFAULT 'pix',
  observacoes           TEXT NULL,
  valor_total           REAL NOT NULL DEFAULT 0.00,
  valor_pago            REAL NOT NULL DEFAULT 0.00,
  num_parcelas          INTEGER NOT NULL DEFAULT 1,
  status_cancelamento   INTEGER NOT NULL CHECK(status_cancelamento IN (0, 1)) DEFAULT 0,
  multa_cancelamento    REAL NULL DEFAULT 0.00,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- TABELA: parcelas_passageiro
CREATE TABLE IF NOT EXISTS parcelas_passageiro (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  passageiro_id         INTEGER NOT NULL,
  numero_parcela        INTEGER NOT NULL,
  valor                 REAL NOT NULL DEFAULT 0.00,
  data_vencimento       TEXT NULL,
  data_pagamento        TEXT NULL,
  status_pagamento      TEXT NOT NULL CHECK(status_pagamento IN ('pendente', 'pago', 'vencido')) DEFAULT 'pendente',
  forma_pagamento       TEXT NULL,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passageiro_id) REFERENCES passageiros_viagem(id) ON DELETE CASCADE
);

-- TABELA: despesas_viagem
CREATE TABLE IF NOT EXISTS despesas_viagem (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  viagem_id             INTEGER NOT NULL,
  categoria             TEXT NOT NULL CHECK(categoria IN (
                          'onibus_van',
                          'hospedagem',
                          'ingressos',
                          'refeicoes',
                          'kit_lanche',
                          'servico_bordo',
                          'fb_anuncios',
                          'guia_local',
                          'seguro_viagem',
                          'gastos_guia_motorista',
                          'brinde',
                          'despesas_extras'
                        )),
  descricao             TEXT NULL,
  valor_custo           REAL NOT NULL DEFAULT 0.00,
  valor_pago            REAL NOT NULL DEFAULT 0.00,
  entrada_valor         REAL NULL DEFAULT 0.00,
  data_reserva          TEXT NULL,
  parcela_1_valor       REAL NULL DEFAULT 0.00,
  parcela_1_data        TEXT NULL,
  parcela_2_valor       REAL NULL DEFAULT 0.00,
  parcela_2_data        TEXT NULL,
  parcela_3_valor       REAL NULL DEFAULT 0.00,
  parcela_3_data        TEXT NULL,
  parcela_4_valor       REAL NULL DEFAULT 0.00,
  parcela_4_data        TEXT NULL,
  empresa               TEXT NULL,
  contato_empresa       TEXT NULL,
  observacoes           TEXT NULL,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE
);

-- TABELA: historico_creditos (Log de entradas e saídas de saldo)
CREATE TABLE IF NOT EXISTS historico_creditos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id            INTEGER NOT NULL,
  tipo                  TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
  valor                 REAL NOT NULL,
  descricao             TEXT NULL,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- TABELA: historico_viagem (Log de alterações de passageiros)
CREATE TABLE IF NOT EXISTS historico_viagem (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  viagem_id             INTEGER NOT NULL,
  passageiro_nome       TEXT NOT NULL,
  acao                  TEXT NOT NULL,
  detalhes              TEXT NULL,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_passageiros_viagem_id  ON passageiros_viagem(viagem_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_passageiro_id ON parcelas_passageiro(passageiro_id);
CREATE INDEX IF NOT EXISTS idx_despesas_viagem_id     ON despesas_viagem(viagem_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status        ON parcelas_passageiro(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf           ON clientes(cpf);
