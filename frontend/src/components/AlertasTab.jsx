import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Shield,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Info
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState } from './ui/UiBits';
import { apiFetch } from '../api';

export const AlertasTab = ({ setActiveTab, currentUser, currentRole }) => {
  const [alertas, setAlertas] = useState([]);
  const [apolices, setApolices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertasData, apolicesData] = await Promise.all([
        apiFetch('/alertas').catch(() => []),
        apiFetch('/apolices').catch(() => [])
      ]);
      setAlertas(alertasData || []);
      setApolices(apolicesData || []);
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLido = async (id) => {
    try {
      await apiFetch(`/alertas/${id}/lido`, { method: 'PUT' });
      setAlertas(alertas.map((a) => (a.id === id ? { ...a, lido: true } : a)));
    } catch (err) {
      console.error('Erro ao marcar lido:', err);
    }
  };

  const today = new Date();
  const next30 = new Date();
  next30.setDate(today.getDate() + 30);

  const expiringApolices = apolices.filter((a) => {
    if (!a.dataTermino) return false;
    const end = new Date(a.dataTermino);
    return end >= today && end <= next30;
  });

  const getDays = (dateStr) => {
    if (!dateStr) return 0;
    const end = new Date(dateStr);
    const diff = end - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Acompanhamento"
        title="Alertas"
        description="Apólices que terminam nos próximos 30 dias e avisos das atividades importantes da corretora."
      />

      {/* Seção 1: Vencimentos Próximos */}
      <SectionCard
        title={`Vencimentos próximos · ${expiringApolices.length} apólice(s)`}
        action={
          <span className="text-xs text-warning flex items-center gap-1 font-semibold">
            <Clock className="size-3.5" />
            Janela de 30 dias
          </span>
        }
      >
        {expiringApolices.length === 0 ? (
          <EmptyState
            title="Nenhum vencimento nos próximos 30 dias"
            text="Todas as apólices vigentes possuem prazo confortável."
          />
        ) : (
          <div className="divide-y divide-border">
            {expiringApolices.map((ap) => {
              const days = getDays(ap.dataTermino);
              return (
                <div
                  key={ap.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
                      <Shield className="size-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {ap.clienteNome || `Cliente #${ap.clienteId}`}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {ap.numeroApolice}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ap.seguroNome} · Vigência encerra em {ap.dataTermino}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-soft text-warning border border-warning/20">
                      <Clock className="size-3" />
                      vence em {days} dias
                    </span>
                    <button
                      onClick={() => setActiveTab('apolices')}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Renovar apólice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Seção 2: Avisos e Notificações do Sistema */}
      <SectionCard title="Notificações e Avisos">
        {alertas.length === 0 ? (
          <EmptyState
            title="Nenhum alerta registrado"
            text="Tudo em ordem. O sistema notificará automaticamente eventos relevantes."
          />
        ) : (
          <div className="divide-y divide-border">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  alerta.lido ? 'opacity-70 bg-card' : 'bg-accent/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                      alerta.tipo === 'VENCIMENTO'
                        ? 'bg-warning-soft text-warning'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {alerta.tipo === 'VENCIMENTO' ? (
                      <AlertTriangle className="size-4" />
                    ) : (
                      <Info className="size-4" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">
                        {alerta.titulo}
                      </h4>
                      {!alerta.lido && (
                        <span className="size-2 rounded-full bg-signal" title="Não lido" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alerta.mensagem}
                    </p>
                    <span className="text-[0.68rem] text-muted-foreground block mt-1">
                      Criado em: {alerta.dataCriacao ? alerta.dataCriacao.replace('T', ' ').substring(0, 16) : 'Hoje'}
                    </span>
                  </div>
                </div>

                {!alerta.lido && (
                  <button
                    onClick={() => handleMarcarLido(alerta.id)}
                    title="Marcar como lido"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium"
                  >
                    Marcar lido
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
