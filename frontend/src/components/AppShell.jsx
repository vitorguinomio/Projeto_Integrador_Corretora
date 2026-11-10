import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileCheck,
  Bell,
  Umbrella,
  Briefcase,
  UserCog,
  BarChart3,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const AppShell = ({
  activeTab,
  setActiveTab,
  currentUser,
  currentRole,
  setCurrentRole,
  onLogout,
  unreadAlertsCount = 0,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const operacaoNav = [
    { id: 'painel', label: 'Painel', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'apolices', label: 'Apólices', icon: Shield },
    { id: 'cotacoes', label: 'Cotações e propostas', icon: FileCheck },
    { id: 'alertas', label: 'Alertas', icon: Bell, badge: unreadAlertsCount }
  ];

  const gestaoNav = [
    { id: 'seguros', label: 'Seguros e coberturas', icon: Umbrella },
    { id: 'corretores', label: 'Corretores', icon: Briefcase },
    { id: 'usuarios', label: 'Usuários e permissões', icon: UserCog },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'auditoria', label: 'Auditoria', icon: History }
  ];

  const availableRoles = [
    { id: 'admin', label: 'Administrador' },
    { id: 'corretor', label: 'Corretor' },
    { id: 'cliente', label: 'Cliente' }
  ];

  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  const userInitials = currentUser?.nome
    ? currentUser.nome
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'HC';

  const userDisplayName = currentUser?.nome || 'Helena Castro Rocha';
  const userRoleDisplay =
    currentRole === 'admin'
      ? 'Administradora'
      : currentRole === 'corretor'
      ? 'Corretor'
      : 'Cliente';

  const renderNavList = () => (
    <>
      <div>
        <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/50">
          Operação
        </p>
        <ul className="space-y-0.5">
          {operacaoNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon
                    className={`size-4 transition-opacity ${
                      isActive
                        ? 'text-sidebar-primary opacity-100'
                        : 'opacity-70 group-hover:opacity-100'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="rounded-full bg-sidebar-primary px-1.5 py-0.2 text-[0.65rem] font-bold tabular text-sidebar-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/50">
          Gestão
        </p>
        <ul className="space-y-0.5">
          {gestaoNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon
                    className={`size-4 transition-opacity ${
                      isActive
                        ? 'text-sidebar-primary opacity-100'
                        : 'opacity-70 group-hover:opacity-100'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar border-r border-sidebar-border lg:flex">
        {/* Brand Header */}
        <div className="border-b border-sidebar-border px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex size-10 items-center justify-center rounded-xl bg-gradient-signal font-display text-lg font-semibold text-signal-foreground shadow-lift">
              H
            </span>
            <div className="leading-tight">
              <span className="block font-display text-lg font-bold text-sidebar-accent-foreground">
                HCR
              </span>
              <span className="block text-[0.68rem] uppercase tracking-[0.2em] text-sidebar-foreground/70">
                Corretora de Seguros
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
          {renderNavList()}
        </nav>

        {/* User Footer */}
        <div className="m-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground shrink-0">
            {userInitials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              {userDisplayName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {userRoleDisplay}
            </p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Sair"
            title="Sair do sistema"
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-sidebar border-r border-sidebar-border p-4 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <span className="size-9 inline-flex items-center justify-center rounded-xl bg-gradient-signal font-display font-semibold text-signal-foreground">
                  H
                </span>
                <span className="font-display font-bold text-sidebar-accent-foreground">
                  HCR Corretora
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 space-y-6">
              {renderNavList()}
            </nav>
            <div className="pt-3 border-t border-sidebar-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-sidebar-accent-foreground">
                  {userDisplayName}
                </p>
                <p className="text-xs text-sidebar-foreground/70">{userRoleDisplay}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-accent lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <p className="hidden text-sm capitalize text-muted-foreground md:block">
            {todayStr}
          </p>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('alertas')}
              aria-label="Alertas"
              className="relative inline-flex size-9 items-center justify-center rounded-md border border-border hover:bg-accent text-foreground transition-colors"
            >
              <Bell className="size-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-signal text-signal-foreground text-[0.62rem] font-bold flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
              >
                <span className="hidden text-muted-foreground sm:inline">Perfil:</span>
                <span className="font-semibold capitalize">
                  {availableRoles.find((r) => r.id === currentRole)?.label || currentRole}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-card z-50 animate-rise">
                  <div className="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    Alternar perfil
                  </div>
                  {availableRoles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setCurrentRole(role.id);
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                        currentRole === role.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <span>{role.label}</span>
                      {currentRole === role.id && <Sparkles className="size-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
