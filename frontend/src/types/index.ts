export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'usuario';
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

export interface Viagem {
  id: number;
  nome_destino: string;
  data_viagem: string;
  capacidade_maxima: number;
  ultima_data_pagamento?: string | null;
  status: 'ativa' | 'encerrada' | 'cancelada';
  observacoes?: string | null;
  valor_padrao: number;
  created_at?: string;
  updated_at?: string;
  total_passageiros?: number;
  total_arrecadado_previsto?: number;
  total_recebido?: number;
  vagas_restantes?: number;
}

export interface ResumoViagem {
  viagem: Viagem;
  capacidade_maxima: number;
  reservas: number;
  vagas_restantes: number;
  total_passageiros: number;
  valor_total_previsto: number;
  valor_total_recebido: number;
  a_receber: number;
  total_custo_previsto: number;
  total_despesas_pagas: number;
  saldo_despesas: number;
  custo_por_pax: number;
  lucro_atual: number;
  lucro_esperado: number;
}

export interface ParcelaPassageiro {
  id: number;
  passageiro_id: number;
  numero_parcela: number;
  valor: number;
  data_vencimento?: string | null;
  data_pagamento?: string | null;
  status_pagamento: 'pendente' | 'pago' | 'vencido';
  forma_pagamento?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PassageiroViagem {
  id: number;
  viagem_id: number;
  cliente_id?: number | null;
  nome: string;
  contato_whatsapp?: string | null;
  forma_pagamento: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'credito_agencia' | 'misto';
  observacoes?: string | null;
  valor_total: number;
  valor_pago: number;
  num_parcelas: number;
  status_cancelamento: number;
  multa_cancelamento?: number | null;
  created_at?: string;
  updated_at?: string;
  nome_titular?: string | null;
  cpf_titular?: string | null;
  saldo_credito_titular?: number;
  parcelas?: ParcelaPassageiro[];
}

export type CategoriaDespesa =
  | 'onibus_van'
  | 'hospedagem'
  | 'ingressos'
  | 'refeicoes'
  | 'kit_lanche'
  | 'servico_bordo'
  | 'fb_anuncios'
  | 'guia_local'
  | 'seguro_viagem'
  | 'gastos_guia_motorista'
  | 'brinde'
  | 'despesas_extras';

export interface DespesaViagem {
  id: number;
  viagem_id: number;
  categoria: CategoriaDespesa;
  descricao?: string | null;
  valor_custo: number;
  valor_pago: number;
  entrada_valor?: number | null;
  data_reserva?: string | null;
  parcela_1_valor?: number | null;
  parcela_1_data?: string | null;
  parcela_2_valor?: number | null;
  parcela_2_data?: string | null;
  parcela_3_valor?: number | null;
  parcela_3_data?: string | null;
  parcela_4_valor?: number | null;
  parcela_4_data?: string | null;
  empresa?: string | null;
  contato_empresa?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: number;
  nome_completo: string;
  cpf: string;
  data_nascimento?: string | null;
  contato?: string | null;
  saldo_credito: number;
  created_at?: string;
  updated_at?: string;
}

export interface HistoricoCredito {
  id: number;
  cliente_id: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao?: string | null;
  created_at?: string;
  nome_completo?: string;
  cpf?: string;
}

export interface HistoricoViagem {
  id: number;
  viagem_id: number;
  passageiro_nome: string;
  acao: string;
  detalhes?: string | null;
  created_at: string;
}
