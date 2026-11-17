import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle, Trash2 } from 'lucide-react';

export const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

const statusVariantMap = {
  'Ativa': 'bg-success-soft text-success',
  'Ativo': 'bg-success-soft text-success',
  'Paga': 'bg-success-soft text-success',
  'Aceita': 'bg-success-soft text-success',
  'Concluída': 'bg-success-soft text-success',
  'Aprovada': 'bg-success-soft text-success',
  'Lida': 'bg-muted text-muted-foreground',
  'Proposta gerada': 'bg-accent text-accent-foreground',
  'Pendente': 'bg-warning-soft text-warning',
  'Em análise': 'bg-warning-soft text-warning',
  'Solicitada': 'bg-warning-soft text-warning',
  'Em renovação': 'bg-warning-soft text-warning',
  'Férias': 'bg-warning-soft text-warning',
  'Cancelada': 'bg-danger-soft text-danger',
  'Inativo': 'bg-danger-soft text-danger',
  'Recusada': 'bg-danger-soft text-danger',
  'Vencida': 'bg-danger-soft text-danger',
  'Atrasada': 'bg-danger-soft text-danger',
  'Administrador': 'bg-accent text-accent-foreground',
  'Corretor': 'bg-muted text-foreground',
  'Cliente': 'bg-muted text-muted-foreground',
};

// Normaliza para comparar "ATIVO", "Ativo", "FERIAS" e "Férias" como o mesmo status
const normalizeStatusKey = (value = '') =>
  String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

const statusLabelByKey = Object.keys(statusVariantMap).reduce((acc, label) => {
  acc[normalizeStatusKey(label)] = label;
  return acc;
}, {});

export const StatusBadge = ({ status, className = '' }) => {
  // O backend grava status em maiúsculo (ex.: ATIVO); exibe o rótulo amigável (ex.: Ativo)
  const label = statusVariantMap[status] ? status : statusLabelByKey[normalizeStatusKey(status)] || status;
  const variant = statusVariantMap[label] || 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${variant} ${className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export const StatCard = ({ label, value, hint, icon: Icon, tone = 'default', onClick, actionLabel }) => {
  const iconTone =
    tone === 'danger'
      ? 'bg-danger-soft text-danger'
      : tone === 'destaque'
      ? 'bg-primary text-primary-foreground'
      : 'bg-accent text-accent-foreground';

  const conteudo = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ${iconTone}`}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const base = 'rounded-lg border border-border bg-card p-5 shadow-xs';

  // Com onClick, o card inteiro vira um botão que leva à tela de detalhe
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel || `${label}: ver detalhes`}
        className={`${base} w-full text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
      >
        {conteudo}
      </button>
    );
  }

  return <div className={base}>{conteudo}</div>;
};

