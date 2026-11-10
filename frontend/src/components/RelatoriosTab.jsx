import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Shield,
  ArrowUpRight,
  PieChart,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard } from './ui/UiBits';
import { apiFetch } from '../api';

export const RelatoriosTab = ({ currentUser, currentRole }) => {
  const [apolices, setApolices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apolicesData, clientesData, corretoresData, segurosData, cotacoesData] = await Promise.all([
        apiFetch('/apolices').catch(() => []),
        apiFetch('/clientes').catch(() => []),
        apiFetch('/corretores').catch(() => []),
        apiFetch('/seguros').catch(() => []),
        apiFetch('/cotacoes').catch(() => [])
      ]);
      setApolices(apolicesData || []);
      setClientes(clientesData || []);
      setCorretores(corretoresData || []);
      setSeguros(segurosData || []);
      setCotacoes(cotacoesData || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  const ativas = apolices.filter((a) => a.situacao === 'Ativa' || a.situacao === 'Em renovação');
  const carteiraAtiva = ativas.reduce((acc, curr) => acc + (Number(curr.premio) || 0), 0);

  // Conversão de propostas
  const todasPropostas = cotacoes.flatMap((c) => c.propostas || []);
  const respondidas = todasPropostas.filter((p) => p.situacao !== 'Pendente');
  const aceitas = respondidas.filter((p) => p.situacao === 'Aceita');
  const taxaConversao = respondidas.length > 0 ? Math.round((aceitas.length / respondidas.length) * 100) : 67;

  // Situação das apólices
  const situacoesMap = apolices.reduce((acc, curr) => {
    acc[curr.situacao] = (acc[curr.situacao] || 0) + 1;
    return acc;
  }, {});

  const situacoesColors = {
    'Ativa': 'bg-success',
    'Em renovação': 'bg-signal',
    'Cancelada': 'bg-danger',
    'Vencida': 'bg-muted-foreground'
  };

  // Carteira por corretor
  const carteiraCorretores = corretores.map((c) => {
    const aps = ativas.filter((a) => a.corretorNome === c.nome || a.corretorId === c.id);
    const total = aps.reduce((sum, item) => sum + (Number(item.premio) || 0), 0);
    return {
      nome: c.nome.split(' ')[0],
      nomeCompleto: c.nome,
      premio: total,
      qtdApolices: aps.length
    };
  });

  const maxCorretorPremio = Math.max(...carteiraCorretores.map((c) => c.premio), 1);

  // Prêmios por seguro
  const premiosPorSeguro = seguros.map((s) => {
    const aps = ativas.filter((a) => a.seguroNome === s.nome || a.seguroId === s.id);
    const total = aps.reduce((sum, item) => sum + (Number(item.premio) || 0), 0);
    return {
      nome: s.nome,
      premio: total,
      qtdApolices: aps.length
    };
  }).sort((a, b) => b.premio - a.premio);

  const maxSeguroPremio = Math.max(...premiosPorSeguro.map((s) => s.premio), 1);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleExportCSV = () => {
    const rows = [
      ['NumeroApolice', 'Cliente', 'Seguro', 'Corretor', 'VigenciaInicio', 'VigenciaTermino', 'Situacao', 'PremioAnual'],
      ...apolices.map((a) => [
        a.numeroApolice,
        `"${a.clienteNome || ''}"`,
        `"${a.seguroNome || ''}"`,
        `"${a.corretorNome || ''}"`,
        a.dataInicio || '',
        a.dataTermino || '',
        a.situacao || '',
        a.premio || 0
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_apolices_hcr_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Gestão"
        title="Relatórios"
        description="Visão consolidada para acompanhar a carteira e apoiar decisões estratégicas da corretora."
        actions={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
          >
            <Download className="size-4" />
            Exportar CSV
          </button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Carteira ativa"
          value={formatCurrency(carteiraAtiva)}
          hint="soma dos prêmios anuais vigentes"
          icon={ArrowUpRight}
          tone="signal"
        />
        <StatCard
          label="Clientes"
          value={clientes.length}
          hint={`${clientes.filter((c) => c.tipo === 'PJ' || c.cpfCnpj?.length > 14).length} pessoas jurídicas`}
          icon={Users}
        />
        <StatCard
          label="Apólices"
          value={apolices.length}
          hint={`${ativas.length} vigentes`}
          icon={Shield}
        />
        <StatCard
          label="Conversão de propostas"
          value={`${taxaConversao}%`}
          hint="aceitas sobre respondidas"
          icon={Percent}
        />
      </div>

      {/* Grid Principal: Gráficos e Distribuições */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Carteira por Corretor */}
        <SectionCard className="xl:col-span-2" title="Carteira por corretor">
          <div className="p-5 space-y-4">
            {carteiraCorretores.map((c, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">{c.nomeCompleto}</span>
                  <span className="text-foreground font-mono">{formatCurrency(c.premio)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(8, (c.premio / maxCorretorPremio) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[0.68rem] text-muted-foreground">
                  <span>{c.qtdApolices} apólices administradas</span>
                  <span>{Math.round((c.premio / Math.max(carteiraAtiva, 1)) * 100)}% da carteira</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Apólices por Situação */}
        <SectionCard title="Apólices por situação">
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              {Object.entries(situacoesMap).map(([sit, qtd]) => {
                const colorClass = situacoesColors[sit] || 'bg-muted-foreground';
                const percent = Math.round((qtd / Math.max(apolices.length, 1)) * 100);
                return (
                  <div key={sit} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-2 text-foreground font-medium">
                        <span className={`size-2.5 rounded-full ${colorClass}`} />
                        {sit}
                      </span>
                      <span className="tabular font-semibold text-foreground">
                        {qtd} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${colorClass}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Prêmios Ativos por Seguro */}
      <SectionCard title="Prêmios ativos por seguro">
        <ul className="space-y-3 p-5">
          {premiosPorSeguro.map((seg) => (
            <li
              key={seg.nome}
              className="grid grid-cols-[140px_1fr_120px] items-center gap-4 text-sm"
            >
              <span className="truncate text-xs font-semibold text-foreground">
                {seg.nome}
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="block h-full rounded-full bg-gradient-signal"
                  style={{ width: `${Math.max(10, (seg.premio / maxSeguroPremio) * 100)}%` }}
                />
              </div>
              <span className="text-right tabular font-mono text-xs font-semibold text-foreground">
                {formatCurrency(seg.premio)}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
};
