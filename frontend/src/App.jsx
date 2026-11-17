import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from './api';
import { mapAlerta, mapUsuarioLogado } from './mappers';
import { podeVerTela } from './permissoes';
import { AppShell } from './components/AppShell';
import { LoginView } from './components/LoginView';
import { DashboardTab } from './components/DashboardTab';
import { ClientesTab } from './components/ClientesTab';
import { ApolicesTab } from './components/ApolicesTab';
import { PremiosTab } from './components/PremiosTab';
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
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // O perfil vem sempre do usuário autenticado (GET /auth/me); não há troca manual de perfil
  const currentRole = currentUser?.role || 'cliente';

  const carregarAlertasNaoLidos = useCallback(async () => {
    try {
      const alertas = await apiFetch('/alertas');
      setUnreadAlertsCount((alertas || []).map(mapAlerta).filter((a) => !a.lido).length);
    } catch {
      setUnreadAlertsCount(0);
    }
  }, []);

  // Dados completos da sessão (inclui clienteId/corretorId, usados para filtrar "meus dados")
  const carregarSessao = useCallback(async () => {
    const me = await apiFetch('/auth/me');
    setCurrentUser(mapUsuarioLogado(me));
    await carregarAlertasNaoLidos();
  }, [carregarAlertasNaoLidos]);

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setUnreadAlertsCount(0);
    setActiveTab('painel');
  }, []);

  // Restaura a sessão se houver token salvo; sem token, mostra a tela de login
  useEffect(() => {
    const iniciar = async () => {
      if (getAuthToken()) {
        try {
          await carregarSessao();
        } catch (e) {
          console.warn('Sessão expirada ou inválida:', e);
          setAuthToken(null);
        }
      }
      setIsInitializing(false);
    };
    iniciar();
  }, [carregarSessao]);

  // Token expirado ou usuário desativado durante o uso: volta para o login
  useEffect(() => {
    window.addEventListener('hcr:sessao-expirada', handleLogout);
    return () => window.removeEventListener('hcr:sessao-expirada', handleLogout);
  }, [handleLogout]);

  // Mantém o contador do sino atualizado ao navegar (ex.: após marcar alertas como lidos)
  useEffect(() => {
    if (currentUser) carregarAlertasNaoLidos();
  }, [activeTab, currentUser, carregarAlertasNaoLidos]);

  const handleLoginSuccess = async (userData) => {
    try {
      await carregarSessao();
    } catch {
      setCurrentUser(userData);
    }
    setActiveTab('painel');
  };

  // Impede abrir uma tela que o perfil não pode ver
  const abrirTela = (tela) => setActiveTab(podeVerTela(currentRole, tela) ? tela : 'painel');

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-foreground">
        <span className="size-10 rounded-md bg-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const tela = podeVerTela(currentRole, activeTab) ? activeTab : 'painel';
  const props = { currentUser, currentRole };

  return (
    <AppShell
      activeTab={tela}
      setActiveTab={abrirTela}
      currentUser={currentUser}
      currentRole={currentRole}
      onLogout={handleLogout}
      unreadAlertsCount={unreadAlertsCount}
    >
      {tela === 'painel' && <DashboardTab setActiveTab={abrirTela} {...props} />}
      {tela === 'clientes' && <ClientesTab {...props} />}
      {tela === 'apolices' && <ApolicesTab {...props} />}
      {tela === 'premios' && <PremiosTab setActiveTab={abrirTela} {...props} />}
      {tela === 'cotacoes' && <CotacoesTab {...props} />}
      {tela === 'alertas' && <AlertasTab setActiveTab={abrirTela} {...props} />}
      {tela === 'seguros' && <SegurosTab {...props} />}
      {tela === 'corretores' && <CorretoresTab {...props} />}
      {tela === 'usuarios' && <UsuariosTab {...props} />}
      {tela === 'relatorios' && <RelatoriosTab {...props} />}
      {tela === 'auditoria' && <AuditoriaTab {...props} />}
    </AppShell>
  );
}
