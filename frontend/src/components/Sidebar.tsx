import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Compass, 
  Users, 
  CreditCard, 
  UserCheck, 
  LogOut, 
  Palmtree 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <Palmtree size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-brand-title">TrevoTour</div>
          <div className="sidebar-brand-subtitle">Gestão de Excursões</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/viagens" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Compass size={18} />
          <span>Viagens</span>
        </NavLink>

        <NavLink 
          to="/clientes" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Clientes</span>
        </NavLink>

        <NavLink 
          to="/creditos" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <CreditCard size={18} />
          <span>Créditos & Saldos</span>
        </NavLink>

        {isAdmin && (
          <NavLink 
            to="/usuarios" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <UserCheck size={18} />
            <span>Usuários & Acesso</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user?.nome}</span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>
            {user?.role === 'admin' ? 'Administrador' : 'Operador'}
          </span>
        </div>
        <button 
          onClick={logout} 
          className="btn btn-icon btn-secondary" 
          title="Sair do Sistema"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
