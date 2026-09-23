import React, { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Modal } from '../Modal';
import { Usuario } from '../../types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuario: Usuario | null;
}

export const UsuarioModal: React.FC<UsuarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuario
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'admin' | 'usuario'>('usuario');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setSenha('');
      setRole(usuario.role || 'usuario');
      setStatus(usuario.status || 'ativo');
    } else {
      setNome('');
      setEmail('');
      setSenha('');
      setRole('usuario');
      setStatus('ativo');
    }
  }, [usuario, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email) {
      toast.error('Nome e e-mail são obrigatórios.');
      return;
    }

    if (!usuario && (!senha || senha.length < 6)) {
      toast.error('A senha deve ter no mínimo 6 caracteres para novos usuários.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        nome,
        email,
        role,
        status
      };

      if (senha) {
        payload.senha = senha;
      }

      if (usuario) {
        await api.put(`/usuarios/${usuario.id}`, payload);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await api.post('/usuarios', payload);
        toast.success('Usuário cadastrado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={usuario ? `Editar Usuário: ${usuario.nome}` : 'Cadastrar Novo Usuário / Operador'}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="nomeUser">Nome Completo *</label>
          <input
            id="nomeUser"
            type="text"
            className="form-input"
            placeholder="Ex: João da Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="emailUser">E-mail de Acesso *</label>
          <input
            id="emailUser"
            type="email"
            className="form-input"
            placeholder="operador@trevotour.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="senhaUser">
            {usuario ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso (Mínimo 6 caracteres) *'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="senhaUser"
              type="password"
              className="form-input"
              placeholder={usuario ? '••••••••' : 'Digite uma senha segura'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={usuario ? undefined : 6}
              required={!usuario}
            />
            <KeyRound size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="roleUser">Nível de Acesso (Permissões)</label>
            <select
              id="roleUser"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="usuario">Operador / Usuário Padrão</option>
              <option value="admin">Administrador Geral</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="statusUser">Status da Conta</label>
            <select
              id="statusUser"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="ativo">Ativo (Acesso Liberado)</option>
              <option value="inativo">Inativo (Bloqueado)</option>
            </select>
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : (usuario ? 'Atualizar Usuário' : 'Criar Usuário')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
