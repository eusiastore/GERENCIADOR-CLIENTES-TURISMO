import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Header } from '../components/Header';
import { ClienteModal } from '../components/clientes/ClienteModal';
import { ExtratoModal } from '../components/clientes/ExtratoModal';
import { Cliente } from '../types';
import { useAuth } from '../context/AuthContext';

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [modalExtratoOpen, setModalExtratoOpen] = useState(false);
  const [extratoTexto, setExtratoTexto] = useState('');

  const { isAdmin } = useAuth();

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clientes');
      if (response.data?.success && response.data?.data) {
        setClientes(response.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const openCreateModal = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const openEditModal = (c: Cliente) => {
    setEditingCliente(c);
    setModalOpen(true);
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o cliente ${nome}?`)) return;

    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente excluído com sucesso.');
      fetchClientes();
    } catch (error) {
      toast.error('Erro ao excluir cliente.');
    }
  };

  const handleGerarExtrato = async (clienteId: number) => {
    try {
      const response = await api.get(`/clientes/${clienteId}/extrato`);
      if (response.data?.success && response.data?.data?.texto) {
        setExtratoTexto(response.data.data.texto);
        setModalExtratoOpen(true);
      }
    } catch (error) {
      toast.error('Erro ao gerar extrato do cliente.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCpf = (cpfStr: string) => {
    if (!cpfStr) return '-';
    const digits = cpfStr.replace(/\D/g, '');
    if (digits.length !== 11) return cpfStr;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const filteredClientes = clientes.filter(c => {
    const term = search.toLowerCase();
    return c.nome_completo.toLowerCase().includes(term) || c.cpf.includes(term);
  });

  return (
    <div className="page-container">
      <Header
        title="Base Central de Clientes"
        subtitle="Gerenciamento cadastral, histórico de compras, saldos de créditos e extratos"
        actions={
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Novo Cliente</span>
          </button>
        }
      />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar cliente por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
          <p>Carregando clientes...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>CPF</th>
                  <th>Contato</th>
                  <th>Data de Nasc.</th>
                  <th>Saldo de Crédito</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.nome_completo}</td>
                      <td>{formatCpf(c.cpf)}</td>
                      <td>{c.contato || '-'}</td>
                      <td>{formatDate(c.data_nascimento)}</td>
                      <td>
                        <span 
                          style={{ 
                            fontWeight: 700, 
                            color: Number(c.saldo_credito) > 0 ? 'var(--primary-700)' : 'var(--text-muted)' 
                          }}
                        >
                          {formatCurrency(Number(c.saldo_credito || 0))}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleGerarExtrato(c.id)}
                            className="btn btn-sm btn-secondary"
                            title="Gerar Extrato para WhatsApp"
                          >
                            <FileText size={14} />
                            <span>Extrato</span>
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className="btn btn-sm btn-secondary"
                            title="Editar Cliente"
                          >
                            <Edit size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c.id, c.nome_completo)}
                              className="btn btn-sm btn-danger"
                              title="Excluir Cliente"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Cliente */}
      <ClienteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchClientes}
        cliente={editingCliente}
      />

      {/* Modal Extrato Formatado */}
      <ExtratoModal
        isOpen={modalExtratoOpen}
        onClose={() => setModalExtratoOpen(false)}
        extratoTexto={extratoTexto}
      />
    </div>
  );
};
