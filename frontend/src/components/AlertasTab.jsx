import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Shield,
  Info,
  Plus,
  XCircle
} from 'lucide-react';
import {
  PageHeader,
  SectionCard,
  EmptyState,
  Modal,
  FieldError,
  FeedbackBanner,
  getErrorInputStyle
} from './ui/UiBits';
import { apiFetch } from '../api';

export const AlertasTab = ({ setActiveTab, currentUser, currentRole }) => {
  const [alertas, setAlertas] = useState([]);
  const [apolices, setApolices] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState(null);

  // Modal Novo Alerta
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [form, setForm] = useState({
    assunto: '',
    usuarioId: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertasData, apolicesData, usuariosData] = await Promise.all([
        apiFetch('/alertas').catch(() => []),
        apiFetch('/apolices').catch(() => []),
        apiFetch('/usuarios').catch(() => [])
      ]);
      setAlertas(alertasData || []);
      setApolices(apolicesData || []);
      setUsuarios(usuariosData || []);
      if (usuariosData && usuariosData.length > 0) {
        setForm((prev) => ({
          ...prev,
          usuarioId: prev.usuarioId || currentUser?.id || usuariosData[0].id
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLido = async (id) => {
    try {
      await apiFetch(`/alertas/${id}/lido`, { method: 'PUT' });
      setAlertas(alertas.map((a) => (a.id === id ? { ...a, lido: true, status: 'LIDA' } : a)));
      setPageFeedback({
        type: 'success',
        message: `Alerta #${id} marcado como lido no banco de dados.`
      });
    } catch (err) {
      setPageFeedback({
        type: 'error',
        message: err.message || 'Erro ao marcar alerta como lido.'
      });
    }
  };

  const handleCreateAlerta = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.assunto || form.assunto.trim().length < 5) {
      setFormError('Informe a mensagem/assunto do alerta (mínimo de 5 caracteres).');
      return;
    }

    try {
      setSubmitting(true);
      const novo = await apiFetch('/alertas', {
        method: 'POST',
        body: JSON.stringify({
          assunto: form.assunto.trim(),
          usuarioId: form.usuarioId ? Number(form.usuarioId) : undefined
        })
      });

      setAlertas([novo, ...alertas]);
      setIsNewModalOpen(false);
      setForm((prev) => ({ ...prev, assunto: '' }));
      setPageFeedback({
        type: 'success',
        message: 'Novo alerta cadastrado com sucesso na tabela notificacao_alerta!'
      });
    } catch (err) {
      setFormError(err.message || 'Erro ao cadastrar notificação de alerta.');
    } finally {
      setSubmitting(false);
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
        actions={
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo alerta
          </button>
        }
      />

      {pageFeedback && (
        <FeedbackBanner
          type={pageFeedback.type}
          message={pageFeedback.message}
          onClose={() => setPageFeedback(null)}
        />
      )}

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
      <SectionCard title="Notificações e Avisos Registrados no Banco">
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
                        {alerta.titulo || 'Notificação'}
                      </h4>
                      {!alerta.lido && (
                        <span className="size-2 rounded-full bg-signal" title="Não lido" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alerta.mensagem || alerta.assunto}
                    </p>
                    <span className="text-[0.68rem] text-muted-foreground block mt-1">
                      Destinatário: {alerta.usuarioEmail || 'Sistema'} · Criado em:{' '}
                      {alerta.dataCriacao ? alerta.dataCriacao.replace('T', ' ').substring(0, 16) : 'Hoje'}
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

      {/* Modal Novo Alerta */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar novo alerta"
        subtitle="Cadastre uma notificação ou lembrete operacional diretamente no PostgreSQL."
      >
        <form onSubmit={handleCreateAlerta} noValidate className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Usuário Destinatário *
            </label>
            <select
              value={form.usuarioId}
              onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome || u.loginEmail} ({u.loginEmail})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Assunto / Mensagem do Alerta *
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={form.assunto}
                onChange={(e) => {
                  setForm({ ...form, assunto: e.target.value });
                  if (formError) setFormError(null);
                }}
                style={getErrorInputStyle(!!formError)}
                placeholder="Ex: Entrar em contato com cliente sobre renovação de apólice..."
                className="w-full rounded-md border border-input bg-card p-3 text-sm"
              />
              {formError && (
                <XCircle
                  className="size-4 absolute right-3 top-3"
                  style={{ color: '#dc2626' }}
                />
              )}
            </div>
            <FieldError error={formError} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar alerta'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
