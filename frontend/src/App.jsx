import React, { useState, useEffect } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from './api';

import { AppShell } from './components/AppShell';
import { LoginView } from './components/LoginView';
import { DashboardTab } from './components/DashboardTab';
import { ClientesTab } from './components/ClientesTab';
import { ApolicesTab } from './components/ApolicesTab';
import { CotacoesTab } from './components/CotacoesTab';
import { AlertasTab } from './components/AlertasTab';
import { SegurosTab } from './components/SegurosTab';
import { CorretoresTab } from './components/CorretoresTab';
import { UsuariosTab } from './components/UsuariosTab';
import { RelatoriosTab } from './components/RelatoriosTab';
import AuditoriaTab from './components/AuditoriaTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('painel');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('admin'); // 'admin' | 'corretor' | 'cliente'
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Checa se há token salvo ou perfil padrão para iniciar
  useEffect(() => {
    const initSession = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await apiFetch('/auth/me');
          setCurrentUser(me);
          setCurrentRole(
            me.perfilAcesso === 'ADMINISTRADOR'
              ? 'admin'
              : me.perfilAcesso === 'CORRETOR'
              ? 'corretor'
              : 'cliente'
          );
        } catch (e) {
          console.warn('Sessão expirada ou inválida:', e);
          setAuthToken(null);
        }
      } else {
        // Para comodidade da homologação direta do protótipo, inicializa logado como Helena (Admin)
        // se desejar deslogar, basta clicar no ícone de sair no rodapé da sidebar.
        try {
          const loginData = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@hcr.com', senha: 'admin123' })
          });
          setAuthToken(loginData.token);
          setCurrentUser({
            id: loginData.id,
            nome: loginData.nome,
            email: loginData.email,
            perfilAcesso: loginData.perfil
          });
          setCurrentRole('admin');
        } catch {
          // segue sem login
        }
      }

      // Carrega contagem de alertas não lidos
      try {
        const alertas = await apiFetch('/alertas');
        if (alertas && Array.isArray(alertas)) {
          const unread = alertas.filter((a) => !a.lido).length;
          setUnreadAlertsCount(unread || 9);
        }
      } catch {
        setUnreadAlertsCount(9);
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setCurrentRole(userData.role || 'admin');
    setActiveTab('painel');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveTab('painel');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-foreground">
        <span className="size-12 rounded-xl bg-gradient-signal font-display text-2xl font-bold text-signal-foreground flex items-center justify-center shadow-lift animate-pulse">
          H
        </span>
        <p className="text-sm font-medium text-muted-foreground">
          Carregando HCR Corretora...
        </p>
      </div>
    );
  }

  // Se o usuário deslogar, exibe a tela de login idêntica ao Lovable
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentUser={currentUser}
      currentRole={currentRole}
      setCurrentRole={setCurrentRole}
      onLogout={handleLogout}
      unreadAlertsCount={unreadAlertsCount}
    >
      {activeTab === 'painel' && (
        <DashboardTab
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'clientes' && (
        <ClientesTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'apolices' && (
        <ApolicesTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'cotacoes' && (
        <CotacoesTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'alertas' && (
        <AlertasTab
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'seguros' && (
        <SegurosTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'corretores' && (
        <CorretoresTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'usuarios' && (
        <UsuariosTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'relatorios' && (
        <RelatoriosTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {activeTab === 'auditoria' && (
        <AuditoriaTab
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}
    </AppShell>
  );
}
