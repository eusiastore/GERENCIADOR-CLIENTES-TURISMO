import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="header">
      <div className="header-title-wrapper">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {actions && <div>{actions}</div>}

        <div className="header-user-info">
          <div className="user-badge">
            <div className="user-avatar">
              {getInitials(user?.nome || '')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.nome}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
