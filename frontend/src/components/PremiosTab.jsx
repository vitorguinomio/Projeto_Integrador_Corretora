import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, AlertTriangle, CalendarClock, Percent, Bell, Check } from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, CodeText, useFeedback } from './ui/UiBits';
import { GraficoRecebimentos } from './GraficoRecebimentos';
import { apiFetch } from '../api';
import { dataLocalISO, formatarData, mapApolice, mapSeguro } from '../mappers';

const moeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);

const moedaCentavos = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const percentual = (valor) => `${Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

const somar = (lista, campo) => lista.reduce((acc, item) => acc + (Number(item[campo]) || 0), 0);

// Agrupa as apólices por um campo (seguro, corretor) somando prêmio e comissão
const agruparPremios = (apolices, campo) => {
  const grupos = new Map();
  apolices.forEach((a) => {
    const chave = a[campo] || 'Não informado';
    const atual = grupos.get(chave) || { nome: chave, total: 0, comissao: 0, quantidade: 0, pct: a.pctComissao };
    atual.total += Number(a.premio) || 0;
    atual.comissao += a.comissao;
    atual.quantidade += 1;
    grupos.set(chave, atual);
  });
  return [...grupos.values()].sort((x, y) => y.total - x.total);
};

const BarraComposicao = ({ itens, total, mostrarPercentualComissao }) => (
  <ul className="divide-y divide-border">
    {itens.map((item) => {
      const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
      return (
        <li key={item.nome} className="px-5 py-3.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">{item.nome}</span>
            <span className="shrink-0 tabular-nums font-semibold text-foreground">{moeda(item.total)}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {item.quantidade} {item.quantidade === 1 ? 'apólice' : 'apólices'} · {pct}% da carteira · comissão{' '}
            {mostrarPercentualComissao ? `${percentual(item.pct)} = ` : ''}
            {moeda(item.comissao)}
          </p>
        </li>
      );
    })}
  </ul>
);

export const PremiosTab = ({ setActiveTab }) => {
  const { showSuccess, showError, confirm } = useFeedback();
  const [apolices, setApolices] = useState([]);
  const [comissaoPorSeguro, setComissaoPorSeguro] = useState({});
  const [usuarioPorCliente, setUsuarioPorCliente] = useState({});
  const [notificadas, setNotificadas] = useState(() => new Set());
  const [emAndamento, setEmAndamento] = useState(null); // id da parcela com ação em curso
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const [apolicesData, segurosData, clientesData] = await Promise.all([
          apiFetch('/apolices'),
          apiFetch('/seguros').catch(() => []),
          apiFetch('/clientes').catch(() => [])
        ]);
        setApolices((apolicesData || []).map(mapApolice));
        setComissaoPorSeguro(
          Object.fromEntries((segurosData || []).map(mapSeguro).map((s) => [s.id, s.percentualComissao]))
        );
        // Usuário de acesso de cada cliente: é para ele que vai o aviso de cobrança
        setUsuarioPorCliente(Object.fromEntries((clientesData || []).map((c) => [c.id, c.usuarioId])));
      } catch (err) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const hoje = dataLocalISO();

  // Mesmo critério do Painel e do backend (DashboardService): só apólices ATIVA compõem a carteira
  const resumo = useMemo(() => {
    const ativas = apolices
      .filter((a) => a.situacaoCodigo === 'ATIVA')
      .map((a) => {
        const pctComissao = comissaoPorSeguro[a.seguroId] || 0;
        return { ...a, pctComissao, comissao: ((Number(a.premio) || 0) * pctComissao) / 100 };
      })
      .sort((x, y) => (Number(y.premio) || 0) - (Number(x.premio) || 0));

    const parcelas = ativas.flatMap((a) => (a.parcelas || []).map((p) => ({ ...p, apolice: a })));
    const pagas = parcelas.filter((p) => p.status === 'PAGO');
    const pendentes = parcelas.filter((p) => p.status !== 'PAGO');
    const atrasadas = pendentes.filter((p) => p.dataVencimento < hoje);

    // Vencidas primeiro (cobrança urgente), depois as próximas a vencer
    const pendentesOrdenadas = [...pendentes]
      .sort((x, y) => x.dataVencimento.localeCompare(y.dataVencimento))
      .map((p) => ({ ...p, vencida: p.dataVencimento < hoje }));

    const totalPremios = somar(ativas, 'premio');
    const totalComissao = somar(ativas, 'comissao');

    return {
      ativas,
      parcelas,
      totalPremios,
      totalComissao,
      pctMedioComissao: totalPremios > 0 ? (totalComissao / totalPremios) * 100 : 0,
      comissaoRecebida: pagas.reduce((acc, p) => acc + ((Number(p.valor) || 0) * p.apolice.pctComissao) / 100, 0),
      recebido: somar(pagas, 'valor'),
      aReceber: somar(pendentes, 'valor'),
      atrasado: somar(atrasadas, 'valor'),
      qtdAtrasadas: atrasadas.length,
      qtdPendentes: pendentes.length,
      qtdPagas: pagas.length,
      pendentesLista: pendentesOrdenadas.slice(0, 4),
      pendentesRestantes: Math.max(0, pendentesOrdenadas.length - 4),
      porSeguro: agruparPremios(ativas, 'seguroNome'),
      porCorretor: agruparPremios(ativas, 'corretorNome')
    };
  }, [apolices, comissaoPorSeguro, hoje]);

  const percentualRecebido =
    resumo.recebido + resumo.aReceber > 0
      ? Math.round((resumo.recebido / (resumo.recebido + resumo.aReceber)) * 100)
      : 0;

  const descricaoParcela = (p) =>
    `parcela ${p.numeroParcela} de ${p.apolice.parcelas.length} da apólice ${p.apolice.numeroApolice}`;

  // Baixa da parcela: mesma rota usada na tela de Apólices
  const registrarPagamento = async (p) => {
    const ok = await confirm({
      title: 'Registrar pagamento?',
      message: `${p.apolice.clienteNome} — ${descricaoParcela(p)}, de ${moedaCentavos(p.valor)}, com vencimento em ${formatarData(p.dataVencimento)}.`,
      confirmLabel: 'Registrar pagamento'
    });
    if (!ok) return;
    try {
      setEmAndamento(p.id);
      await apiFetch(`/apolices/parcelas/${p.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'PAGO' }) });
      setApolices((lista) =>
        lista.map((a) =>
          a.id !== p.apolice.id
            ? a
            : { ...a, parcelas: a.parcelas.map((x) => (x.id === p.id ? { ...x, status: 'PAGO', situacao: 'Paga' } : x)) }
        )
      );
      showSuccess(`Pagamento de ${moedaCentavos(p.valor)} registrado para ${p.apolice.clienteNome}.`, 'Pagamento registrado!');
    } catch (err) {
      showError(err.message, 'Erro ao registrar pagamento');
    } finally {
      setEmAndamento(null);
    }
  };

  // Aviso de cobrança: vira uma notificação na tela de Alertas do cliente
  const notificarCliente = async (p) => {
    const usuarioId = usuarioPorCliente[p.apolice.clienteId];
    if (!usuarioId) return;
    try {
      setEmAndamento(p.id);
      await apiFetch('/alertas', {
        method: 'POST',
        body: JSON.stringify({
          usuarioId,
          assunto: `Parcela em atraso. A ${descricaoParcela(p)} (${moedaCentavos(p.valor)}) venceu em ${formatarData(
            p.dataVencimento
          )}. Regularize o pagamento para manter a cobertura.`
        })
      });
      setNotificadas((atual) => new Set(atual).add(p.id));
      showSuccess(`${p.apolice.clienteNome} vai ver o aviso na tela de Alertas.`, 'Cliente notificado');
    } catch (err) {
      showError(err.message, 'Erro ao notificar cliente');
    } finally {
      setEmAndamento(null);
    }
  };

  const botaoAcao =
    'inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Prêmios sob gestão"
        description="Soma dos prêmios anuais das apólices ativas, a comissão da corretora e a situação do recebimento das parcelas."
        actions={
          <button
            type="button"
            onClick={() => setActiveTab('apolices')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
          >
            Ver todas as apólices
          </button>
        }
      />

      {erro && (
        <div role="alert" className="rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          Não foi possível carregar as apólices: {erro}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Prêmios anuais"
          value={moeda(resumo.totalPremios)}
          hint={`${resumo.ativas.length} apólice(s) ativa(s)`}
          icon={ArrowUpRight}
          tone="destaque"
        />
        <StatCard
          label="Comissão"
          value={moeda(resumo.totalComissao)}
          hint={`estimada · ${percentual(resumo.pctMedioComissao.toFixed(1))} em média`}
          icon={Percent}
        />
        <StatCard
          label="Recebido"
          value={moeda(resumo.recebido)}
          hint={`${resumo.qtdPagas} parcela(s) paga(s) · ${percentualRecebido}% do total`}
          icon={CheckCircle2}
        />
        <StatCard
          label="A receber"
          value={moeda(resumo.aReceber)}
          hint={`${resumo.qtdPendentes} parcela(s) em aberto`}
          icon={Clock}
        />
        <StatCard
          label="Em atraso"
          value={moeda(resumo.atrasado)}
          hint={resumo.qtdAtrasadas > 0 ? `${resumo.qtdAtrasadas} parcela(s) vencida(s)` : 'Nenhuma parcela vencida'}
          icon={AlertTriangle}
          tone={resumo.qtdAtrasadas > 0 ? 'danger' : 'default'}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : resumo.ativas.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="Nenhuma apólice ativa"
            text="Os prêmios aparecem aqui assim que houver apólices vigentes registradas."
          />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard title="Recebimentos por mês" className="lg:col-span-2">
              <GraficoRecebimentos parcelas={resumo.parcelas} hoje={hoje} />
              <p className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
                Parcelas das apólices ativas agrupadas pelo mês de vencimento.
              </p>
            </SectionCard>

            <SectionCard title="Recebimentos pendentes">
              {resumo.pendentesLista.length === 0 ? (
                <EmptyState title="Nada a receber" text="Todas as parcelas das apólices ativas estão pagas." />
              ) : (
                <>
                  <ul className="divide-y divide-border">
                    {resumo.pendentesLista.map((p) => {
                      const notificada = notificadas.has(p.id);
                      const temAcesso = Boolean(usuarioPorCliente[p.apolice.clienteId]);
                      return (
                        <li key={p.id} className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ${
                                p.vencida ? 'bg-danger-soft text-danger' : 'bg-accent text-accent-foreground'
                              }`}
                            >
                              {p.vencida ? <AlertTriangle className="size-4" /> : <CalendarClock className="size-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{p.apolice.clienteNome}</p>
                              <p className={`text-xs ${p.vencida ? 'text-danger' : 'text-muted-foreground'}`}>
                                {p.vencida ? 'Venceu em ' : ''}
                                {formatarData(p.dataVencimento)} · parcela {p.numeroParcela} de {p.apolice.parcelas.length}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                              {moedaCentavos(p.valor)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap justify-end gap-2">
                            {p.vencida && (
                              <button
                                type="button"
                                onClick={() => notificarCliente(p)}
                                disabled={notificada || !temAcesso || emAndamento === p.id}
                                title={temAcesso ? 'Enviar aviso de cobrança ao cliente' : 'Cliente sem acesso ao sistema'}
                                className={botaoAcao}
                              >
                                {notificada ? <Check className="size-3.5 text-success" /> : <Bell className="size-3.5" />}
                                {notificada ? 'Notificado' : 'Notificar cliente'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => registrarPagamento(p)}
                              disabled={emAndamento === p.id}
                              className={botaoAcao}
                            >
                              <CheckCircle2 className="size-3.5 text-success" />
                              Registrar pagamento
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {resumo.pendentesRestantes > 0 && (
                    <p className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
                      + {resumo.pendentesRestantes} parcela(s) a vencer depois destas.
                    </p>
                  )}
                </>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Por seguro">
              <BarraComposicao itens={resumo.porSeguro} total={resumo.totalPremios} mostrarPercentualComissao />
            </SectionCard>
            <SectionCard title="Por corretor">
              <BarraComposicao itens={resumo.porCorretor} total={resumo.totalPremios} />
            </SectionCard>
          </div>

          <SectionCard title={`Apólices ativas (${resumo.ativas.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-5 py-3">Apólice</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Corretor</th>
                    <th className="px-5 py-3">Vigência até</th>
                    <th className="px-5 py-3 text-right">Prêmio anual</th>
                    <th className="px-5 py-3 text-right">Comissão</th>
                    <th className="px-5 py-3">Recebimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resumo.ativas.map((a) => {
                    const total = a.parcelas?.length || 0;
                    const pagas = (a.parcelas || []).filter((p) => p.status === 'PAGO').length;
                    const pct = total > 0 ? Math.round((pagas / total) * 100) : 0;
                    return (
                      <tr key={a.id}>
                        <td className="px-5 py-3.5">
                          <CodeText>{a.numeroApolice}</CodeText>
                          <p className="mt-1 text-xs text-muted-foreground">{a.seguroNome}</p>
                        </td>
                        <td className="px-5 py-3.5 text-foreground">{a.clienteNome}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{a.corretorNome}</td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{formatarData(a.dataTermino)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">
                          {moedaCentavos(a.premio)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          <span className="font-medium text-foreground">{moedaCentavos(a.comissao)}</span>
                          <p className="text-xs text-muted-foreground">{percentual(a.pctComissao)}</p>
                        </td>
                        <td className="min-w-44 px-5 py-3.5">
                          <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                            <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {pagas} de {total} parcelas pagas
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};
