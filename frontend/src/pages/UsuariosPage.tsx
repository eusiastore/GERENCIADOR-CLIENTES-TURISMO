import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  User as UserIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Header } from '../components/Header';
import { UsuarioModal } from '../components/usuarios/UsuarioModal';
import { Usuario } from '../types';
import { useAuth } from '../context/AuthContext';

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Criar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  const { user: currentUser } = useAuth();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/usuarios');
      if (response.data?.success && response.data?.data) {
        setUsuarios(response.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const openCreateModal = () => {
    setEditingUsuario(null);
    setModalOpen(true);
  };

  const openEditModal = (u: Usuario) => {
    setEditingUsuario(u);
    setModalOpen(true);
  };

  const handleDelete = async (u: Usuario) => {
    if (u.id === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário logado.');
      return;
    }

    if (!window.confirm(`Deseja realmente remover o usuário ${u.nome}?`)) return;

    try {
      await api.delete(`/usuarios/${u.id}`);
      toast.success('Usuário removido com sucesso.');
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover usuário.');
    }
  };

  return (
    <div className="page-container">
      <Header
        title="Gestão de Usuários & Operadores"
        subtitle="Gerenciamento de contas de acesso, senhas e permissões administrativas"
        actions={
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Novo Usuário</span>
          </button>
        }
      />

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
          <p>Carregando usuários...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome do Usuário</th>
                  <th>E-mail</th>
                  <th>Nível de Acesso</th>
                  <th>Status</th>
                  <th>Data de Cadastro</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.role === 'admin' ? (
                          <ShieldCheck size={16} style={{ color: '#7e22ce' }} />
                        ) : (
                          <UserIcon size={16} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span>{u.nome}</span>
                        {u.id === currentUser?.id && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                            (Você)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-role-${u.role}`}>
                        {u.role === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-sm btn-secondary"
                          title="Editar Usuário / Senha"
                        >
                          <Edit size={14} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="btn btn-sm btn-danger"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Usuário */}
      <UsuarioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsuarios}
        usuario={editingUsuario}
      />
    </div>
  );
};
