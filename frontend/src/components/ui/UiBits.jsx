import React from 'react';
import { X } from 'lucide-react';

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
  'Ativo': 'bg-success-soft text-success border border-success/20',
  'Paga': 'bg-success-soft text-success border border-success/20',
  'Aceita': 'bg-success-soft text-success border border-success/20',
  'Concluída': 'bg-success-soft text-success border border-success/20',
  'Pendente': 'bg-warning-soft text-warning border border-warning/20',
  'Em análise': 'bg-warning-soft text-warning border border-warning/20',
  'Solicitada': 'bg-warning-soft text-warning border border-warning/20',
  'Em renovação': 'bg-signal-soft text-signal-foreground border border-signal/30',
  'Férias': 'bg-signal-soft text-signal-foreground border border-signal/30',
  'Cancelada': 'bg-danger-soft text-danger border border-danger/20',
  'Inativo': 'bg-danger-soft text-danger border border-danger/20',
  'Recusada': 'bg-danger-soft text-danger border border-danger/20',
  'Vencida': 'bg-danger-soft text-danger border border-danger/20',
  'Atrasada': 'bg-danger-soft text-danger border border-danger/20',
  'Administrador': 'bg-primary/10 text-primary border border-primary/20',
  'Corretor': 'bg-accent text-accent-foreground border border-border',
  'Cliente': 'bg-muted text-muted-foreground border border-border',
};

export const StatusBadge = ({ status, className = '' }) => {
  const variant = statusVariantMap[status] || 'bg-muted text-muted-foreground border border-border';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant} ${className}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
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

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-rise">
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-card`}>
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-display text-2xl font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};
