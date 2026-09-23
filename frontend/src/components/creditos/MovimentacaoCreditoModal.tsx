import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { Cliente } from '../../types';

interface MovimentacaoCreditoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  defaultClienteId?: number | '';
}

export const MovimentacaoCreditoModal: React.FC<MovimentacaoCreditoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  defaultClienteId = ''
}) => {
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [valor, setValor] = useState<number>(0);
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedClienteId(defaultClienteId || '');
    setTipo('entrada');
    setValor(0);
    setDescricao('');
  }, [defaultClienteId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId || valor <= 0) {
      toast.error('Selecione um cliente e informe um valor maior que zero.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/creditos', {
        cliente_id: selectedClienteId,
        tipo,
        valor,
        descricao: descricao || null
      });

      toast.success('Movimentação de crédito registrada com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar crédito.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lançar Movimentação de Crédito / Débito"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="clienteId">Cliente *</label>
          <select
            id="clienteId"
            className="form-select"
            value={selectedClienteId}
            onChange={(e) => setSelectedClienteId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Selecione o cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo} (CPF: {c.cpf}) - Saldo Atual: R$ {Number(c.saldo_credito || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo de Movimentação</label>
            <select
              className="form-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida')}
            >
              <option value="entrada">ENTRADA (+) - Adicionar Crédito</option>
              <option value="saida">SAÍDA (-) - Abater / Usar Crédito</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="valor">Valor (R$) *</label>
            <input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={valor || ''}
              onChange={(e) => setValor(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="descricao">Motivo / Descrição</label>
          <textarea
            id="descricao"
            rows={2}
            className="form-textarea"
            placeholder="Ex: Cancelamento de viagem Caldas Novas, devolução, etc."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Registrando...' : 'Confirmar Movimentação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
