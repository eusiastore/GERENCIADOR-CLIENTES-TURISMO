import React from 'react';
import { ResumoViagem } from '../../types';

interface BalancoFinanceiroTabProps {
  resumo: ResumoViagem | null;
}

export const BalancoFinanceiroTab: React.FC<BalancoFinanceiroTabProps> = ({ resumo }) => {
  if (!resumo) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Resumo de Receitas</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Total Previsto (Inscrições):</span>
            <strong>{formatCurrency(resumo.valor_total_previsto)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Total Efetivamente Recebido:</span>
            <strong style={{ color: 'var(--primary-700)' }}>{formatCurrency(resumo.valor_total_recebido)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span>Valores a Receber (Inadimplência):</span>
            <strong style={{ color: 'var(--warning)' }}>{formatCurrency(resumo.a_receber)}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Resumo de Custos & Despesas</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Total de Despesas Previstas:</span>
            <strong>{formatCurrency(resumo.total_custo_previsto)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Despesas Efetivamente Pagas:</span>
            <strong style={{ color: 'var(--danger)' }}>{formatCurrency(resumo.total_despesas_pagas)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span>Custo Médio por Passageiro:</span>
            <strong>{formatCurrency(resumo.custo_por_pax)}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header">
          <div className="card-title">Resultado Líquido da Operação</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>LUCRO ATUAL EM CAIXA</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: resumo.lucro_atual >= 0 ? 'var(--primary-700)' : 'var(--danger)' }}>
                {formatCurrency(resumo.lucro_atual)}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>LUCRO ESPERADO FINAL</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: resumo.lucro_esperado >= 0 ? 'var(--primary-700)' : 'var(--danger)' }}>
                {formatCurrency(resumo.lucro_esperado)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
