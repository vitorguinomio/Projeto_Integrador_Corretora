import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  FileCheck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { PageHeader, StatCard, StatusBadge, SectionCard, EmptyState } from './ui/UiBits';
import { apiFetch } from '../api';

export const DashboardTab = ({ setActiveTab, currentUser, currentRole }) => {
  const [stats, setStats] = useState({
    totalClientes: 0,
    apolicesAtivas: 0,
    totalCotacoes: 0,
    alertasPendentes: 0,
    receitaEstimada: 0
  });
  const [expiringPolicies, setExpiringPolicies] = useState([]);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, clientesData, apolicesData, cotacoesData, alertasData, segurosData] = await Promise.all([
        apiFetch('/dashboard/stats').catch(() => null),
        apiFetch('/clientes').catch(() => []),
        apiFetch('/apolices').catch(() => []),
        apiFetch('/cotacoes').catch(() => []),
        apiFetch('/alertas').catch(() => []),
        apiFetch('/seguros').catch(() => [])
      ]);

      const ativas = (apolicesData || []).filter((a) => {
        const sit = String(a.situacao || '').toUpperCase();
        return sit === 'ATIVA' || sit === 'EM_RENOVACAO';
      });
      const receita = ativas.reduce(
        (acc, curr) => acc + Number(curr.valorPremio ?? curr.premio ?? 0),
        0
      );

      if (statsData) {
        setStats({
          totalClientes: statsData.totalClientes ?? (clientesData || []).length,
          apolicesAtivas: statsData.apolicesAtivas ?? ativas.length,
          totalCotacoes: statsData.cotacoesPendentes ?? (cotacoesData || []).length,
          alertasPendentes: statsData.apolicesProximasVencimento ?? (alertasData || []).filter((a) => !a.lido).length,
          receitaEstimada: statsData.faturamentoTotalEstimado ?? statsData.receitaEstimada ?? receita
        });
      } else {
        setStats({
          totalClientes: (clientesData || []).length,
          apolicesAtivas: ativas.length,
          totalCotacoes: (cotacoesData || []).length,
          alertasPendentes: (alertasData || []).filter((a) => !a.lido).length,
          receitaEstimada: receita
        });
      }

      // Vencimentos nos próximos 30 dias
      const today = new Date();
      const next30 = new Date();
      next30.setDate(today.getDate() + 30);

      const expiring = (apolicesData || [])
        .filter((a) => {
          if (!a.dataTermino) return false;
          const end = new Date(a.dataTermino);
          return end >= today && end <= next30;
        })
        .sort((a, b) => new Date(a.dataTermino) - new Date(b.dataTermino));
      setExpiringPolicies(expiring);

      setRecentQuotes((cotacoesData || []).slice(0, 5));
      setRecentAlerts((alertasData || []).slice(0, 4));
      setInsurances(segurosData || []);
    } catch (err) {
      console.error('Erro ao carregar dados do painel:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const end = new Date(dateStr);
    const today = new Date();
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const firstName = currentUser?.nome ? currentUser.nome.split(' ')[0] : 'Usuário';
  const isCorretor = currentRole === 'corretor';

  return (
    <div className="space-y-8 animate-rise">
      {/* Page Header */}
      <PageHeader
        eyebrow={isCorretor ? 'Minha carteira' : 'Visão geral da corretora'}
        title={`Olá, ${firstName}.`}
        description={
          expiringPolicies.length > 0
            ? `Você tem ${expiringPolicies.length} apólice(s) vencendo nos próximos 30 dias e ${recentQuotes.length} cotação(ões) recentes.`
            : 'Nenhuma apólice vencendo nos próximos 30 dias. Carteira em dia.'
        }
        actions={
          <>
            <button
              onClick={() => setActiveTab('cotacoes')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
            >
              <Plus className="size-4" />
              Nova cotação
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <Users className="size-4" />
              Cadastrar cliente
            </button>
          </>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clientes"
          value={stats.totalClientes}
          hint="cadastrados no PostgreSQL"
          icon={Users}
        />
        <StatCard
          label="Apólices ativas"
          value={stats.apolicesAtivas}
          hint="vigentes na corretora"
          icon={Shield}
        />
        <StatCard
          label="Prêmios sob gestão"
          value={formatCurrency(stats.receitaEstimada)}
          hint="soma dos prêmios anuais"
          icon={ArrowUpRight}
          tone="signal"
        />
        <StatCard
          label="Cotações em aberto"
          value={stats.totalCotacoes}
          hint={`${stats.alertasPendentes} alertas de vencimento`}
          icon={FileCheck}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna 1 & 2 - Vencimentos e Cotações */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card Vencimentos Próximos */}
          <SectionCard
            title="Vencimentos próximos (30 dias)"
            action={
              <button
                onClick={() => setActiveTab('alertas')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Ver alertas
                <ChevronRight className="size-3" />
              </button>
            }
          >
            {expiringPolicies.length === 0 ? (
              <EmptyState
                title="Nenhum vencimento próximo"
                text="Todas as apólices vigentes possuem prazo superior a 30 dias."
              />
            ) : (
              <div className="divide-y divide-border">
                {expiringPolicies.map((apolice) => {
                  const days = getDaysRemaining(apolice.dataTermino);
                  return (
                    <div
                      key={apolice.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-accent/30 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                          <Shield className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {apolice.clienteNome || `Cliente #${apolice.clienteId}`}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {apolice.numeroApolice}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {apolice.seguroNome || 'Seguro'} · Corretor: {apolice.corretorNome || 'HCR'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-sm tabular text-foreground">
                            {formatCurrency(apolice.valorPremio ?? apolice.premio)}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-warning">
                            <Clock className="size-3" />
                            {days !== null && days >= 0
                              ? `vence em ${days} dias`
                              : 'atenção imediata'}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab('apolices')}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Card Cotações Recentes */}
          <SectionCard
            title="Cotações recentes"
            action={
              <button
                onClick={() => setActiveTab('cotacoes')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Abrir cotações
                <ChevronRight className="size-3" />
              </button>
            }
          >
            {recentQuotes.length === 0 ? (
              <EmptyState
                title="Nenhuma cotação registrada"
                text="Clique no botão acima para registrar a primeira cotação."
              />
            ) : (
              <div className="divide-y divide-border">
                {recentQuotes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {c.clienteNome || `Cliente #${c.clienteId}`}
                        </span>
                        <StatusBadge status={c.situacao} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.seguroNome || 'Seguro'} · {c.dataCotacao || (c.dataSolicitacao ? c.dataSolicitacao.substring(0, 10) : '')}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('cotacoes')}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Acompanhar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Coluna 3 - Distribuição e Alertas Rápidos */}
        <div className="space-y-6">
          {/* Distribuição por Produto */}
          <SectionCard title="Catálogo de seguros">
            <div className="p-5 space-y-4">
              {insurances.map((seguro, idx) => {
                const colors = ['bg-primary', 'bg-signal', 'bg-warning', 'bg-success', 'bg-accent'];
                const barColor = colors[idx % colors.length];
                return (
                  <div key={seguro.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{seguro.nome}</span>
                      <span className="text-muted-foreground">
                        a partir de {formatCurrency(seguro.valorBase ?? seguro.premioBase)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.min(100, 30 + idx * 20)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Avisos Importantes */}
          <SectionCard
            title="Alertas do sistema"
            action={
              <button
                onClick={() => setActiveTab('alertas')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Ver todos
              </button>
            }
          >
            <div className="divide-y divide-border">
              {recentAlerts.map((alerta) => (
                <div key={alerta.id} className="p-4 space-y-1 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="size-3 text-warning" />
                      {alerta.titulo || 'Notificação'}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {alerta.dataCriacao ? alerta.dataCriacao.substring(0, 10) : 'Hoje'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alerta.mensagem || alerta.assunto}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
