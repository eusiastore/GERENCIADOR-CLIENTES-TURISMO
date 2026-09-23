import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ViagensPage } from './pages/ViagensPage';
import { ViagemDetalhesPage } from './pages/ViagemDetalhesPage';
import { ClientesPage } from './pages/ClientesPage';
import { CreditosPage } from './pages/CreditosPage';
import { UsuariosPage } from './pages/UsuariosPage';

const AppLayout: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/viagens" element={<ViagensPage />} />
          <Route path="/viagens/:id" element={<ViagemDetalhesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/creditos" element={<CreditosPage />} />
          
          {/* Rotas exclusivas para administradores */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'var(--font-family)',
            fontSize: '0.9rem',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)'
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/entrar" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
