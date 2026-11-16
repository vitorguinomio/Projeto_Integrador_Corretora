import React, { useEffect } from 'react';
import { X, XCircle, CheckCircle2 } from 'lucide-react';

/**
 * Valida endereço de e-mail garantindo presença de '@', usuário antes do '@',
 * domínio válido (aceitando gmail, hotmail, outlook, yahoo ou domínio corporativo)
 * e terminação válida como .com ou .com.br.
 */
export const validateEmail = (email) => {
  if (!email || !String(email).trim()) {
    return 'O endereço de e-mail é obrigatório.';
  }
  const value = String(email).trim();
  if (value.includes(' ')) {
    return 'O e-mail não pode conter espaços em branco.';
  }
  if (!value.includes('@')) {
    return "O e-mail deve conter o símbolo '@' (ex: nome@empresa.com.br ou nome@gmail.com).";
  }
  const parts = value.split('@');
  if (parts.length !== 2 || !parts[0]) {
    return "Informe o nome do usuário antes do '@' (ex: corretor@empresa.com.br).";
  }
  const domain = parts[1];
  if (!domain || !domain.includes('.')) {
    return "Informe o domínio completo após o '@' terminando em .com ou .com.br (ex: @gmail.com, @hotmail.com, @empresa.com.br).";
  }
  const domainParts = domain.split('.');
  if (domainParts.some((p) => !p || p.length === 0)) {
    return 'Formato de domínio inválido no e-mail informado.';
  }
  const validEnding = /\.(com\.br|com|org\.br|net\.br|gov\.br|edu\.br|br|org|net)$/i.test(domain);
  if (!validEnding) {
    return "O e-mail deve terminar com '.com' ou '.com.br' (aceita Gmail, Hotmail, Outlook ou e-mail corporativo da empresa).";
  }
  return null;
};

export const getErrorInputStyle = (hasError) => {
  if (!hasError) return {};
  return {
    borderColor: '#dc2626',
    borderWidth: '2px',
    backgroundColor: 'rgba(254, 226, 226, 0.25)',
    color: '#991b1b'
  };
};

export const FieldError = ({ error }) => {
  if (!error) return null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        marginTop: '6px',
        padding: '6px 10px',
        borderRadius: '6px',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        border: '1px solid rgba(220, 38, 38, 0.35)',
        color: '#dc2626',
        fontSize: '0.75rem',
        lineHeight: '1.35',
        fontWeight: 600
      }}
    >
      <XCircle className="size-4 shrink-0" style={{ color: '#dc2626', marginTop: '1px' }} />
      <span>
        <strong>Erro:</strong> {error}
      </span>
    </div>
  );
};

