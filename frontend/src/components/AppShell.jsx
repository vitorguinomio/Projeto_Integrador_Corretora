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
  ChevronRight,
  Wallet
} from 'lucide-react';
import { podeVerTela, ROTULO_PERFIL } from '../permissoes';

export const AppShell = ({
  activeTab,
  setActiveTab,
  currentUser,
  currentRole,
  onLogout,
  unreadAlertsCount = 0,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const todosOsGrupos = [
    {
      title: 'Operação',
      items: [
        { id: 'painel', label: 'Painel', icon: LayoutDashboard },
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'apolices', label: 'Apólices', icon: Shield },
        { id: 'premios', label: 'Prêmios', icon: Wallet },
        { id: 'cotacoes', label: 'Cotações e propostas', icon: FileCheck },
        { id: 'alertas', label: 'Alertas', icon: Bell, badge: unreadAlertsCount }
      ]
    },
    {
      title: 'Gestão',
      items: [
        { id: 'seguros', label: 'Seguros e coberturas', icon: Umbrella },
        { id: 'corretores', label: 'Corretores', icon: Briefcase },
        { id: 'usuarios', label: 'Usuários e permissões', icon: UserCog },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
        { id: 'auditoria', label: 'Auditoria', icon: History }
      ]
    }
  ];

  // Menu só com as telas que o perfil logado pode acessar
  const navGroups = todosOsGrupos
    .map((g) => ({ ...g, items: g.items.filter((i) => podeVerTela(currentRole, i.id)) }))
    .filter((g) => g.items.length > 0);

  // Localização atual para o "breadcrumb" da barra superior
  const currentGroup = navGroups.find((g) => g.items.some((i) => i.id === activeTab));
  const currentItem = currentGroup?.items.find((i) => i.id === activeTab);

  const userInitials = currentUser?.nome
    ? currentUser.nome
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'HC';

  const userDisplayName = currentUser?.nome || 'Helena Castro Rocha';
  const userRoleDisplay = ROTULO_PERFIL[currentRole] || 'Cliente';

  const Brand = () => (
    <div className="flex items-center gap-2.5">
      <img src="/logo-hcr-monograma.png" alt="" className="size-9 shrink-0" />
      <div className="leading-tight">
        <span className="block text-sm font-semibold text-foreground">HCR</span>
        <span className="block text-xs text-muted-foreground">Corretora de Seguros</span>
      </div>
    </div>
  );

  const renderNavList = () =>
    navGroups.map((group) => (
      <div key={group.title}>
        <p className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">{group.title}</p>
        <ul className="space-y-px">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="min-w-5 rounded-md bg-primary px-1.5 text-center text-xs font-medium leading-5 tabular-nums text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ));

  const UserFooter = () => (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        {userInitials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{userDisplayName}</p>
        <p className="truncate text-xs text-muted-foreground">{userRoleDisplay}</p>
      </div>
      <button
        onClick={onLogout}
        aria-label="Sair"
        title="Sair do sistema"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Menu lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Brand />
        </div>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2.5 py-4">{renderNavList()}</nav>
        <div className="border-t border-border p-3">
          <UserFooter />
        </div>
      </aside>

      {/* Menu lateral (celular) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-72 flex-col border-r border-border bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Brand />
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">{renderNavList()}</nav>
            <div className="border-t border-border p-3">
              <UserFooter />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex size-8 items-center justify-center rounded-md text-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          {currentItem && (
            <nav aria-label="Localização" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{currentGroup.title}</span>
              <ChevronRight className="hidden size-3.5 text-muted-foreground sm:inline" />
              <span className="truncate font-medium text-foreground">{currentItem.label}</span>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('alertas')}
              aria-label={unreadAlertsCount > 0 ? `Alertas (${unreadAlertsCount} não lidos)` : 'Alertas'}
              className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell className="size-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-background" />
              )}
            </button>

            <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-sm text-foreground">
              <span className="hidden text-muted-foreground sm:inline">Perfil:</span>
              <span className="font-medium">{userRoleDisplay}</span>
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
};
