import React from 'react';
import { HistoricoViagem } from '../../types';

interface HistoricoAuditoriaTabProps {
  historico: HistoricoViagem[];
}

export const HistoricoAuditoriaTab: React.FC<HistoricoAuditoriaTabProps> = ({ historico }) => {
  return (
    <div className="card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data & Hora</th>
              <th>Passageiro / Módulo</th>
              <th>Ação Realizada</th>
              <th>Detalhes da Operação</th>
            </tr>
          </thead>
          <tbody>
            {historico.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Nenhum histórico registrado para esta viagem.
                </td>
              </tr>
            ) : (
              historico.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleString('pt-BR')}</td>
                  <td style={{ fontWeight: 600 }}>{h.passageiro_nome || 'SISTEMA'}</td>
                  <td>
                    <span className="badge badge-role-usuario">{h.acao}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{h.detalhes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
