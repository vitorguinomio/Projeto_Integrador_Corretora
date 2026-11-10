import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  ShieldAlert,
  Database,
  User,
  Globe,
  Clock,
  Filter
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, CodeText } from './ui/UiBits';
import { apiFetch } from '../api';

export default function AuditoriaTab({ currentUser, currentRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabelaFilter, setTabelaFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, [tabelaFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const url = tabelaFilter ? `/auditoria?tabela=${tabelaFilter}` : '/auditoria';
      const data = await apiFetch(url).catch(() => []);
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAcaoBadge = (acao = '') => {
    switch (acao.toUpperCase()) {
      case 'CREATE':
      case 'CRIAR':
      case 'INSERCAO':
        return 'bg-success-soft text-success border border-success/30';
      case 'UPDATE':
      case 'ATUALIZAR':
      case 'RENOVAR':
      case 'PAGAR':
        return 'bg-signal-soft text-signal-foreground border border-signal/30';
      case 'DELETE':
      case 'EXCLUIR':
      case 'CANCELAR':
        return 'bg-danger-soft text-danger border border-danger/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    const email = log.usuarioEmail || '';
    const tabela = log.nomeTabela || log.tabelaAfetada || '';
    const acao = log.acao || log.acaoRealizada || '';
    const ip = log.ipOrigem || '';
    const detalhes = log.detalhes || '';
    return (
      email.toLowerCase().includes(term) ||
      tabela.toLowerCase().includes(term) ||
      acao.toLowerCase().includes(term) ||
      ip.includes(term) ||
      detalhes.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Segurança"
        title="Auditoria"
        description="Cada cadastro, alteração e exclusão fica registrado com usuário, data e origem."
      />

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por usuário, ação, tabela ou IP..."
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <select
          value={tabelaFilter}
          onChange={(e) => setTabelaFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todas as tabelas</option>
          <option value="apolice">apolice</option>
          <option value="cliente">cliente</option>
          <option value="cotacao">cotacao</option>
          <option value="proposta">proposta</option>
          <option value="usuario">usuario</option>
          <option value="corretor">corretor</option>
          <option value="seguro">seguro</option>
        </select>
      </div>

      {/* Tabela de Logs */}
      <SectionCard title="Trilha de Auditoria (Audit Trail)">
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="Nenhum registro de auditoria"
            text="Nenhuma ação correspondente aos filtros foi encontrada."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Data e hora</th>
                  <th className="px-5 py-3.5">Ação</th>
                  <th className="px-5 py-3.5">Tabela</th>
                  <th className="px-5 py-3.5">Usuário</th>
                  <th className="px-5 py-3.5">IP de origem</th>
                  <th className="px-5 py-3.5">Detalhes da Operação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs">
                {filteredLogs.map((log) => {
                  const acaoText = log.acao || log.acaoRealizada || 'OPERACAO';
                  const tabText = log.nomeTabela || log.tabelaAfetada || 'sistema';
                  return (
                    <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                        {log.dataHora ? log.dataHora.replace('T', ' ').substring(0, 19) : '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.7rem] font-bold ${getAcaoBadge(acaoText)}`}>
                          {acaoText}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {tabText}
                      </td>

                      <td className="px-5 py-3.5 text-foreground">
                        {log.usuarioEmail || 'sistema@hcr.com'}
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground">
                        {log.ipOrigem || '127.0.0.1'}
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground font-sans text-xs max-w-xs truncate" title={log.detalhes}>
                        {log.detalhes || `Registro ID #${log.registroId || log.id}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
