import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palmtree, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email || !senha) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmaSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        nome,
        email,
        senha
      });

      if (response.data?.success && response.data?.data) {
        const { token, user } = response.data.data;
        login(token, user);
        toast.success('Cadastro realizado com sucesso!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Falha ao registrar novo usuário.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Palmtree size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="auth-title">TrevoTour</h1>
            <p className="auth-subtitle">Criar Conta de Operador</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              className="form-input"
              placeholder="Maria da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail Corporativo</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="maria.silva@trevotour.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmaSenha">Confirmar Senha</label>
            <input
              id="confirmaSenha"
              type="password"
              className="form-input"
              placeholder="Repita sua senha"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            ) : (
              <>
                <UserPlus size={18} />
                <span>Criar Conta e Acessar</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Já possui uma conta?{' '}
          <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
};
