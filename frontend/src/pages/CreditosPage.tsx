import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Trash2, 
  Users 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Header } from '../components/Header';
import { MovimentacaoCreditoModal } from '../components/creditos/MovimentacaoCreditoModal';
import { Cliente, HistoricoCredito } from '../types';
import { useAuth } from '../context/AuthContext';

export const CreditosPage: React.FC = () => {
  const [resumo, setResumo] = useState<{ cliente_id: number; nome_completo: string; cpf: string; saldo_credito: number }[]>([]);
  const [historico, setHistorico] = useState<HistoricoCredito[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo Crédito / Débito
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>('');

  const { isAdmin } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [resCred, resCli] = await Promise.all([
        api.get('/creditos'),
        api.get('/clientes')
      ]);

      if (resCred.data?.success && resCred.data?.data) {
        setResumo(resCred.data.data.resumo || []);
        setHistorico(resCred.data.data.historico || []);
      }
      if (resCli.data?.success && resCli.data?.data) {
        setClientes(resCli.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados de créditos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (cId?: number) => {
    setSelectedClienteId(cId || '');
    setModalOpen(true);
  };

  const handleEstornar = async (histId: number) => {
    if (!window.confirm('Deseja estornar esta movimentação? O saldo do cliente será recalculado automaticamente.')) return;

    try {
      await api.delete(`/creditos/${histId}`);
      toast.success('Movimentação estornada com sucesso.');
      loadData();
    } catch (error) {
      toast.error('Erro ao estornar crédito.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatCpf = (cpfStr: string) => {
    if (!cpfStr) return '-';
    const digits = cpfStr.replace(/\D/g, '');
    if (digits.length !== 11) return cpfStr;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const totalSaldoDisponivel = resumo.reduce((acc, c) => acc + Number(c.saldo_credito || 0), 0);

  return (
    <div className="page-container">
      <Header
        title="Créditos & Saldos de Agência"
        subtitle="Controle de saldos de cancelamentos, reembolsos e abatimentos em viagens futuras"
        actions={
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus size={16} />
            <span>Lançar Movimentação</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Saldo Total em Créditos</div>
            <div className="kpi-value" style={{ color: 'var(--primary-700)' }}>
              {formatCurrency(totalSaldoDisponivel)}
            </div>
          </div>
          <div className="kpi-icon-box green">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Clientes com Saldo Positivo</div>
            <div className="kpi-value">{resumo.length}</div>
          </div>
          <div className="kpi-icon-box blue">
            <Users size={24} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
          <p>Carregando créditos...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Card: Clientes com Saldo */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Users size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Saldos Ativos por Cliente</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>CPF</th>
                    <th>Saldo Disponível</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Nenhum cliente com saldo de crédito ativo.
                      </td>
                    </tr>
                  ) : (
                    resumo.map((c) => (
                      <tr key={c.cliente_id}>
                        <td style={{ fontWeight: 700 }}>{c.nome_completo}</td>
                        <td>{formatCpf(c.cpf)}</td>
                        <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
                          {formatCurrency(Number(c.saldo_credito))}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => openModal(c.cliente_id)}
                            className="btn btn-sm btn-secondary"
                            title="Lançar crédito/débito para este cliente"
                          >
                            Movimentar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Histórico Geral de Entradas e Saídas */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CreditCard size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Histórico de Movimentações</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Descrição</th>
                    <th>Data</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {historico.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Nenhuma movimentação registrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    historico.map((h) => (
                      <tr key={h.id}>
                        <td>
                          {h.tipo === 'entrada' ? (
                            <span className="badge badge-pago" style={{ display: 'inline-flex', gap: '0.2rem' }}>
                              <ArrowDownCircle size={12} /> ENTRADA
                            </span>
                          ) : (
                            <span className="badge badge-cancelada" style={{ display: 'inline-flex', gap: '0.2rem' }}>
                              <ArrowUpCircle size={12} /> SAÍDA
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{h.nome_completo}</td>
                        <td style={{ fontWeight: 700, color: h.tipo === 'entrada' ? 'var(--primary-700)' : 'var(--danger)' }}>
                          {h.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(h.valor))}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.descricao || '-'}</td>
                        <td style={{ fontSize: '0.78rem' }}>{h.created_at ? new Date(h.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleEstornar(h.id)}
                              className="btn btn-sm btn-danger"
                              title="Estornar movimentação"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançar Movimentação */}
      <MovimentacaoCreditoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadData}
        clientes={clientes}
        defaultClienteId={selectedClienteId}
      />
    </div>
  );
};
