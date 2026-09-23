import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { PassageiroViagem } from '../../types';

interface ParcelaAvulsaModalProps {
  isOpen: boolean;
  onClose: () => void;
  pax: PassageiroViagem | null;
  onSuccess: () => void;
}

export const ParcelaAvulsaModal: React.FC<ParcelaAvulsaModalProps> = ({
  isOpen,
  onClose,
  pax,
  onSuccess
}) => {
  const [newParcNumero, setNewParcNumero] = useState(1);
  const [newParcValor, setNewParcValor] = useState<number>(0);
  const [newParcDataVenc, setNewParcDataVenc] = useState(new Date().toISOString().substring(0, 10));
  const [newParcStatus, setNewParcStatus] = useState<'pendente' | 'pago'>('pago');
  const [newParcDataPag, setNewParcDataPag] = useState(new Date().toISOString().substring(0, 10));
  const [newParcForma, setNewParcForma] = useState('pix');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pax) {
      const proximoNumero = (pax.parcelas?.length || 0) + 1;
      setNewParcNumero(proximoNumero);
      const saldo = Number(pax.valor_total) - Number(pax.valor_pago);
      setNewParcValor(saldo > 0 ? Number(saldo.toFixed(2)) : 0);
      setNewParcDataVenc(new Date().toISOString().substring(0, 10));
      setNewParcStatus('pago');
      setNewParcDataPag(new Date().toISOString().substring(0, 10));
      setNewParcForma('pix');
    }
  }, [pax, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pax || newParcValor <= 0) {
      toast.error('Informe um valor válido para a nova parcela.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/parcelas', {
        passageiro_id: pax.id,
        append: true,
        parcelas: [
          {
            numero_parcela: newParcNumero,
            valor: newParcValor,
            data_vencimento: newParcDataVenc || null,
            data_pagamento: newParcStatus === 'pago' ? newParcDataPag : null,
            status_pagamento: newParcStatus,
            forma_pagamento: newParcForma
          }
        ]
      });

      toast.success('Nova parcela adicionada com sucesso!');
      onClose();
      onSuccess();
    } catch (error) {
      toast.error('Erro ao adicionar nova parcela.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adicionar Nova Parcela #${newParcNumero} - ${pax?.nome || ''}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Valor da Parcela (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={newParcValor || ''}
              onChange={(e) => setNewParcValor(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Data de Vencimento</label>
            <input
              type="date"
              className="form-input"
              value={newParcDataVenc}
              onChange={(e) => setNewParcDataVenc(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status da Parcela</label>
          <select
            className="form-select"
            value={newParcStatus}
            onChange={(e) => setNewParcStatus(e.target.value as any)}
          >
            <option value="pago">PAGO (Recebido Agora)</option>
            <option value="pendente">PENDENTE</option>
          </select>
        </div>

        {newParcStatus === 'pago' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data do Pagamento</label>
              <input
                type="date"
                className="form-input"
                value={newParcDataPag}
                onChange={(e) => setNewParcDataPag(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Forma de Pagamento</label>
              <select
                className="form-select"
                value={newParcForma}
                onChange={(e) => setNewParcForma(e.target.value)}
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="credito_agencia">Crédito da Agência</option>
              </select>
            </div>
          </div>
        )}

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Gravando...' : 'Gravar Nova Parcela'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
