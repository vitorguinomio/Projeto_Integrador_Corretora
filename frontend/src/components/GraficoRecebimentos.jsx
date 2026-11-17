import React, { useMemo, useState } from 'react';

const moeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

// Séries na ordem de empilhamento (de baixo para cima). As cores são as de estado do sistema;
// "Em atraso" também leva hachura, para não depender só da cor (vermelho × verde para daltônicos).
const SERIES = [
  { chave: 'recebido', rotulo: 'Recebido', estilo: { background: 'var(--color-success)' } },
  {
    chave: 'atrasado',
    rotulo: 'Em atraso',
    estilo: {
      background:
        'repeating-linear-gradient(135deg, var(--color-danger) 0 3px, color-mix(in oklab, var(--color-danger) 55%, white) 3px 6px)'
    }
  },
  { chave: 'aReceber', rotulo: 'A receber', estilo: { background: 'var(--color-primary)' } }
];

const ALTURA = 200; // px da área de plotagem

/** Arredonda o topo da escala para um valor "redondo" (1, 2, 2,5 ou 5 × 10^n). */
const topoDaEscala = (maximo) => {
  if (maximo <= 0) return 100;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const passo = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= maximo);
  return passo * potencia;
};

/**
 * Valores de parcelas por mês de vencimento: recebido (pago), em atraso (vencido e não pago)
 * e a receber (a vencer). Janela de 12 meses: 2 meses antes do atual e 9 depois.
 * Recebe `parcelas` já no formato { valor, dataVencimento, status } e `hoje` em AAAA-MM-DD.
 */
export const GraficoRecebimentos = ({ parcelas, hoje }) => {
  const [ativo, setAtivo] = useState(null);
  const [verTabela, setVerTabela] = useState(false);

  const meses = useMemo(() => {
    const [ano, mes] = hoje.split('-').map(Number);
    const lista = [];
    for (let i = -2; i <= 9; i += 1) {
      const d = new Date(ano, mes - 1 + i, 1);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      lista.push({
        chave,
        atual: i === 0,
        rotulo: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        extenso: `${MESES_EXTENSO[d.getMonth()]} de ${d.getFullYear()}`,
        recebido: 0,
        atrasado: 0,
        aReceber: 0
      });
    }
    const porChave = Object.fromEntries(lista.map((m) => [m.chave, m]));
    parcelas.forEach((p) => {
      const m = porChave[p.dataVencimento?.substring(0, 7)];
      if (!m) return;
      const valor = Number(p.valor) || 0;
      if (p.status === 'PAGO') m.recebido += valor;
      else if (p.dataVencimento < hoje) m.atrasado += valor;
      else m.aReceber += valor;
    });
    return lista.map((m) => ({ ...m, total: m.recebido + m.atrasado + m.aReceber }));
  }, [parcelas, hoje]);

  const topo = topoDaEscala(Math.max(...meses.map((m) => m.total)));
  const marcas = [topo, topo / 2, 0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda">
          {SERIES.map((s) => (
            <li key={s.chave} className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={s.estilo} aria-hidden="true" />
              {s.rotulo}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setVerTabela((v) => !v)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {verTabela ? 'Ver como gráfico' : 'Ver como tabela'}
        </button>
      </div>

      {verTabela ? (
        <div className="overflow-x-auto px-5 pb-4 pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="py-2 pr-4">Mês</th>
                <th className="py-2 pr-4 text-right">Recebido</th>
                <th className="py-2 pr-4 text-right">Em atraso</th>
                <th className="py-2 pr-4 text-right">A receber</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {meses.map((m) => (
                <tr key={m.chave} className={m.atual ? 'font-medium' : ''}>
                  <td className="py-2 pr-4 text-foreground first-letter:uppercase">{m.extenso}</td>
                  <td className="py-2 pr-4 text-right">{moeda(m.recebido)}</td>
                  <td className="py-2 pr-4 text-right">{moeda(m.atrasado)}</td>
                  <td className="py-2 pr-4 text-right">{moeda(m.aReceber)}</td>
                  <td className="py-2 text-right text-foreground">{moeda(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3 px-5 pb-4 pt-5">
          {/* Eixo Y (único) */}
          <div className="relative w-14 shrink-0 text-right text-[0.7rem] tabular-nums text-muted-foreground" style={{ height: ALTURA }}>
            {marcas.map((v) => (
              <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - v / topo) * 100}%` }}>
                {moeda(v)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height: ALTURA }}>
              {/* Linhas de grade discretas */}
              {marcas.map((v) => (
                <div
                  key={v}
                  aria-hidden="true"
                  className={`absolute inset-x-0 border-t ${v === 0 ? 'border-foreground/25' : 'border-dashed border-border'}`}
                  style={{ top: `${(1 - v / topo) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex items-end gap-1">
                {meses.map((m, i) => (
                  <button
                    key={m.chave}
                    type="button"
                    onMouseEnter={() => setAtivo(i)}
                    onMouseLeave={() => setAtivo(null)}
                    onFocus={() => setAtivo(i)}
                    onBlur={() => setAtivo(null)}
                    aria-label={`${m.extenso}: recebido ${moeda(m.recebido)}, em atraso ${moeda(m.atrasado)}, a receber ${moeda(m.aReceber)}`}
                    className={`relative flex h-full flex-1 cursor-default items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      ativo === i ? 'bg-muted/70' : ''
                    }`}
                  >
                    {/* Pilha: recebido embaixo, atraso no meio, a receber em cima; 2px entre os segmentos */}
                    <span className="flex w-full max-w-7 flex-col-reverse gap-0.5">
                      {SERIES.map((s, idx) => {
                        const valor = m[s.chave];
                        if (!valor) return null;
                        const ehTopo = SERIES.slice(idx + 1).every((t) => !m[t.chave]);
                        return (
                          <span
                            key={s.chave}
                            className={`block w-full ${ehTopo ? 'rounded-t' : ''}`}
                            style={{ ...s.estilo, height: Math.max(2, (valor / topo) * ALTURA - 2) }}
                          />
                        );
                      })}
                    </span>

                    {ativo === i && (
                      <span
                        role="tooltip"
                        className={`pointer-events-none absolute top-2 z-10 w-48 rounded-md border border-border bg-card p-3 text-left text-xs shadow-xl ${
                          i < meses.length / 2 ? 'left-full ml-2' : 'right-full mr-2'
                        }`}
                      >
                        <span className="block font-medium text-foreground first-letter:uppercase">{m.extenso}</span>
                        {SERIES.map((s) => (
                          <span key={s.chave} className="mt-1.5 flex items-center justify-between gap-2 text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block size-2 rounded-sm" style={s.estilo} aria-hidden="true" />
                              {s.rotulo}
                            </span>
                            <span className="tabular-nums text-foreground">{moeda(m[s.chave])}</span>
                          </span>
                        ))}
                        <span className="mt-2 flex justify-between border-t border-border pt-1.5 font-medium text-foreground">
                          <span>Total</span>
                          <span className="tabular-nums">{moeda(m.total)}</span>
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Eixo X */}
            <div className="mt-2 flex gap-1">
              {meses.map((m, i) => (
                <span
                  key={m.chave}
                  // No celular, mostra um rótulo a cada 3 meses (e o mês atual) para não sobrepor
                  className={`flex-1 whitespace-nowrap text-center text-[0.7rem] ${
                    m.atual ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  } ${i % 3 !== 0 && !m.atual ? 'invisible sm:visible' : ''}`}
                >
                  {m.rotulo}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
