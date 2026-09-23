import React, { useState, useEffect } from 'react';
import { Ban, RotateCcw, Receipt, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { PassageiroViagem } from '../../types';

interface CancelamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pax: PassageiroViagem | null;
  viagemDestino?: string;
  onSuccess: () => void;
}

export const CancelamentoModal: React.FC<CancelamentoModalProps> = ({
  isOpen,
  onClose,
  pax,
  viagemDestino = '',
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'cancelar_viagem' | 'estornar_parcelas'>('cancelar_viagem');
  const [multaTipo, setMultaTipo] = useState<'0' | '10' | '20' | 'custom_pct' | 'custom_val'>('10');
  const [multaPctCustom, setMultaPctCustom] = useState<number>(10);
  const [multaValorCustom, setMultaValorCustom] = useState<number>(0);
  const [cancelConfirmText, setCancelConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPax, setCurrentPax] = useState<PassageiroViagem | null>(pax);

  useEffect(() => {
    if (pax) {
      setCurrentPax(pax);
      setActiveTab('cancelar_viagem');
      setMultaTipo('10');
      setMultaPctCustom(10);
      const total = Number(pax.valor_total) || 0;
      setMultaValorCustom(Number((total * 0.10).toFixed(2)));
      setCancelConfirmText('');
    }
  }, [pax, isOpen]);

  if (!currentPax) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  const getMultaCalculada = () => {
    const total = Number(currentPax.valor_total) || 0;
    if (multaTipo === '0') return 0;
    if (multaTipo === '10') return Number((total * 0.10).toFixed(2));
    if (multaTipo === '20') return Number((total * 0.20).toFixed(2));
    if (multaTipo === 'custom_pct') return Number((total * (multaPctCustom / 100)).toFixed(2));
    if (multaTipo === 'custom_val') return Number(multaValorCustom || 0);
    return 0;
  };

  const handleConfirmCancelViagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cancelConfirmText.trim().toUpperCase() !== 'CANCELAR') {
      toast.error('Por favor, digite CANCELAR para confirmar a operação.');
      return;
    }

    const multaFinal = getMultaCalculada();
    const valorPago = Number(currentPax.valor_pago) || 0;
    const creditoRestante = Math.max(0, Number((valorPago - multaFinal).toFixed(2)));

    setSaving(true);
    try {
      await api.put(`/passageiros/${currentPax.id}`, {
        status_cancelamento: 1,
        multa_cancelamento: multaFinal
      });

      if (creditoRestante > 0 && currentPax.cliente_id) {
        await api.post('/creditos', {
          cliente_id: currentPax.cliente_id,
          tipo: 'entrada',
          valor: creditoRestante,
          descricao: `Crédito por cancelamento de ${currentPax.nome} na viagem ${viagemDestino} (Multa retida: ${formatCurrency(multaFinal)})`
        });
        toast.success(`Viagem cancelada! Crédito de ${formatCurrency(creditoRestante)} gerado para o titular.`);
      } else {
        toast.success('Viagem do passageiro cancelada com sucesso!');
      }

      onClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao processar cancelamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleReativarInscricao = async () => {
    if (!window.confirm(`Deseja reativar a inscrição do passageiro ${currentPax.nome}?`)) return;

    setSaving(true);
    try {
      await api.put(`/passageiros/${currentPax.id}`, {
        status_cancelamento: 0,
        multa_cancelamento: 0
      });
      toast.success('Inscrição reativada com sucesso!');
      onClose();
      onSuccess();
    } catch (error) {
      toast.error('Erro ao reativar inscrição.');
    } finally {
      setSaving(false);
    }
  };

  const handleEstornarParcelaPaga = async (parc: any) => {
    const valorEstorno = Number(parc.valor) || 0;
    if (!window.confirm(`Deseja estornar o pagamento da Parcela ${parc.numero_parcela}? O status voltará para PENDENTE e o valor de ${formatCurrency(valorEstorno)} será creditado para o titular.`)) return;

    try {
      await api.put(`/parcelas/${parc.id}`, {
        status_pagamento: 'pendente',
        data_pagamento: null
      });

      if (valorEstorno > 0 && currentPax.cliente_id) {
        await api.post('/creditos', {
          cliente_id: currentPax.cliente_id,
          tipo: 'entrada',
          valor: valorEstorno,
          descricao: `Estorno da Parcela ${parc.numero_parcela} de ${currentPax.nome} na viagem ${viagemDestino}`
        });
        toast.success(`Parcela ${parc.numero_parcela} estornada! Crédito de ${formatCurrency(valorEstorno)} gerado para o titular.`);
      } else {
        toast.success(`Pagamento da Parcela ${parc.numero_parcela} estornado com sucesso!`);
      }

      setCurrentPax(prev => {
        if (!prev || !prev.parcelas) return prev;
        return {
          ...prev,
          valor_pago: Math.max(0, Number(prev.valor_pago) - valorEstorno),
          parcelas: prev.parcelas.map(pr => pr.id === parc.id ? { ...pr, status_pagamento: 'pendente', data_pagamento: null } : pr)
        };
      });
      onSuccess();
    } catch (error) {
      toast.error('Erro ao estornar parcela.');
    }
  };

  const handleExcluirParcelaPaga = async (parcelaId: number, numParc: number) => {
    if (!window.confirm(`Excluir permanentemente a Parcela ${numParc}? O valor pago do passageiro será recalculado.`)) return;

    try {
      await api.delete(`/parcelas/${parcelaId}`);
      toast.success(`Parcela ${numParc} excluída com sucesso!`);
      setCurrentPax(prev => {
        if (!prev || !prev.parcelas) return prev;
        return {
          ...prev,
          parcelas: prev.parcelas.filter(pr => pr.id !== parcelaId)
        };
      });
      onSuccess();
    } catch (error) {
      toast.error('Erro ao excluir parcela.');
    }
  };

  const parcelasPagas = currentPax.parcelas?.filter(pr => pr.status_pagamento === 'pago') || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gerenciar Cancelamento: ${currentPax.nome}`}
    >
      <div>
        {/* Abas Estilo Navegador */}
        <div className="modal-browser-tabs">
          <button
            type="button"
            className={`modal-browser-tab ${activeTab === 'cancelar_viagem' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelar_viagem')}
          >
            <Ban size={15} />
            <span>1. Cancelar Viagem do Passageiro</span>
          </button>
          <button
            type="button"
            className={`modal-browser-tab ${activeTab === 'estornar_parcelas' ? 'active' : ''}`}
            onClick={() => setActiveTab('estornar_parcelas')}
          >
            <RotateCcw size={15} />
            <span>2. Remover / Estornar Parcela Paga ({parcelasPagas.length})</span>
          </button>
        </div>

        {/* ABA 1: CANCELAR VIAGEM DO PASSAGEIRO */}
        {activeTab === 'cancelar_viagem' && (
          <div>
            {currentPax.status_cancelamento === 1 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', marginBottom: '1rem' }}>
                  <Ban size={32} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Inscrição Já Cancelada</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Este passageiro já se encontra cancelado nesta excursão com multa registrada de <strong>{formatCurrency(Number(currentPax.multa_cancelamento || 0))}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleReativarInscricao}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {saving ? 'Reativando...' : 'Reativar Inscrição do Passageiro'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmCancelViagem}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.9rem 1.15rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>PASSAGEIRO</span>
                      <strong style={{ color: 'var(--text-main)' }}>{currentPax.nome}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>CLIENTE TITULAR</span>
                      <strong style={{ color: currentPax.nome_titular ? 'var(--primary-700)' : 'var(--text-muted)' }}>
                        {currentPax.nome_titular || 'Sem titular vinculado'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>VALOR TOTAL DA VAGA</span>
                      <strong>{formatCurrency(Number(currentPax.valor_total))}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>TOTAL PAGO ATÉ O MOMENTO</span>
                      <strong style={{ color: 'var(--primary-700)' }}>{formatCurrency(Number(currentPax.valor_pago))}</strong>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Taxa / Multa de Cancelamento</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Escolha a % ou valor fixo</span>
                  </label>
                  <div className="multa-pill-group">
                    <button
                      type="button"
                      className={`multa-pill ${multaTipo === '0' ? 'active' : ''}`}
                      onClick={() => setMultaTipo('0')}
                    >
                      Sem Multa (0%)
                    </button>
                    <button
                      type="button"
                      className={`multa-pill ${multaTipo === '10' ? 'active' : ''}`}
                      onClick={() => setMultaTipo('10')}
                    >
                      10% Multa
                    </button>
                    <button
                      type="button"
                      className={`multa-pill ${multaTipo === '20' ? 'active' : ''}`}
                      onClick={() => setMultaTipo('20')}
                    >
                      20% Multa
                    </button>
                    <button
                      type="button"
                      className={`multa-pill ${multaTipo === 'custom_pct' ? 'active' : ''}`}
                      onClick={() => setMultaTipo('custom_pct')}
                    >
                      Outra %
                    </button>
                    <button
                      type="button"
                      className={`multa-pill ${multaTipo === 'custom_val' ? 'active' : ''}`}
                      onClick={() => setMultaTipo('custom_val')}
                    >
                      Valor Fixo (R$)
                    </button>
                  </div>

                  {multaTipo === 'custom_pct' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Informe a Porcentagem (%) da Multa</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className="form-input"
                        value={multaPctCustom}
                        onChange={(e) => setMultaPctCustom(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {multaTipo === 'custom_val' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Informe o Valor em Reais (R$) da Multa</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={multaValorCustom || ''}
                        onChange={(e) => setMultaValorCustom(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                {(() => {
                  const multaCalculada = getMultaCalculada();
                  const valorPago = Number(currentPax.valor_pago) || 0;
                  const creditoRestante = Math.max(0, Number((valorPago - multaCalculada).toFixed(2)));

                  return (
                    <div className="refund-summary-box">
                      <div className="refund-summary-row">
                        <span style={{ color: 'var(--text-muted)' }}>Total Pago pelo Passageiro:</span>
                        <strong>{formatCurrency(valorPago)}</strong>
                      </div>
                      <div className="refund-summary-row" style={{ color: '#b91c1c' }}>
                        <span>Retenção por Multa ({multaTipo === 'custom_val' ? 'Fixo' : (multaTipo === '0' ? '0%' : (multaTipo === '10' ? '10%' : (multaTipo === '20' ? '20%' : `${multaPctCustom}%`)))}):</span>
                        <strong>- {formatCurrency(multaCalculada)}</strong>
                      </div>
                      <div className="refund-summary-row total" style={{ color: creditoRestante > 0 ? 'var(--primary-700)' : 'var(--text-main)' }}>
                        <span>Crédito a ser enviado ao Titular:</span>
                        <span style={{ fontSize: '1.1rem' }}>{formatCurrency(creditoRestante)}</span>
                      </div>

                      {currentPax.cliente_id ? (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--primary-800)', background: 'var(--primary-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                          💳 O saldo de <strong>{formatCurrency(creditoRestante)}</strong> será creditado automaticamente na conta do titular <strong>{currentPax.nome_titular}</strong>.
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#b45309', background: '#fef3c7', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                          ⚠️ Este passageiro não possui um Cliente Titular vinculado. O cancelamento será registrado no histórico da viagem sem gerar crédito automático.
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label" style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={15} />
                    <span>Confirmação Obrigatória: Digite <strong>CANCELAR</strong> para prosseguir</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Digite CANCELAR"
                    value={cancelConfirmText}
                    onChange={(e) => setCancelConfirmText(e.target.value)}
                    style={{ borderColor: cancelConfirmText.trim().toUpperCase() === 'CANCELAR' ? 'var(--primary-500)' : '#fca5a5' }}
                    required
                  />
                </div>

                <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={cancelConfirmText.trim().toUpperCase() !== 'CANCELAR' || saving}
                  >
                    {saving ? 'Cancelando...' : 'Confirmar Cancelamento da Viagem'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ABA 2: REMOVER / ESTORNAR PARCELA PAGA */}
        {activeTab === 'estornar_parcelas' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Abaixo estão listadas as parcelas com pagamento confirmado deste passageiro. Você pode estornar o pagamento (voltando para pendente) ou excluir o registro da parcela.
            </p>

            {parcelasPagas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                <Receipt size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                <p style={{ fontWeight: 600 }}>Nenhuma parcela paga encontrada para este passageiro.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                {parcelasPagas.map((parc) => (
                  <div
                    key={parc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>Parcela #{parc.numero_parcela}</strong>
                        <span className="badge badge-pago" style={{ fontSize: '0.65rem' }}>PAGO</span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '0.2rem' }}>
                        {formatCurrency(Number(parc.valor))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Pago em: {formatDate(parc.data_pagamento || parc.updated_at)} | Forma: {parc.forma_pagamento ? parc.forma_pagamento.toUpperCase() : 'PIX'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleEstornarParcelaPaga(parc)}
                        className="btn btn-sm btn-secondary"
                        title="Voltar status para pendente e estornar valor para os créditos do titular"
                      >
                        <RotateCcw size={13} />
                        <span>Estornar Pagamento</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirParcelaPaga(parc.id, parc.numero_parcela)}
                        className="btn btn-sm btn-danger"
                        title="Excluir esta parcela definitivamente"
                      >
                        <Trash2Icon size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Trash2Icon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);
