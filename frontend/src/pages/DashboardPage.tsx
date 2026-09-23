import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Calendar, 
  PlusCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Header } from '../components/Header';
import { Viagem } from '../types';

export const DashboardPage: React.FC = () => {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViagens = async () => {
    setLoading(true);
    try {
      const response = await api.get('/viagens');
      if (response.data?.success && response.data?.data) {
        setViagens(response.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViagens();
  }, []);

  // Cálculos de KPI
  const viagensAtivas = viagens.filter(v => v.status === 'ativa');
  const totalPassageiros = viagens.reduce((acc, v) => acc + (Number(v.total_passageiros) || 0), 0);
  const totalRecebido = viagens.reduce((acc, v) => acc + (Number(v.total_recebido) || 0), 0);
  const totalPrevisto = viagens.reduce((acc, v) => acc + (Number(v.total_arrecadado_previsto) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="page-container">
      <Header
        title="Painel Geral"
        subtitle="Visão consolidada de todas as viagens e performance da agência"
        actions={
          <Link to="/viagens" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Gerenciar Viagens</span>
          </Link>
        }
      />

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
          <p>Calculando métricas em tempo real...</p>
        </div>
      ) : (
        <>
          {/* Grid de Métricas Principais */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Viagens Ativas</div>
                <div className="kpi-value">{viagensAtivas.length}</div>
              </div>
              <div className="kpi-icon-box green">
                <Compass size={24} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">Passageiros Confirmados</div>
                <div className="kpi-value">{totalPassageiros}</div>
              </div>
              <div className="kpi-icon-box blue">
                <Users size={24} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">Total Arrecadado</div>
                <div className="kpi-value" style={{ color: 'var(--primary-700)' }}>
                  {formatCurrency(totalRecebido)}
                </div>
              </div>
              <div className="kpi-icon-box green">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">Receita Prevista</div>
                <div className="kpi-value">
                  {formatCurrency(totalPrevisto)}
                </div>
              </div>
              <div className="kpi-icon-box amber">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Lista de Próximas Viagens */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Calendar size={20} style={{ color: 'var(--primary-600)' }} />
                <span>Próximas Viagens e Excursões</span>
              </div>
              <Link to="/viagens" className="btn btn-sm btn-secondary">
                Ver todas ({viagens.length})
              </Link>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Destino</th>
                    <th>Data da Viagem</th>
                    <th>Ocupação / Vagas</th>
                    <th>Status</th>
                    <th>Total Arrecadado</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {viagens.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Nenhuma viagem cadastrada ainda.
                      </td>
                    </tr>
                  ) : (
                    viagens.slice(0, 8).map((v) => {
                      const ocupacao = Number(v.total_passageiros) || 0;
                      const cap = Number(v.capacidade_maxima) || 46;
                      const percentual = Math.min(100, Math.round((ocupacao / cap) * 100));

                      return (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 700 }}>
                            <Link 
                              to={`/viagens/${v.id}`} 
                              style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <span>{v.nome_destino}</span>
                              <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                            </Link>
                          </td>
                          <td>{formatDate(v.data_viagem)}</td>
                          <td style={{ minWidth: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                              <span>{ocupacao} de {cap} passageiros</span>
                              <span>{percentual}%</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${percentual}%` }} />
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${v.status}`}>
                              {v.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                            {formatCurrency(Number(v.total_recebido) || 0)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to={`/viagens/${v.id}`} className="btn btn-sm btn-secondary">
                              Acessar Painel
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
