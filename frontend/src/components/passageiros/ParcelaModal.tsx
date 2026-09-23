import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { ParcelaPassageiro } from '../../types';

interface ParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaPassageiro | null;
  onSuccess: () => void;
}

export const ParcelaModal: React.FC<ParcelaModalProps> = ({
  isOpen,
  onClose,
  parcela,
  onSuccess
}) => {
  const [parcValor, setParcValor] = useState<number>(0);
  const [parcStatus, setParcStatus] = useState<'pendente' | 'pago' | 'vencido'>('pago');
  const [parcDataVenc, setParcDataVenc] = useState('');
  const [parcDataPag, setParcDataPag] = useState(new Date().toISOString().substring(0, 10));
  const [parcForma, setParcForma] = useState('pix');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (parcela) {
      setParcValor(Number(parcela.valor) || 0);
      setParcStatus(parcela.status_pagamento === 'pago' ? 'pago' : 'pago');
      setParcDataVenc(parcela.data_vencimento ? String(parcela.data_vencimento).substring(0, 10) : new Date().toISOString().substring(0, 10));
      setParcDataPag(parcela.data_pagamento ? String(parcela.data_pagamento).substring(0, 10) : new Date().toISOString().substring(0, 10));
      setParcForma(parcela.forma_pagamento || 'pix');
    }
  }, [parcela, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcela) return;

    setSaving(true);
    try {
      await api.put(`/parcelas/${parcela.id}`, {
        valor: parcValor,
        data_vencimento: parcDataVenc || null,
        status_pagamento: parcStatus,
        data_pagamento: parcStatus === 'pago' ? parcDataPag : null,
        forma_pagamento: parcForma
      });

      toast.success('Parcela atualizada com sucesso!');
      onClose();
      onSuccess();
    } catch (error) {
      toast.error('Erro ao atualizar parcela.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar / Baixar Parcela ${parcela?.numero_parcela}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="parcValor">Valor da Parcela (R$) *</label>
            <input
              id="parcValor"
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={parcValor}
              onChange={(e) => setParcValor(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="parcDataVenc">Data de Vencimento</label>
            <input
              id="parcDataVenc"
              type="date"
              className="form-input"
              value={parcDataVenc}
              onChange={(e) => setParcDataVenc(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="parcStatus">Status do Pagamento</label>
          <select
            id="parcStatus"
            className="form-select"
            value={parcStatus}
            onChange={(e) => setParcStatus(e.target.value as any)}
          >
            <option value="pago">PAGO (Recebido)</option>
            <option value="pendente">PENDENTE (Aguardando Pagamento)</option>
            <option value="vencido">VENCIDO</option>
          </select>
        </div>

        {parcStatus === 'pago' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="parcDataPag">Data do Pagamento</label>
              <input
                id="parcDataPag"
                type="date"
                className="form-input"
                value={parcDataPag}
                onChange={(e) => setParcDataPag(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="parcForma">Forma de Pagamento</label>
              <select
                id="parcForma"
                className="form-select"
                value={parcForma}
                onChange={(e) => setParcForma(e.target.value)}
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="credito_agencia">Crédito da Agência (Abater Saldo)</option>
              </select>
            </div>
          </div>
        )}

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações da Parcela'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
