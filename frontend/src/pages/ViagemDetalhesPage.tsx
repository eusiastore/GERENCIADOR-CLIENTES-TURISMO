import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Receipt, 
  PieChart, 
  History, 
  Plus, 
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Header } from '../components/Header';
import { 
  Viagem, 
  ResumoViagem, 
  PassageiroViagem, 
  ParcelaPassageiro, 
  DespesaViagem, 
  HistoricoViagem, 
  Cliente 
} from '../types';
import { useAuth } from '../context/AuthContext';

import { PassageiroModal } from '../components/passageiros/PassageiroModal';
import { ParcelaModal } from '../components/passageiros/ParcelaModal';
import { ParcelaAvulsaModal } from '../components/passageiros/ParcelaAvulsaModal';
import { CancelamentoModal } from '../components/passageiros/CancelamentoModal';
import { PassageirosTab } from '../components/passageiros/PassageirosTab';
import { DespesaModal } from '../components/despesas/DespesaModal';
import { DespesasTab } from '../components/despesas/DespesasTab';
import { BalancoFinanceiroTab } from '../components/viagens/BalancoFinanceiroTab';
import { HistoricoAuditoriaTab } from '../components/viagens/HistoricoAuditoriaTab';

export const ViagemDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const viagemId = Number(id);

  const [activeTab, setActiveTab] = useState<'passageiros' | 'despesas' | 'balanco' | 'historico'>('passageiros');
  const [viagem, setViagem] = useState<Viagem | null>(null);
  const [resumo, setResumo] = useState<ResumoViagem | null>(null);
  const [passageiros, setPassageiros] = useState<PassageiroViagem[]>([]);
  const [despesas, setDespesas] = useState<DespesaViagem[]>([]);
  const [historico, setHistorico] = useState<HistoricoViagem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Accordion de Parcelas
  const [expandedPax, setExpandedPax] = useState<Record<number, boolean>>({});

  // Modais
  const [modalPaxOpen, setModalPaxOpen] = useState(false);
  const [modalDespOpen, setModalDespOpen] = useState(false);
  const [modalParcelaOpen, setModalParcelaOpen] = useState(false);
  const [modalAddParcelaOpen, setModalAddParcelaOpen] = useState(false);
  const [modalCancelOpen, setModalCancelOpen] = useState(false);

  // Seleções para modais
  const [selectedParcela, setSelectedParcela] = useState<ParcelaPassageiro | null>(null);
  const [selectedPaxForParcela, setSelectedPaxForParcela] = useState<PassageiroViagem | null>(null);
  const [selectedPaxForCancel, setSelectedPaxForCancel] = useState<PassageiroViagem | null>(null);

  const { isAdmin } = useAuth();

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resViagem, resResumo, resPax, resDesp, resHist, resCli] = await Promise.all([
        api.get(`/viagens/${viagemId}`),
        api.get(`/viagens/${viagemId}/resumo`),
        api.get(`/viagens/${viagemId}/passageiros`),
        api.get(`/viagens/${viagemId}/despesas`),
        api.get(`/viagens/${viagemId}/historico`),
        api.get('/clientes')
      ]);

      if (resViagem.data?.success) setViagem(resViagem.data.data);
      if (resResumo.data?.success) setResumo(resResumo.data.data);
      if (resPax.data?.success) setPassageiros(resPax.data.data);
      if (resDesp.data?.success) setDespesas(resDesp.data.data);
      if (resHist.data?.success) setHistorico(resHist.data.data);
      if (resCli.data?.success) setClientes(resCli.data.data);
    } catch (error) {
      toast.error('Erro ao carregar dados da viagem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viagemId) loadAllData();
  }, [viagemId]);

  const openBaixaParcelaModal = (parcela: ParcelaPassageiro) => {
    setSelectedParcela(parcela);
    setModalParcelaOpen(true);
  };

  const openAddParcelaModal = (pax: PassageiroViagem) => {
    setSelectedPaxForParcela(pax);
    setModalAddParcelaOpen(true);
  };

  const openCancelamentoModal = (pax: PassageiroViagem) => {
    setSelectedPaxForCancel(pax);
    setModalCancelOpen(true);
  };

  const handleDeletePax = async (paxId: number, nome: string) => {
    if (!window.confirm(`Excluir permanentemente o passageiro ${nome}?`)) return;
    try {
      await api.delete(`/passageiros/${paxId}`);
      toast.success('Passageiro excluído.');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir passageiro.');
    }
  };

  const handleDeleteDespesa = async (despId: number) => {
    if (!window.confirm('Excluir esta despesa permanentemente?')) return;
    try {
      await api.delete(`/despesas/${despId}`);
      toast.success('Despesa excluída.');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir despesa.');
    }
  };

  const handleDeleteParcela = async (parcelaId: number, numParc: number) => {
    if (!window.confirm(`Excluir permanentemente a Parcela #${numParc}? O saldo do passageiro será recalculado.`)) return;
    try {
      await api.delete(`/parcelas/${parcelaId}`);
      toast.success(`Parcela #${numParc} excluída com sucesso!`);
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir parcela.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/viagens" className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', gap: '0.4rem' }}>
          <ArrowLeft size={16} />
          <span>Voltar para Lista de Viagens</span>
        </Link>
      </div>

      <Header
        title={viagem ? viagem.nome_destino : 'Carregando Viagem...'}
        subtitle={viagem ? `Data: ${formatDate(viagem.data_viagem)} | Vagas: ${resumo?.total_passageiros || 0} de ${viagem.capacidade_maxima}` : ''}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setModalPaxOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Adicionar Passageiro</span>
            </button>
            <button onClick={() => setModalDespOpen(true)} className="btn btn-secondary">
              <Receipt size={16} />
              <span>Lançar Despesa</span>
            </button>
          </div>
        }
      />

      {/* Mini Resumo Superior */}
      {resumo && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Lotação</div>
              <div className="kpi-value">{resumo.total_passageiros} / {resumo.capacidade_maxima}</div>
            </div>
            <div className="kpi-icon-box blue">
              <Users size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Total Recebido</div>
              <div className="kpi-value" style={{ color: 'var(--primary-700)' }}>
                {formatCurrency(resumo.valor_total_recebido)}
              </div>
            </div>
            <div className="kpi-icon-box green">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Despesas Pagas</div>
              <div className="kpi-value" style={{ color: 'var(--danger)' }}>
                {formatCurrency(resumo.total_despesas_pagas)}
              </div>
            </div>
            <div className="kpi-icon-box red">
              <Receipt size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Lucro Atual em Caixa</div>
              <div className="kpi-value" style={{ color: resumo.lucro_atual >= 0 ? 'var(--primary-700)' : 'var(--danger)' }}>
                {formatCurrency(resumo.lucro_atual)}
              </div>
            </div>
            <div className="kpi-icon-box green">
              <PieChart size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'passageiros' ? 'active' : ''}`}
          onClick={() => setActiveTab('passageiros')}
        >
          <Users size={18} />
          <span>Passageiros & Parcelas ({passageiros.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'despesas' ? 'active' : ''}`}
          onClick={() => setActiveTab('despesas')}
        >
          <Receipt size={18} />
          <span>Despesas da Viagem ({despesas.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'balanco' ? 'active' : ''}`}
          onClick={() => setActiveTab('balanco')}
        >
          <PieChart size={18} />
          <span>Balanço Financeiro Completo</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          <History size={18} />
          <span>Histórico & Auditoria</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '250px' }}>
          <div className="spinner" />
          <p>Carregando painel detalhado...</p>
        </div>
      ) : (
        <>
          {activeTab === 'passageiros' && (
            <PassageirosTab
              passageiros={passageiros}
              expandedPax={expandedPax}
              setExpandedPax={setExpandedPax}
              onOpenAddParcela={openAddParcelaModal}
              onOpenCancelamento={openCancelamentoModal}
              onOpenBaixaParcela={openBaixaParcelaModal}
              onDeletePax={handleDeletePax}
              onDeleteParcela={handleDeleteParcela}
              isAdmin={isAdmin}
              viagemDestino={viagem?.nome_destino}
            />
          )}

          {activeTab === 'despesas' && (
            <DespesasTab
              despesas={despesas}
              onDeleteDespesa={handleDeleteDespesa}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'balanco' && (
            <BalancoFinanceiroTab resumo={resumo} />
          )}

          {activeTab === 'historico' && (
            <HistoricoAuditoriaTab historico={historico} />
          )}
        </>
      )}

      {/* Modais Extraídos */}
      <PassageiroModal
        isOpen={modalPaxOpen}
        onClose={() => setModalPaxOpen(false)}
        viagemId={viagemId}
        valorPadrao={Number(viagem?.valor_padrao) || 0}
        clientes={clientes}
        onSuccess={loadAllData}
      />

      <DespesaModal
        isOpen={modalDespOpen}
        onClose={() => setModalDespOpen(false)}
        viagemId={viagemId}
        onSuccess={loadAllData}
      />

      <ParcelaModal
        isOpen={modalParcelaOpen}
        onClose={() => setModalParcelaOpen(false)}
        parcela={selectedParcela}
        onSuccess={loadAllData}
      />

      <ParcelaAvulsaModal
        isOpen={modalAddParcelaOpen}
        onClose={() => setModalAddParcelaOpen(false)}
        pax={selectedPaxForParcela}
        onSuccess={loadAllData}
      />

      <CancelamentoModal
        isOpen={modalCancelOpen}
        onClose={() => setModalCancelOpen(false)}
        pax={selectedPaxForCancel}
        viagemDestino={viagem?.nome_destino}
        onSuccess={loadAllData}
      />
    </div>
  );
};