export const FeedbackBanner = ({ type = 'error', message, title, onClose }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '8px',
        backgroundColor: isError ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)',
        border: isError ? '1.5px solid #dc2626' : '1.5px solid #16a34a',
        color: isError ? '#b91c1c' : '#15803d',
        fontSize: '0.82rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {isError ? (
          <XCircle className="size-4 shrink-0" style={{ color: '#dc2626', marginTop: '2px' }} />
        ) : (
          <CheckCircle2 className="size-4 shrink-0" style={{ color: '#16a34a', marginTop: '2px' }} />
        )}
        <div>
          <p style={{ fontWeight: 700, marginBottom: '2px' }}>
            {title || (isError ? 'Não foi possível concluir a operação' : 'Operação realizada com sucesso')}
          </p>
          <p style={{ fontWeight: 500 }}>
            {isError ? `Motivo: ${message}` : message}
          </p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          title="Fechar aviso"
          style={{
            padding: '2px',
            borderRadius: '4px',
            color: isError ? '#dc2626' : '#15803d',
            cursor: 'pointer'
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};

export const PageHeader = ({ eyebrow, title, description, actions }) => {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-rise">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-medium text-foreground md:text-4xl font-display">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

const statusVariantMap = {
  'Ativa': 'bg-success-soft text-success border border-success/20',
  'ATIVA': 'bg-success-soft text-success border border-success/20',
  'Ativo': 'bg-success-soft text-success border border-success/20',
  'ATIVO': 'bg-success-soft text-success border border-success/20',
  'Paga': 'bg-success-soft text-success border border-success/20',
  'PAGO': 'bg-success-soft text-success border border-success/20',
  'PAGA': 'bg-success-soft text-success border border-success/20',
  'Aceita': 'bg-success-soft text-success border border-success/20',
  'ACEITA': 'bg-success-soft text-success border border-success/20',
  'Aprovada': 'bg-success-soft text-success border border-success/20',
  'APROVADA': 'bg-success-soft text-success border border-success/20',
  'Concluída': 'bg-success-soft text-success border border-success/20',
  'Pendente': 'bg-warning-soft text-warning border border-warning/20',
  'PENDENTE': 'bg-warning-soft text-warning border border-warning/20',
  'Em análise': 'bg-warning-soft text-warning border border-warning/20',
  'EM_ANALISE': 'bg-warning-soft text-warning border border-warning/20',
  'PROPOSTA_GERADA': 'bg-warning-soft text-warning border border-warning/20',
  'Solicitada': 'bg-warning-soft text-warning border border-warning/20',
  'SOLICITADA': 'bg-warning-soft text-warning border border-warning/20',
  'Em renovação': 'bg-signal-soft text-signal-foreground border border-signal/30',
  'EM_RENOVACAO': 'bg-signal-soft text-signal-foreground border border-signal/30',
  'Férias': 'bg-signal-soft text-signal-foreground border border-signal/30',
  'FERIAS': 'bg-signal-soft text-signal-foreground border border-signal/30',
  'Cancelada': 'bg-danger-soft text-danger border border-danger/20',
  'CANCELADA': 'bg-danger-soft text-danger border border-danger/20',
  'Inativo': 'bg-danger-soft text-danger border border-danger/20',
  'INATIVO': 'bg-danger-soft text-danger border border-danger/20',
  'Recusada': 'bg-danger-soft text-danger border border-danger/20',
  'RECUSADA': 'bg-danger-soft text-danger border border-danger/20',
  'Vencida': 'bg-danger-soft text-danger border border-danger/20',
  'VENCIDA': 'bg-danger-soft text-danger border border-danger/20',
  'Atrasada': 'bg-danger-soft text-danger border border-danger/20',
  'ATRASADO': 'bg-danger-soft text-danger border border-danger/20',
  'ATRASADA': 'bg-danger-soft text-danger border border-danger/20',
  'Administrador': 'bg-primary/10 text-primary border border-primary/20',
  'ADMINISTRADOR': 'bg-primary/10 text-primary border border-primary/20',
  'Corretor': 'bg-accent text-accent-foreground border border-border',
  'CORRETOR': 'bg-accent text-accent-foreground border border-border',
  'Cliente': 'bg-muted text-muted-foreground border border-border',
  'CLIENTE': 'bg-muted text-muted-foreground border border-border',
};

const statusLabelMap = {
  'ATIVA': 'Ativa',
  'ATIVO': 'Ativo',
  'INATIVO': 'Inativo',
  'PAGO': 'Paga',
  'PAGA': 'Paga',
  'PENDENTE': 'Pendente',
  'ATRASADO': 'Atrasada',
  'ATRASADA': 'Atrasada',
  'EM_RENOVACAO': 'Em renovação',
  'CANCELADA': 'Cancelada',
  'VENCIDA': 'Vencida',
  'SOLICITADA': 'Solicitada',
  'PROPOSTA_GERADA': 'Proposta enviada',
  'EM_ANALISE': 'Em análise',
  'APROVADA': 'Aprovada',
  'ACEITA': 'Aceita',
  'RECUSADA': 'Recusada',
  'FERIAS': 'Férias',
  'ADMINISTRADOR': 'Administrador',
  'CORRETOR': 'Corretor',
  'CLIENTE': 'Cliente'
};

export const StatusBadge = ({ status, className = '' }) => {
  const raw = status || 'Pendente';
  const variant = statusVariantMap[raw] || 'bg-muted text-muted-foreground border border-border';
  const label = statusLabelMap[raw] || raw;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant} ${className}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};

export const StatCard = ({ label, value, hint, icon: Icon, tone = 'default' }) => {
  const isSignal = tone === 'signal';
  const isDanger = tone === 'danger';
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-card animate-rise ${
        isSignal
          ? 'border-transparent bg-gradient-ink text-ink-foreground'
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start justify-between">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            isSignal ? 'text-ink-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {label}
        </p>
        {Icon && (
          <Icon
            className={`size-4 ${
              isSignal
                ? 'text-signal'
                : isDanger
                ? 'text-danger'
                : 'text-primary'
            }`}
          />
        )}
      </div>
      <p className="mt-4 font-display text-4xl font-medium tabular leading-none">
        {value}
      </p>
      {hint && (
        <p
          className={`mt-2 text-xs ${
            isSignal ? 'text-ink-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export const SectionCard = ({ title, action, children, className = '' }) => {
  return (
    <section className={`rounded-xl border border-border bg-card shadow-card animate-rise overflow-hidden ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-card/50">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-foreground">
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
      <p className="font-display text-xl text-foreground">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const CodeText = ({ children, className = '' }) => {
  return (
    <span className={`font-mono text-[0.8rem] tracking-tight bg-muted/60 px-1.5 py-0.5 rounded text-foreground ${className}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => onClose && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        padding: '16px',
        overflowY: 'auto'
      }}
      className="backdrop-blur-sm animate-rise"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}
        className={`relative w-full ${maxWidth} rounded-xl border border-border bg-card shadow-card`}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0
          }}
        >
          <div>
            <h3 className="font-display text-2xl font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => onClose && onClose()}
            title="Fechar janela (ESC)"
            aria-label="Fechar modal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
            className="text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-semibold"
          >
            <X className="size-4" />
            <span>Fechar</span>
          </button>
        </div>
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
