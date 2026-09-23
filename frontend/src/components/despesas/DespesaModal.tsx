import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { CategoriaDespesa } from '../../types';

interface DespesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  viagemId: number;
  onSuccess: () => void;
}

export const DespesaModal: React.FC<DespesaModalProps> = ({
  isOpen,
  onClose,
  viagemId,
  onSuccess
}) => {
  const [despCategoria, setDespCategoria] = useState<CategoriaDespesa>('onibus_van');
  const [despDescricao, setDespDescricao] = useState('');
  const [despValorCusto, setDespValorCusto] = useState(0);
  const [despValorPago, setDespValorPago] = useState(0);
  const [despEmpresa, setDespEmpresa] = useState('');
  const [despContato, setDespContato] = useState('');
  const [despObs, setDespObs] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despValorCusto || despValorCusto <= 0) {
      toast.error('Informe o valor de custo da despesa.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/despesas', {
        viagem_id: viagemId,
        categoria: despCategoria,
        descricao: despDescricao || null,
        valor_custo: despValorCusto,
        valor_pago: despValorPago,
        empresa: despEmpresa || null,
        contato_empresa: despContato || null,
        observacoes: despObs || null
      });

      toast.success('Despesa lançada com sucesso!');
      onClose();
      setDespDescricao('');
      setDespValorCusto(0);
      setDespValorPago(0);
      setDespEmpresa('');
      setDespContato('');
      setDespObs('');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao cadastrar despesa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lançar Despesa de Viagem"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Categoria de Custo *</label>
          <select
            className="form-select"
            value={despCategoria}
            onChange={(e) => setDespCategoria(e.target.value as any)}
          >
            <option value="onibus_van">Ônibus / Van (Transporte)</option>
            <option value="hospedagem">Hospedagem / Hotel</option>
            <option value="ingressos">Ingressos / Parques</option>
            <option value="refeicoes">Refeições / Restaurante</option>
            <option value="kit_lanche">Kit Lanche</option>
            <option value="servico_bordo">Serviço de Bordo</option>
            <option value="fb_anuncios">Anúncios / Marketing</option>
            <option value="guia_local">Guia Local</option>
            <option value="seguro_viagem">Seguro Viagem</option>
            <option value="gastos_guia_motorista">Gastos Guia/Motorista</option>
            <option value="brinde">Brindes</option>
            <option value="despesas_extras">Despesas Extras</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição / Empresa Fornecedora</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Viação Progresso / Hotel Thermas"
            value={despDescricao}
            onChange={(e) => setDespDescricao(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Valor Total do Custo (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={despValorCusto}
              onChange={(e) => setDespValorCusto(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor Já Pago (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={despValorPago}
              onChange={(e) => setDespValorPago(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Contato Fornecedor</label>
          <input
            type="text"
            className="form-input"
            placeholder="(11) 98888-7777"
            value={despContato}
            onChange={(e) => setDespContato(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Observações Adicionais</label>
          <textarea
            rows={2}
            className="form-textarea"
            placeholder="Observações sobre faturas, prazos ou condições..."
            value={despObs}
            onChange={(e) => setDespObs(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Lançando...' : 'Lançar Despesa'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