export const SectionCard = ({ title, action, children, className = '' }) => {
  return (
    <section className={`overflow-hidden rounded-lg border border-border bg-card shadow-xs ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
};

export const EmptyState = ({ title, text, action }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const CodeText = ({ children, className = '' }) => {
  return (
    <span className={`font-mono text-[0.78rem] bg-muted px-1.5 py-0.5 rounded text-foreground ${className}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) => {
  if (!isOpen) return null;
  // Portal no <body>: o modal cobre a tela inteira, independente de onde é usado
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-xl`}>
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------
 * Pop-up de feedback (substitui alert() e confirm() do navegador)
 * Uso:
 *   const { showSuccess, showError, showWarning, showInfo, confirm } = useFeedback();
 *   showSuccess('Mensagem', 'Título opcional');
 *   if (await confirm({ title, message, confirmLabel, danger: true })) { ... }
 * ------------------------------------------------------------------ */
const FeedbackContext = createContext(null);

const feedbackStyles = {
  success: { icon: CheckCircle2, color: 'var(--color-success)', soft: 'var(--color-success-soft)', defaultTitle: 'Tudo certo!' },
  error: { icon: AlertCircle, color: 'var(--color-danger)', soft: 'var(--color-danger-soft)', defaultTitle: 'Algo deu errado' },
  warning: { icon: AlertTriangle, color: 'var(--color-warning)', soft: 'var(--color-warning-soft)', defaultTitle: 'Atenção' },
  info: { icon: Info, color: 'var(--color-primary)', soft: 'var(--color-accent)', defaultTitle: 'Informação' },
  confirm: { icon: HelpCircle, color: 'var(--color-primary)', soft: 'var(--color-accent)', defaultTitle: 'Confirmar ação' },
  confirmDanger: { icon: Trash2, color: 'var(--color-danger)', soft: 'var(--color-danger-soft)', defaultTitle: 'Confirmar exclusão' },
};

const AUTO_CLOSE_MS = 3500;

const primaryButtonClass =
  'inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors';
const secondaryButtonClass =
  'inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors';

export const FeedbackProvider = ({ children }) => {
  const [feedback, setFeedback] = useState(null);
  const resolverRef = useRef(null);

  // Fecha o pop-up; se for uma confirmação pendente, responde com o resultado
  const close = useCallback((result = false) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setFeedback(null);
  }, []);

  const open = useCallback((data) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setFeedback(data);
  }, []);

  const showSuccess = useCallback((message, title) => open({ type: 'success', message, title }), [open]);
  const showError = useCallback((message, title) => open({ type: 'error', message, title }), [open]);
  const showWarning = useCallback((message, title) => open({ type: 'warning', message, title }), [open]);
  const showInfo = useCallback((message, title) => open({ type: 'info', message, title }), [open]);

  const confirm = useCallback(
    ({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false } = {}) =>
      new Promise((resolve) => {
        open({ type: danger ? 'confirmDanger' : 'confirm', isConfirm: true, title, message, confirmLabel, cancelLabel, danger });
        resolverRef.current = resolve;
      }),
    [open]
  );

  useEffect(() => {
    if (!feedback) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    // Mensagens de sucesso fecham sozinhas; as demais esperam o usuário
    const timer = feedback.type === 'success' ? setTimeout(() => close(true), AUTO_CLOSE_MS) : null;
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timer) clearTimeout(timer);
    };
  }, [feedback, close]);

  const style = feedback ? feedbackStyles[feedback.type] : null;
  const Icon = style?.icon;

  return (
    <FeedbackContext.Provider value={{ showSuccess, showError, showWarning, showInfo, confirm }}>
      {children}
      {feedback && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 60, background: 'rgb(0 0 0 / 0.4)' }}
          onClick={() => close(false)}
        >
          <div
            role={feedback.isConfirm || feedback.type === 'error' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="feedback-title"
            aria-describedby="feedback-message"
            className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl text-center animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="mx-auto inline-flex size-12 items-center justify-center rounded-full"
              style={{ background: style.soft, color: style.color }}
            >
              <Icon style={{ width: 24, height: 24 }} />
            </span>
            <h3 id="feedback-title" className="mt-4 text-lg font-semibold text-foreground">
              {feedback.title || style.defaultTitle}
            </h3>
            {feedback.message && (
              <p
                id="feedback-message"
                className="mt-2 text-sm text-muted-foreground"
                style={{ whiteSpace: 'pre-line' }}
              >
                {feedback.message}
              </p>
            )}

            {feedback.isConfirm ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* Em ações destrutivas o foco inicial fica no Cancelar, para Enter não excluir por engano */}
                <button
                  type="button"
                  autoFocus={feedback.danger}
                  onClick={() => close(false)}
                  className={secondaryButtonClass}
                >
                  {feedback.cancelLabel}
                </button>
                <button
                  type="button"
                  autoFocus={!feedback.danger}
                  onClick={() => close(true)}
                  className={primaryButtonClass}
                  style={feedback.danger ? { background: 'var(--color-danger)', color: '#fff' } : undefined}
                >
                  {feedback.confirmLabel}
                </button>
              </div>
            ) : (
              <button type="button" autoFocus onClick={() => close(true)} className={`mt-6 ${primaryButtonClass}`}>
                OK
              </button>
            )}

            {feedback.type === 'success' && (
              <div
                aria-hidden="true"
                style={{
                  marginTop: '1rem',
                  height: '3px',
                  borderRadius: '999px',
                  background: style.color,
                  opacity: 0.6,
                  transformOrigin: 'left',
                  animation: `feedback-countdown ${AUTO_CLOSE_MS}ms linear forwards`,
                }}
              />
            )}
            <style>{'@keyframes feedback-countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }'}</style>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback precisa estar dentro de <FeedbackProvider>.');
  }
  return ctx;
};
