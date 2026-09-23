import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palmtree, LogIn, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error('Informe seu e-mail e sua senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, senha });

      if (response.data?.success && response.data?.data) {
        const { token, user } = response.data.data;
        login(token, user);
        toast.success(`Bem-vindo(a), ${user.nome}!`);
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Falha ao autenticar no sistema.';
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
            <p className="auth-subtitle">Acesso ao Painel Operacional</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu.email@trevotour.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                id="senha"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
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
                <LogIn size={18} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Precisa de uma nova conta?{' '}
          <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
};
