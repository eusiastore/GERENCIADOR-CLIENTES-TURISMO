import React from 'react';
import { Trash2 } from 'lucide-react';
import { DespesaViagem } from '../../types';

interface DespesasTabProps {
  despesas: DespesaViagem[];
  onDeleteDespesa: (id: number) => void;
  isAdmin: boolean;
}

export const DespesasTab: React.FC<DespesasTabProps> = ({
  despesas,
  onDeleteDespesa,
  isAdmin
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Descrição / Empresa</th>
              <th>Valor de Custo</th>
              <th>Valor Pago</th>
              <th>Saldo a Pagar</th>
              <th>Contato Fornecedor</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Nenhuma despesa lançada nesta viagem.
                </td>
              </tr>
            ) : (
              despesas.map((d) => {
                const saldo = Number(d.valor_custo) - Number(d.valor_pago);
                return (
                  <tr key={d.id}>
                    <td>
                      <span className="badge badge-role-usuario" style={{ textTransform: 'uppercase' }}>
                        {d.categoria.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.descricao || d.empresa || '-'}</div>
                      {d.observacoes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.observacoes}</div>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(Number(d.valor_custo))}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                      {formatCurrency(Number(d.valor_pago))}
                    </td>
                    <td style={{ fontWeight: 600, color: saldo > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {formatCurrency(Math.max(0, saldo))}
                    </td>
                    <td>{d.contato_empresa || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {isAdmin && (
                        <button
                          onClick={() => onDeleteDespesa(d.id)}
                          className="btn btn-sm btn-danger"
                          title="Excluir Despesa"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
