import React from 'react';
import { 
  Phone, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Ban, 
  Plus, 
  CheckCircle2, 
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PassageiroViagem, ParcelaPassageiro } from '../../types';

interface PassageirosTabProps {
  passageiros: PassageiroViagem[];
  expandedPax: Record<number, boolean>;
  setExpandedPax: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  onOpenAddParcela: (pax: PassageiroViagem) => void;
  onOpenCancelamento: (pax: PassageiroViagem) => void;
  onOpenBaixaParcela: (parc: ParcelaPassageiro) => void;
  onDeletePax: (paxId: number, nome: string) => void;
  onDeleteParcela?: (parcelaId: number, numParc: number) => void;
  isAdmin: boolean;
  viagemDestino?: string;
}

export const PassageirosTab: React.FC<PassageirosTabProps> = ({
  passageiros,
  expandedPax,
  setExpandedPax,
  onOpenAddParcela,
  onOpenCancelamento,
  onOpenBaixaParcela,
  onDeletePax,
  onDeleteParcela,
  isAdmin,
  viagemDestino = ''
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  const openWhatsApp = (phone?: string | null, paxNome?: string) => {
    if (!phone) {
      toast.error('Este passageiro não possui WhatsApp cadastrado.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá ${paxNome}, tudo bem? Aqui é da TrevoTour referente à nossa viagem para ${viagemDestino}!`);
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
  };

  const passageirosAtivos = passageiros.filter(p => p.status_cancelamento !== 1);
  const passageirosCancelados = passageiros.filter(p => p.status_cancelamento === 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* TABELA 1: PASSAGEIROS ATIVOS */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Passageiros Inscritos ({passageirosAtivos.length})</div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Nome do Passageiro</th>
                <th>Titular / Cliente</th>
                <th>Contato</th>
                <th>Valor Total</th>
                <th>Valor Pago</th>
                <th>Saldo Restante</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {passageirosAtivos.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum passageiro ativo inscrito nesta viagem no momento.
                  </td>
                </tr>
              ) : (
                passageirosAtivos.map((p) => {
                  const isExpanded = !!expandedPax[p.id];
                  const saldoRestante = Number(p.valor_total) - Number(p.valor_pago);

                  return (
                    <React.Fragment key={p.id}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="btn btn-icon btn-secondary btn-sm"
                            onClick={() => setExpandedPax(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                            title="Ver parcelas e opções"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {p.nome}
                        </td>
                        <td>{p.nome_titular || '-'}</td>
                        <td>
                          {p.contato_whatsapp ? (
                            <button
                              onClick={() => openWhatsApp(p.contato_whatsapp, p.nome)}
                              className="btn btn-sm btn-success"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                              title="Chamar no WhatsApp"
                            >
                              <Phone size={12} />
                              <span>{p.contato_whatsapp}</span>
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(Number(p.valor_total))}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                          {formatCurrency(Number(p.valor_pago))}
                        </td>
                        <td style={{ fontWeight: 600, color: saldoRestante > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {formatCurrency(Math.max(0, saldoRestante))}
                        </td>
                        <td>
                          {saldoRestante <= 0 ? (
                            <span className="badge badge-pago">QUITADO</span>
                          ) : Number(p.valor_pago) > 0 ? (
                            <span className="badge badge-pendente">PARCIAL</span>
                          ) : (
                            <span className="badge badge-vencido">PENDENTE</span>
                          )}
                        </td>
                      </tr>

                      {/* Subtabela de Parcelas Expansível */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ backgroundColor: '#f8fafc', padding: '1.25rem 2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                Detalhamento de Pagamentos ({p.parcelas?.length || 0} parcelas)
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => onOpenAddParcela(p)}
                                  className="btn btn-sm btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                  <Plus size={14} />
                                  <span>+ Adicionar Parcela Paga / Avulsa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenCancelamento(p)}
                                  className="btn btn-sm btn-danger"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                  <Ban size={14} />
                                  <span>Cancelar Viagem / Estornos</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => onDeletePax(p.id, p.nome)}
                                    className="btn btn-sm btn-secondary"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                    title="Excluir Registro Definitivamente"
                                  >
                                    <Trash2 size={14} />
                                    <span>Excluir</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {p.parcelas?.length === 0 ? (
                              <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Nenhuma parcela lançada ainda. Utilize o botão <strong>+ Adicionar Parcela Paga / Avulsa</strong> acima para registrar pagamentos.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {p.parcelas?.map((parc) => (
                                  <div
                                    key={parc.id}
                                    style={{
                                      border: '1px solid var(--border-color)',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '0.65rem 0.9rem',
                                      background: parc.status_pagamento === 'pago' ? '#f0fdf4' : '#ffffff',
                                      minWidth: '170px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Parcela {parc.numero_parcela}</span>
                                      <span className={`badge badge-${parc.status_pagamento}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                                        {parc.status_pagamento.toUpperCase()}
                                      </span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                                      {formatCurrency(Number(parc.valor))}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                      Venc: {formatDate(parc.data_vencimento)}
                                    </div>
                                    {parc.forma_pagamento && (
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        Forma: {parc.forma_pagamento}
                                      </div>
                                    )}
                                    {parc.status_pagamento !== 'pago' ? (
                                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                                        <button
                                          onClick={() => onOpenBaixaParcela(parc)}
                                          className="btn btn-sm btn-primary"
                                          style={{ flex: 1, padding: '0.3rem' }}
                                        >
                                          Dar Baixa
                                        </button>
                                        {onDeleteParcela && (
                                          <button
                                            onClick={() => onDeleteParcela(parc.id, parc.numero_parcela)}
                                            className="btn btn-sm btn-secondary"
                                            style={{ padding: '0.3rem 0.45rem', color: 'var(--danger)' }}
                                            title="Excluir parcela pendente"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--primary-700)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                        <CheckCircle2 size={13} />
                                        <span>Recebido</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABELA 2: PASSAGEIROS CANCELADOS */}
      {passageirosCancelados.length > 0 && (
        <div className="card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2' }}>
            <div className="card-title" style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <Ban size={18} />
              <span>Passageiros Cancelados ({passageirosCancelados.length})</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Nome do Passageiro</th>
                  <th>Titular / Cliente</th>
                  <th>Contato</th>
                  <th>Valor Total</th>
                  <th>Multa Retida</th>
                  <th>Valor Pago</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {passageirosCancelados.map((p) => {
                  const isExpanded = !!expandedPax[p.id];
                  return (
                    <React.Fragment key={p.id}>
                      <tr style={{ backgroundColor: '#fff5f5' }}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-icon btn-secondary btn-sm"
                            onClick={() => setExpandedPax(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                            title="Ver detalhes do cancelamento"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 700, color: '#991b1b' }}>
                          {p.nome}
                        </td>
                        <td>{p.nome_titular || '-'}</td>
                        <td>{p.contato_whatsapp || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(Number(p.valor_total))}</td>
                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                          {formatCurrency(Number(p.multa_cancelamento || 0))}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(Number(p.valor_pago))}</td>
                        <td>
                          <span className="badge badge-cancelada">CANCELADO</span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ backgroundColor: '#faf5f5', padding: '1.25rem 2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
                                Inscrição Cancelada - Multa: {formatCurrency(Number(p.multa_cancelamento || 0))}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => onOpenCancelamento(p)}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                  <RotateCcw size={14} />
                                  <span>Gerenciar / Reativar Inscrição</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => onDeletePax(p.id, p.nome)}
                                    className="btn btn-sm btn-danger"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                    title="Excluir Definitivamente"
                                  >
                                    <Trash2 size={14} />
                                    <span>Excluir</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Detalhe de parcelas caso existam */}
                            {p.parcelas && p.parcelas.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {p.parcelas.map((parc) => (
                                  <div
                                    key={parc.id}
                                    style={{
                                      border: '1px solid var(--border-color)',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '0.65rem 0.9rem',
                                      background: '#ffffff',
                                      minWidth: '160px',
                                      opacity: 0.85
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Parcela {parc.numero_parcela}</span>
                                      <span className={`badge badge-${parc.status_pagamento}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                                        {parc.status_pagamento.toUpperCase()}
                                      </span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                                      {formatCurrency(Number(parc.valor))}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                      Venc: {formatDate(parc.data_vencimento)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
