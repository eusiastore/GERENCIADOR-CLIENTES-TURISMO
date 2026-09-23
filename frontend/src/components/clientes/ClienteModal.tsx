import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { Cliente } from '../../types';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente: Cliente | null;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cliente
}) => {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [contato, setContato] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cliente) {
      setNomeCompleto(cliente.nome_completo || '');
      setCpf(cliente.cpf || '');
      setDataNascimento(cliente.data_nascimento ? cliente.data_nascimento.substring(0, 10) : '');
      setContato(cliente.contato || '');
    } else {
      setNomeCompleto('');
      setCpf('');
      setDataNascimento('');
      setContato('');
    }
  }, [cliente, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto || !cpf) {
      toast.error('Nome completo e CPF são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome_completo: nomeCompleto,
        cpf,
        data_nascimento: dataNascimento || null,
        contato: contato || null
      };

      if (cliente) {
        await api.put(`/clientes/${cliente.id}`, payload);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clientes', payload);
        toast.success('Cliente cadastrado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cliente ? `Editar Cliente: ${cliente.nome_completo}` : 'Novo Cadastro de Cliente'}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="nomeCompleto">Nome Completo *</label>
          <input
            id="nomeCompleto"
            type="text"
            className="form-input"
            placeholder="Ex: Carlos Eduardo de Oliveira"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="cpf">CPF (apenas números) *</label>
            <input
              id="cpf"
              type="text"
              className="form-input"
              placeholder="123.456.789-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contato">Telefone / WhatsApp</label>
            <input
              id="contato"
              type="text"
              className="form-input"
              placeholder="(11) 99999-9999"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="dataNascimento">Data de Nascimento</label>
          <input
            id="dataNascimento"
            type="date"
            className="form-input"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : (cliente ? 'Atualizar Cliente' : 'Cadastrar Cliente')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
