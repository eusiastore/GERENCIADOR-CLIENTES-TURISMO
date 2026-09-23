import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { Viagem } from '../../types';

interface ViagemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  viagem: Viagem | null;
}

export const ViagemModal: React.FC<ViagemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  viagem
}) => {
  const [nomeDestino, setNomeDestino] = useState('');
  const [dataViagem, setDataViagem] = useState('');
  const [capacidadeMaxima, setCapacidadeMaxima] = useState(46);
  const [ultimaDataPagamento, setUltimaDataPagamento] = useState('');
  const [status, setStatus] = useState<'ativa' | 'encerrada' | 'cancelada'>('ativa');
  const [valorPadrao, setValorPadrao] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (viagem) {
      setNomeDestino(viagem.nome_destino || '');
      setDataViagem(viagem.data_viagem ? String(viagem.data_viagem).substring(0, 10) : '');
      setCapacidadeMaxima(viagem.capacidade_maxima || 46);
      setUltimaDataPagamento(viagem.ultima_data_pagamento ? String(viagem.ultima_data_pagamento).substring(0, 10) : '');
      setStatus(viagem.status || 'ativa');
      setValorPadrao(Number(viagem.valor_padrao) || 0);
      setObservacoes(viagem.observacoes || '');
    } else {
      setNomeDestino('');
      setDataViagem('');
      setCapacidadeMaxima(46);
      setUltimaDataPagamento('');
      setStatus('ativa');
      setValorPadrao(0);
      setObservacoes('');
    }
  }, [viagem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeDestino || !dataViagem) {
      toast.error('Informe o nome do destino e a data da viagem.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome_destino: nomeDestino,
        data_viagem: dataViagem,
        capacidade_maxima: capacidadeMaxima,
        ultima_data_pagamento: ultimaDataPagamento || null,
        status,
        valor_padrao: valorPadrao,
        observacoes: observacoes || null
      };

      if (viagem) {
        await api.put(`/viagens/${viagem.id}`, payload);
        toast.success('Viagem atualizada com sucesso!');
      } else {
        await api.post('/viagens', payload);
        toast.success('Viagem criada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao salvar viagem.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={viagem ? `Editar Viagem: ${viagem.nome_destino}` : 'Cadastrar Nova Viagem'}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="nomeDestino">Nome do Destino / Excursão *</label>
          <input
            id="nomeDestino"
            type="text"
            className="form-input"
            placeholder="Ex: Caldas Novas - GO"
            value={nomeDestino}
            onChange={(e) => setNomeDestino(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="dataViagem">Data da Viagem *</label>
            <input
              id="dataViagem"
              type="date"
              className="form-input"
              value={dataViagem}
              onChange={(e) => setDataViagem(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="capacidadeMaxima">Capacidade Máxima de Vagas *</label>
            <input
              id="capacidadeMaxima"
              type="number"
              min="1"
              className="form-input"
              value={capacidadeMaxima}
              onChange={(e) => setCapacidadeMaxima(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="valorPadrao">Valor Padrão da Passagem (R$)</label>
            <input
              id="valorPadrao"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              value={valorPadrao}
              onChange={(e) => setValorPadrao(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ultimaDataPagamento">Última Data para Pagamento</label>
            <input
              id="ultimaDataPagamento"
              type="date"
              className="form-input"
              value={ultimaDataPagamento}
              onChange={(e) => setUltimaDataPagamento(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="status">Status da Viagem</label>
          <select
            id="status"
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ativa">Ativa (Inscrições e Pagamentos Abertos)</option>
            <option value="encerrada">Encerrada (Concluída)</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="observacoes">Observações Gerais</label>
          <textarea
            id="observacoes"
            rows={3}
            className="form-textarea"
            placeholder="Informações de embarque, cronograma, etc."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : (viagem ? 'Atualizar Viagem' : 'Criar Viagem')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
