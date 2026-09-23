import React, { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { Cliente } from '../../types';

interface PassageiroModalProps {
  isOpen: boolean;
  onClose: () => void;
  viagemId: number;
  valorPadrao: number;
  clientes: Cliente[];
  onSuccess: () => void;
}

export const PassageiroModal: React.FC<PassageiroModalProps> = ({
  isOpen,
  onClose,
  viagemId,
  valorPadrao,
  clientes,
  onSuccess
}) => {
  const [paxNome, setPaxNome] = useState('');
  const [paxClienteId, setPaxClienteId] = useState<number | ''>('');
  const [paxWhatsapp, setPaxWhatsapp] = useState('');
  const [paxFormaPagamento, setPaxFormaPagamento] = useState('pix');
  const [paxValorTotal, setPaxValorTotal] = useState(0);
  const [paxNumParcelas, setPaxNumParcelas] = useState(1);
  const [paxObservacoes, setPaxObservacoes] = useState('');
  const [paxParcelasCustom, setPaxParcelasCustom] = useState<{ numero_parcela: number; valor: number; data_vencimento: string; status_pagamento: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaxNome('');
      setPaxClienteId('');
      setPaxWhatsapp('');
      setPaxFormaPagamento('pix');
      setPaxValorTotal(valorPadrao || 0);
      setPaxNumParcelas(1);
      setPaxObservacoes('');
      setPaxParcelasCustom([{
        numero_parcela: 1,
        valor: valorPadrao || 0,
        data_vencimento: new Date().toISOString().substring(0, 10),
        status_pagamento: 'pendente'
      }]);
    }
  }, [isOpen, valorPadrao]);

  const handleNumParcelasChange = (num: number) => {
    setPaxNumParcelas(num);
    if (num === 0) {
      setPaxParcelasCustom([]);
      return;
    }

    const valorParcela = paxValorTotal > 0 ? Number((paxValorTotal / num).toFixed(2)) : 0;
    const items = [];
    const hoje = new Date();
    
    for (let i = 1; i <= num; i++) {
      const dataVenc = new Date(hoje);
      dataVenc.setMonth(dataVenc.getMonth() + (i - 1));
      items.push({
        numero_parcela: i,
        valor: valorParcela,
        data_vencimento: dataVenc.toISOString().substring(0, 10),
        status_pagamento: 'pendente'
      });
    }
    setPaxParcelasCustom(items);
  };

  const handleClienteSelect = (cId: string) => {
    if (!cId) {
      setPaxClienteId('');
      return;
    }
    const numId = Number(cId);
    setPaxClienteId(numId);
    const clienteObj = clientes.find(c => c.id === numId);
    if (clienteObj) {
      setPaxNome(clienteObj.nome_completo);
      if (clienteObj.contato) setPaxWhatsapp(clienteObj.contato);
    }
  };

  const updateCustomParcela = (index: number, field: string, value: any) => {
    setPaxParcelasCustom(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCustomParcelaRow = () => {
    setPaxParcelasCustom(prev => {
      const nextNum = prev.length + 1;
      const hoje = new Date();
      hoje.setMonth(hoje.getMonth() + (nextNum - 1));
      const updated = [
        ...prev,
        {
          numero_parcela: nextNum,
          valor: 0,
          data_vencimento: hoje.toISOString().substring(0, 10),
          status_pagamento: 'pendente'
        }
      ];
      setPaxNumParcelas(updated.length);
      return updated;
    });
  };

  const removeCustomParcelaRow = (index: number) => {
    setPaxParcelasCustom(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      const renumbered = filtered.map((p, i) => ({ ...p, numero_parcela: i + 1 }));
      setPaxNumParcelas(renumbered.length);
      return renumbered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paxNome) {
      toast.error('Informe o nome do passageiro.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/passageiros', {
        viagem_id: viagemId,
        cliente_id: paxClienteId || null,
        nome: paxNome,
        contato_whatsapp: paxWhatsapp || null,
        forma_pagamento: paxFormaPagamento,
        observacoes: paxObservacoes || null,
        valor_total: paxValorTotal,
        num_parcelas: paxNumParcelas,
        parcelas: paxParcelasCustom
      });

      toast.success('Passageiro cadastrado com sucesso!');
      onClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar passageiro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Passageiro à Viagem"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Vincular Cliente Já Cadastrado (Opcional)</label>
          <select
            className="form-select"
            value={paxClienteId}
            onChange={(e) => handleClienteSelect(e.target.value)}
          >
            <option value="">-- Selecione ou digite um novo passageiro abaixo --</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome_completo} (CPF: {c.cpf}) - Saldo Crédito: R$ {Number(c.saldo_credito || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="paxNome">Nome Completo do Passageiro *</label>
            <input
              id="paxNome"
              type="text"
              className="form-input"
              placeholder="Ex: João da Silva"
              value={paxNome}
              onChange={(e) => setPaxNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="paxWhatsapp">WhatsApp / Telefone</label>
            <input
              id="paxWhatsapp"
              type="text"
              className="form-input"
              placeholder="(11) 99999-9999"
              value={paxWhatsapp}
              onChange={(e) => setPaxWhatsapp(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="paxValorTotal">Valor Total da Passagem (R$) *</label>
            <input
              id="paxValorTotal"
              type="number"
              step="0.01"
              className="form-input"
              value={paxValorTotal}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPaxValorTotal(val);
                if (paxNumParcelas > 0) {
                  handleNumParcelasChange(paxNumParcelas);
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="paxFormaPagamento">Forma de Pagamento Principal</label>
            <select
              id="paxFormaPagamento"
              className="form-select"
              value={paxFormaPagamento}
              onChange={(e) => setPaxFormaPagamento(e.target.value)}
            >
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="credito_agencia">Crédito da Agência</option>
              <option value="misto">Misto</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="paxNumParcelas">Número de Parcelas</label>
            <select
              id="paxNumParcelas"
              className="form-select"
              value={paxNumParcelas}
              onChange={(e) => handleNumParcelasChange(Number(e.target.value))}
            >
              <option value={0}>Sem parcelas fixas (Pagamentos Avulsos)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <option key={n} value={n}>
                  {n === 1 ? '1x (À vista)' : `${n}x`} {paxValorTotal > 0 ? `(R$ ${(paxValorTotal / n).toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Programação de Parcelas ou Modo Avulso */}
        <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Programação de Parcelas (Opcional - Valores e Vencimentos Editáveis)
            </label>
            <button
              type="button"
              onClick={addCustomParcelaRow}
              className="btn btn-sm btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
              <span>+ Adicionar Linha de Parcela</span>
            </button>
          </div>

          {paxParcelasCustom.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <HelpCircle size={24} style={{ margin: '0 auto 0.4rem auto', opacity: 0.6 }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Nenhuma parcela fixa programada
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Você poderá registrar pagamentos avulsos de qualquer valor e data a qualquer momento na tabela de passageiros.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {paxParcelasCustom.map((p, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '70px 140px 140px 130px 1fr 40px', 
                      gap: '0.5rem', 
                      alignItems: 'center',
                      background: '#f8fafc',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      #{p.numero_parcela}
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                        placeholder="Valor (R$)"
                        value={p.valor}
                        onChange={(e) => updateCustomParcela(idx, 'valor', Number(e.target.value))}
                        title="Valor desta parcela"
                      />
                    </div>

                    <div>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                        value={p.data_vencimento}
                        onChange={(e) => updateCustomParcela(idx, 'data_vencimento', e.target.value)}
                        title="Data de Vencimento"
                      />
                    </div>

                    <div>
                      <select
                        className="form-select"
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                        value={p.status_pagamento}
                        onChange={(e) => updateCustomParcela(idx, 'status_pagamento', e.target.value)}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Já Pago</option>
                      </select>
                    </div>

                    <div>
                      {p.status_pagamento === 'pago' ? (
                        <select
                          className="form-select"
                          style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                          value={(p as any).forma_pagamento || paxFormaPagamento}
                          onChange={(e) => updateCustomParcela(idx, 'forma_pagamento', e.target.value)}
                        >
                          <option value="pix">PIX</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="credito_agencia">Crédito Agência</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aguardando pagamento</span>
                      )}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeCustomParcelaRow(idx)}
                        className="btn btn-sm btn-danger"
                        style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                        title="Remover esta linha"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Soma das parcelas: <strong>R$ {paxParcelasCustom.reduce((acc, p) => acc + (Number(p.valor) || 0), 0).toFixed(2)}</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    const soma = paxParcelasCustom.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
                    setPaxValorTotal(soma);
                  }}
                >
                  Ajustar Total para Soma das Parcelas
                </button>
              </div>
            </>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="paxObservacoes">Observações (Local de embarque, etc.)</label>
          <textarea
            id="paxObservacoes"
            rows={2}
            className="form-textarea"
            value={paxObservacoes}
            onChange={(e) => setPaxObservacoes(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Cadastrando...' : 'Confirmar Inscrição'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
