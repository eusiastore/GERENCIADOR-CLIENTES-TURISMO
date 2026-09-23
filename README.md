# 🍀 TrevoTour — Sistema de Gestão de Viagens & Excursões

Sistema moderno de gestão de excursões, passageiros, despesas operacionais, parcelamentos, controle de créditos e clientes para agências de turismo.

---

## 🏛️ Arquitetura do Sistema

```
┌───────────────────────────────────────┐
│              FRONTEND                 │
│  React 18 + TypeScript + Vite         │
│  React Router + Context API + Axios   │
└──────────────────┬────────────────────┘
                   │ HTTP / REST (JSON)
┌──────────────────▼────────────────────┐
│              BACKEND                  │
│  Node.js + TypeScript + Express       │
│  JWT Auth + Bcrypt + Transações SQL   │
└──────────────────┬────────────────────┘
                   │ MySQL (mysql2 pool)
┌──────────────────▼────────────────────┐
│           BANCO DE DADOS              │
│  MySQL (Tabelas existentes em         │
│  database/schema.sql)                 │
└───────────────────────────────────────┘
```

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- Node.js v18+ instalado
- MySQL Server rodando com o schema importado (`database/schema.sql`)

### 2. Instalação das Dependências

Instale as dependências do Backend e do Frontend:

```bash
# Na raiz do projeto:
npm run install:all
```

Ou individualmente:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 3. Configuração de Variáveis de Ambiente

Verifique o arquivo `backend/.env` (já pré-configurado com os valores padrões locais):

```env
PORT=3001
JWT_SECRET=trevotour_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=trevotour
DB_PASS=trevotour123
DB_NAME=trevotour_db
DB_CHARSET=utf8mb4

CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

---

### 4. Inicializando a Aplicação

Abra dois terminais:

**Terminal 1 — Backend (API Express):**
```bash
cd backend
npm run dev
```
> A API estará disponível em: `http://localhost:3001`

**Terminal 2 — Frontend (React + Vite):**
```bash
cd frontend
npm run dev
```
> O Frontend estará disponível em: `http://localhost:5173`

---

## 📦 Estrutura de Módulos

- **Dashboard**: Métricas em tempo real (viagens ativas, ocupação, arrecadação total e faturamento).
- **Viagens**: Criação, edição, cálculo dinâmico de vagas e percentual de ocupação do ônibus.
- **Painel da Viagem**:
  - **Passageiros**: Inscrições, parcelamento programado (1 a 12 parcelas), botão direto de WhatsApp, controle de cancelamentos e multas.
  - **Despesas**: Controle categorizado de custos operacionais (transporte, hotel, ingressos, guias, etc.).
  - **Balanço Financeiro**: Demonstração de lucro líquido em caixa e lucro estimado.
  - **Histórico & Auditoria**: Rastreamento de todas as alterações feitas na viagem.
- **Clientes**: Base centralizada com histórico de viagens, saldo de créditos acumulados e gerador de extrato para WhatsApp.
- **Créditos & Saldos**: Gestão de créditos decorrentes de cancelamentos e abatimentos em compras futuras.
- **Usuários & Permissões**: Controle de administradores e operadores do sistema.
