import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Header } from '../components/Header';
import { ViagemModal } from '../components/viagens/ViagemModal';
import { Viagem } from '../types';
import { useAuth } from '../context/AuthContext';

export const ViagensPage: React.FC = () => {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  
  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingViagem, setEditingViagem] = useState<Viagem | null>(null);

  const { isAdmin } = useAuth();

  const fetchViagens = async () => {
    setLoading(true);
    try {
      const response = await api.get('/viagens');
      if (response.data?.success && response.data?.data) {
        setViagens(response.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar viagens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViagens();
  }, []);

  const openCreateModal = () => {
    setEditingViagem(null);
    setModalOpen(true);
  };

  const openEditModal = (v: Viagem) => {
    setEditingViagem(v);
    setModalOpen(true);
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a viagem "${nome}"? Todos os dados de passageiros e despesas vinculados serão removidos permanentemente!`)) {
      return;
    }

    try {
      await api.delete(`/viagens/${id}`);
      toast.success('Viagem excluída com sucesso.');
      fetchViagens();
    } catch (error) {
      toast.error('Erro ao excluir viagem.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredViagens = viagens.filter((v) => {
    const matchesSearch = v.nome_destino.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todas' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <Header
        title="Gestão de Viagens & Excursões"
        subtitle="Painel operacional com controle de lotação, balanço financeiro e auditoria"
        actions={
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Nova Viagem</span>
          </button>
        }
      />

      {/* Barra de Filtros e Busca */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar viagem por destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todas">Todos os status</option>
              <option value="ativa">Ativas</option>
              <option value="encerrada">Encerradas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
          <p>Carregando viagens...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Destino</th>
                  <th>Data da Viagem</th>
                  <th>Valor Base</th>
                  <th>Passageiros / Lotação</th>
                  <th>Arrecadação Prevista</th>
                  <th>Total Recebido</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredViagens.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhuma viagem encontrada com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredViagens.map((v) => {
                    const ocupacao = Number(v.total_passageiros) || 0;
                    const cap = Number(v.capacidade_maxima) || 46;
                    const percentual = Math.min(100, Math.round((ocupacao / cap) * 100));

                    return (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 700 }}>
                          <Link 
                            to={`/viagens/${v.id}`}
                            style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <span>{v.nome_destino}</span>
                            <ExternalLink size={13} style={{ color: 'var(--text-muted)' }} />
                          </Link>
                        </td>
                        <td>{formatDate(v.data_viagem)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(Number(v.valor_padrao) || 0)}</td>
                        <td style={{ minWidth: '150px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                            <span>{ocupacao}/{cap}</span>
                            <span>{percentual}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${percentual}%` }} />
                          </div>
                        </td>
                        <td>{formatCurrency(Number(v.total_arrecadado_previsto) || 0)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                          {formatCurrency(Number(v.total_recebido) || 0)}
                        </td>
                        <td>
                          <span className={`badge badge-${v.status}`}>
                            {v.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <Link to={`/viagens/${v.id}`} className="btn btn-sm btn-primary" title="Abrir Painel da Viagem">
                              Painel
                            </Link>
                            <button 
                              onClick={() => openEditModal(v)} 
                              className="btn btn-sm btn-secondary"
                              title="Editar Informações"
                            >
                              <Edit size={14} />
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => handleDelete(v.id, v.nome_destino)} 
                                className="btn btn-sm btn-danger"
                                title="Excluir Viagem"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Viagem */}
      <ViagemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchViagens}
        viagem={editingViagem}
      />
    </div>
  );
};
