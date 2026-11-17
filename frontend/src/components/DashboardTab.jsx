import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { PageHeader, StatCard, StatusBadge, SectionCard, EmptyState } from './ui/UiBits';
import { apiFetch } from '../api';
import { mapAlerta, mapApolice, mapCotacao, mapSeguro } from '../mappers';
import { pode } from '../permissoes';
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
      const [statsData, apolicesData, cotacoesData, alertasData, segurosData] = await Promise.all([
        // Totais da corretora são só da equipe; o cliente vê os números das próprias apólices
        pode(currentRole, 'verIndicadoresGerais') ? apiFetch('/dashboard/stats').catch(() => null) : null,
        apiFetch('/apolices').catch(() => []),
        apiFetch('/cotacoes').catch(() => []),
        apiFetch('/alertas').catch(() => []),
        apiFetch('/seguros').catch(() => [])
      ]).then(([stats, apolices, cotacoes, alertas, seguros]) => [
        stats,
        (apolices || []).map(mapApolice),
        (cotacoes || []).map((c) => mapCotacao(c)),
        (alertas || []).map(mapAlerta),
        (seguros || []).map(mapSeguro)
      ]);
      if (statsData) {
        setStats({
          totalClientes: statsData.totalClientes ?? 0,
          apolicesAtivas: statsData.apolicesAtivas ?? 0,
          totalCotacoes: statsData.cotacoesPendentes ?? (cotacoesData || []).length,
          alertasPendentes: statsData.apolicesProximasVencimento ?? (alertasData || []).length,
          receitaEstimada: statsData.faturamentoTotalEstimado ?? statsData.receitaEstimada ?? 0
        });
      } else {
        const ativas = (apolicesData || []).filter((a) => a.situacaoCodigo === 'ATIVA');
        const receita = ativas.reduce((acc, curr) => acc + (Number(curr.premio) || 0), 0);
        setStats({
          totalClientes: 0,
          apolicesAtivas: ativas.length,
          totalCotacoes: (cotacoesData || []).length,
          alertasPendentes: (alertasData || []).length,
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

  const firstName = currentUser?.nome ? currentUser.nome.split(' ')[0] : '';
  const isCliente = currentRole === 'cliente';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isCliente ? 'Minha área' : 'Painel'}
        description={
          expiringPolicies.length > 0
            ? `Olá, ${firstName}. ${expiringPolicies.length} apólice(s) vencem nos próximos 30 dias e há ${recentQuotes.length} cotação(ões) registradas.`
            : `Olá, ${firstName}. Nenhuma apólice vence nos próximos 30 dias.`
        }
        actions={
          <>
            <button
              onClick={() => setActiveTab('cotacoes')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
            >
              <Plus className="size-4" />
              {isCliente ? 'Solicitar cotação' : 'Nova cotação'}
            </button>
            {pode(currentRole, 'gerenciarClientes') && (
            <button
              onClick={() => setActiveTab('clientes')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <Users className="size-4" />
              Cadastrar cliente
            </button>
            )}
          </>
        }
      />

      {/* 4 Stat Cards */}
      {isCliente ? (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Apólices ativas" value={stats.apolicesAtivas} hint="seguros vigentes" icon={Shield} />
        <StatCard
          label="Prêmio anual"
          value={formatCurrency(stats.receitaEstimada)}
          hint="soma das suas apólices ativas"
          icon={ArrowUpRight}
          tone="destaque"
          onClick={() => setActiveTab('apolices')}
          actionLabel="Prêmio anual: ver minhas apólices"
        />
        <StatCard label="Cotações" value={stats.totalCotacoes} hint="solicitadas por você" icon={FileCheck} />
        <StatCard
          label="Vencimentos"
          value={expiringPolicies.length}
          hint="apólices vencendo em 30 dias"
          icon={Shield}
        />
      </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clientes"
          value={stats.totalClientes}
          hint="cadastrados na carteira"
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
          tone="destaque"
          onClick={() => setActiveTab('premios')}
          actionLabel="Prêmios sob gestão: ver detalhamento"
        />
        <StatCard
          label="Cotações em aberto"
          value={stats.totalCotacoes}
          hint={`${stats.alertasPendentes} apólice(s) vencendo em 30 dias`}
          icon={FileCheck}
        />
      </div>
      )}

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
                          <p className="font-semibold text-sm tabular-nums text-foreground">
                            {formatCurrency(apolice.premio)}
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
                        {c.seguroNome || 'Seguro'} · {c.dataCotacao}
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
          <SectionCard title="Distribuição por seguro">
            <div className="p-5 space-y-4">
              {insurances.map((seguro, idx) => {
                const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-muted-foreground'];
                const barColor = colors[idx % colors.length];
                return (
                  <div key={seguro.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{seguro.nome}</span>
                      <span className="text-muted-foreground">
                        a partir de {formatCurrency(seguro.premioBase)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.min(100, 20 + idx * 25)}%` }}
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
                      {alerta.titulo}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {alerta.dataCriacao ? alerta.dataCriacao.substring(0, 10) : 'Hoje'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alerta.mensagem}
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
