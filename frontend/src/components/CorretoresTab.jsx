import React, { useState, useEffect } from 'react';
import {
  Plus,
  Mail,
  Phone,
  Award,
  XCircle,
  Power
} from 'lucide-react';
import {
  PageHeader,
  StatusBadge,
  Modal,
  FieldError,
  FeedbackBanner,
  validateEmail,
  getErrorInputStyle
} from './ui/UiBits';
import { apiFetch } from '../api';

export const CorretoresTab = ({ currentUser, currentRole }) => {
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState(null);

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    registroSusep: '',
    especialidade: '',
    email: '',
    telefone: '',
    status: 'ATIVO'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalBannerError, setModalBannerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCorretores();
  }, []);

  const loadCorretores = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/corretores').catch(() => []);
      setCorretores(data || []);
    } catch (err) {
      console.error('Erro ao carregar corretores:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (current = form) => {
    const errors = {};
    if (!current.nome || current.nome.trim().length < 3) {
      errors.nome = 'Informe o nome completo do corretor.';
    }
    if (!current.registroSusep || current.registroSusep.trim().length < 4) {
      errors.registroSusep = 'Informe o código de registro SUSEP válido.';
    }
    const emailErr = validateEmail(current.email);
    if (emailErr) {
      errors.email = emailErr;
    }
    return errors;
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (fieldErrors[field]) {
      const errs = validateForm(updated);
      setFieldErrors((prev) => ({ ...prev, [field]: errs[field] || null }));
    }
  };

  const handleFieldBlur = (field) => {
    const errs = validateForm(form);
    if (errs[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalBannerError(null);

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setModalBannerError('Corrija os campos destacados em vermelho antes de salvar o corretor.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome: form.nome.trim(),
        dadosProfissionais: form.registroSusep.trim(),
        registroSusep: form.registroSusep.trim(),
        especialidade: form.especialidade.trim() || 'Geral',
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim(),
        status: form.status
      };

      const novo = await apiFetch('/corretores', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCorretores([...corretores, novo]);
      setIsNewModalOpen(false);
      setForm({
        nome: '',
        registroSusep: '',
        especialidade: '',
        email: '',
        telefone: '',
        status: 'ATIVO'
      });
      setFieldErrors({});
      setPageFeedback({
        type: 'success',
        message: `Corretor "${novo.nome}" cadastrado com sucesso!`
      });
    } catch (err) {
      setModalBannerError(err.message || 'Erro ao cadastrar corretor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (corretor) => {
    const isAtivo = String(corretor.status || 'ATIVO').toUpperCase() === 'ATIVO';
    const novoStatus = isAtivo ? 'INATIVO' : 'ATIVO';
    try {
      const atualizado = await apiFetch(`/corretores/${corretor.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus })
      });
      setCorretores((prev) =>
        prev.map((c) => (c.id === corretor.id ? { ...c, ...atualizado, status: novoStatus } : c))
      );
      setPageFeedback({
        type: 'success',
        message: `Corretor "${corretor.nome}" teve o status atualizado para ${novoStatus}.`
      });
    } catch (err) {
      setPageFeedback({
        type: 'error',
        message: err.message || 'Erro ao alterar status do corretor.'
      });
    }
  };

  const getInitials = (nome = '') => {
    return (
      nome
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'CR'
    );
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Equipe"
        title="Corretores"
        description="Profissionais vinculados à HCR, seus clientes atendidos e apólices sob responsabilidade."
        actions={
          <button
            onClick={() => {
              setFieldErrors({});
              setModalBannerError(null);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo corretor
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

      {/* Grid de Cards de Corretores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {corretores.map((c) => {
          const susep = c.registroSusep || c.dadosProfissionais || '—';
          const isAtivo = String(c.status || 'ATIVO').toUpperCase() === 'ATIVO';
          return (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground font-display font-bold text-sm shrink-0">
                    {getInitials(c.nome)}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                      {c.nome}
                    </h3>
                    <span className="text-[0.7rem] text-muted-foreground font-mono">
                      {susep}
                    </span>
                  </div>
                </div>
                <StatusBadge status={c.status || 'ATIVO'} />
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/60 py-3">
                <div className="flex items-center gap-2">
                  <Award className="size-3.5 text-primary" />
                  <span>
                    Especialidade: <strong className="text-foreground">{c.especialidade || 'Geral'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-primary" />
                  <span className="truncate">{c.email || '—'}</span>
                </div>
                {c.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-primary" />
                    <span>{c.telefone}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="block font-display font-semibold text-lg text-foreground tabular">
                    {c.totalClientes ?? 0}
                  </span>
                  <span className="text-[0.68rem] text-muted-foreground">
                    Clientes atendidos
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="block font-display font-semibold text-lg text-foreground tabular">
                    {c.totalApolices ?? 0}
                  </span>
                  <span className="text-[0.68rem] text-muted-foreground">
                    Apólices ativas
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(c)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Power className="size-3" />
                  <span>{isAtivo ? 'Desativar' : 'Ativar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Corretor */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Novo corretor"
        subtitle="Cadastre um corretor autorizado com registro SUSEP e e-mail (corporativo, Gmail, Hotmail, etc.)."
      >
        <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={modalBannerError}
            onClose={() => setModalBannerError(null)}
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.nome}
                onChange={(e) => handleFieldChange('nome', e.target.value)}
                onBlur={() => handleFieldBlur('nome')}
                placeholder="Nome completo do corretor"
                style={getErrorInputStyle(!!fieldErrors.nome)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
              />
              {fieldErrors.nome && (
                <XCircle
                  className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#dc2626' }}
                />
              )}
            </div>
            <FieldError error={fieldErrors.nome} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Registro SUSEP *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.registroSusep}
                  onChange={(e) => handleFieldChange('registroSusep', e.target.value)}
                  onBlur={() => handleFieldBlur('registroSusep')}
                  placeholder="SUSEP-000000-DF"
                  style={getErrorInputStyle(!!fieldErrors.registroSusep)}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
                />
                {fieldErrors.registroSusep && (
                  <XCircle
                    className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#dc2626' }}
                  />
                )}
              </div>
              <FieldError error={fieldErrors.registroSusep} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={form.especialidade}
                onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                placeholder="Automóvel, Vida, Empresarial..."
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                E-mail do Corretor *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="corretor@empresa.com.br ou @hotmail.com"
                  style={getErrorInputStyle(!!fieldErrors.email)}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
                />
                {fieldErrors.email && (
                  <XCircle
                    className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#dc2626' }}
                  />
                )}
              </div>
              <FieldError error={fieldErrors.email} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(61) 90000-0000"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Status Operacional
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="ATIVO">Ativo</option>
              <option value="FERIAS">Férias</option>
              <option value="INATIVO">Inativo</option>
            </select>
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
              {submitting ? 'Salvando...' : 'Salvar corretor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
