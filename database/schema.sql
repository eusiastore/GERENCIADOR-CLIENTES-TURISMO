-- ============================================================
-- SISTEMA TREVOTOUR - SCHEMA COMPLETO DO BANCO DE DADOS
-- Compatível com phpMyAdmin / InfinityFree / MySQL 8.0 / MariaDB
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABELA: usuarios (Autenticação e Permissões)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nome                  VARCHAR(150)    NOT NULL,
  email                 VARCHAR(150)    NOT NULL UNIQUE,
  senha                 VARCHAR(255)    NOT NULL,
  role                  ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  status                ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: viagens
-- ============================================================
CREATE TABLE IF NOT EXISTS viagens (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nome_destino          VARCHAR(150)    NOT NULL,
  data_viagem           DATE            NOT NULL,
  capacidade_maxima     INT             NOT NULL DEFAULT 46,
  ultima_data_pagamento DATE            NULL,
  status                ENUM('ativa','encerrada','cancelada') NOT NULL DEFAULT 'ativa',
  observacoes           TEXT            NULL,
  valor_padrao          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: clientes (Base global de clientes da agência)
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nome_completo         VARCHAR(150)    NOT NULL,
  cpf                   VARCHAR(20)     NOT NULL UNIQUE,
  data_nascimento       DATE            NULL,
  contato               VARCHAR(20)     NULL,
  saldo_credito         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: passageiros_viagem
-- ============================================================
CREATE TABLE IF NOT EXISTS passageiros_viagem (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  viagem_id             INT             NOT NULL,
  cliente_id            INT             NULL,
  nome                  VARCHAR(150)    NOT NULL,
  contato_whatsapp      VARCHAR(20)     NULL,
  forma_pagamento       ENUM('dinheiro','pix','cartao_debito','cartao_credito','credito_agencia','misto') NOT NULL DEFAULT 'pix',
  observacoes           TEXT            NULL,
  valor_total           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  valor_pago            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  num_parcelas          INT             NOT NULL DEFAULT 1,
  status_cancelamento   TINYINT(1)      NOT NULL DEFAULT 0,
  multa_cancelamento    DECIMAL(10,2)   NULL DEFAULT 0.00,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_passageiro_viagem FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE,
  CONSTRAINT fk_passageiro_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: parcelas_passageiro (até 12 parcelas por passageiro)
-- ============================================================
CREATE TABLE IF NOT EXISTS parcelas_passageiro (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  passageiro_id         INT             NOT NULL,
  numero_parcela        TINYINT         NOT NULL,
  valor                 DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  data_vencimento       DATE            NULL,
  data_pagamento        DATE            NULL,
  status_pagamento      ENUM('pendente','pago','vencido') NOT NULL DEFAULT 'pendente',
  forma_pagamento       VARCHAR(50)     NULL,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_parcela_passageiro FOREIGN KEY (passageiro_id) REFERENCES passageiros_viagem(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: despesas_viagem
-- ============================================================
CREATE TABLE IF NOT EXISTS despesas_viagem (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  viagem_id             INT             NOT NULL,
  categoria             ENUM(
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
                        ) NOT NULL,
  descricao             VARCHAR(255)    NULL,
  valor_custo           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  valor_pago            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  entrada_valor         DECIMAL(10,2)   NULL DEFAULT 0.00,
  data_reserva          DATE            NULL,
  parcela_1_valor       DECIMAL(10,2)   NULL DEFAULT 0.00,
  parcela_1_data        DATE            NULL,
  parcela_2_valor       DECIMAL(10,2)   NULL DEFAULT 0.00,
  parcela_2_data        DATE            NULL,
  parcela_3_valor       DECIMAL(10,2)   NULL DEFAULT 0.00,
  parcela_3_data        DATE            NULL,
  parcela_4_valor       DECIMAL(10,2)   NULL DEFAULT 0.00,
  parcela_4_data        DATE            NULL,
  empresa               VARCHAR(150)    NULL,
  contato_empresa       VARCHAR(50)     NULL,
  observacoes           TEXT            NULL,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesa_viagem FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: historico_creditos (Log de entradas e saídas de saldo)
-- ============================================================
CREATE TABLE IF NOT EXISTS historico_creditos (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id            INT             NOT NULL,
  tipo                  ENUM('entrada', 'saida') NOT NULL,
  valor                 DECIMAL(10,2)   NOT NULL,
  descricao             TEXT            NULL,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: historico_viagem (Log de alterações de passageiros)
-- ============================================================
CREATE TABLE IF NOT EXISTS historico_viagem (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  viagem_id             INT             NOT NULL,
  passageiro_nome       VARCHAR(255)    NOT NULL,
  acao                  VARCHAR(100)    NOT NULL,
  detalhes              TEXT            NULL,
  created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_viagem FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX idx_passageiros_viagem_id  ON passageiros_viagem(viagem_id);
CREATE INDEX idx_parcelas_passageiro_id ON parcelas_passageiro(passageiro_id);
CREATE INDEX idx_despesas_viagem_id     ON despesas_viagem(viagem_id);
CREATE INDEX idx_parcelas_status        ON parcelas_passageiro(status_pagamento);

SET FOREIGN_KEY_CHECKS = 1;
