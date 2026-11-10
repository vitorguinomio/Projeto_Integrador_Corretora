import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Mail,
  Phone,
  Shield,
  Users,
  Award,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal } from './ui/UiBits';
import { apiFetch } from '../api';

export const CorretoresTab = ({ currentUser, currentRole }) => {
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    registroSusep: '',
    especialidade: 'Geral',
    email: '',
    telefone: '',
    status: 'Ativo'
  });

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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.registroSusep || !form.email) {
      alert('Preencha os campos obrigatórios (*).');
      return;
    }
    try {
      const payload = {
        nome: form.nome,
        registroSusep: form.registroSusep,
        especialidade: form.especialidade,
        email: form.email,
        telefone: form.telefone,
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
        especialidade: 'Geral',
        email: '',
        telefone: '',
        status: 'Ativo'
      });
      alert('Corretor cadastrado com sucesso!');
    } catch (err) {
      alert(`Erro ao cadastrar corretor: ${err.message}`);
    }
  };

  const getInitials = (nome = '') => {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'CR';
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
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo corretor
          </button>
        }
      />

      {/* Grid de Cards de Corretores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {corretores.map((c) => (
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
                    SUSEP {c.registroSusep}
                  </span>
                </div>
              </div>
              <StatusBadge status={c.status || 'Ativo'} />
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/60 py-3">
              <div className="flex items-center gap-2">
                <Award className="size-3.5 text-primary" />
                <span>Especialidade: <strong className="text-foreground">{c.especialidade || 'Geral'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-primary" />
                <span className="truncate">{c.email}</span>
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
                  {c.totalClientes || 0}
                </span>
                <span className="text-[0.68rem] text-muted-foreground">
                  Clientes atendidos
                </span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <span className="block font-display font-semibold text-lg text-foreground tabular">
                  {c.totalApolices || 0}
                </span>
                <span className="text-[0.68rem] text-muted-foreground">
                  Apólices ativas
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Corretor */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Novo corretor"
        subtitle="Cadastre um corretor autorizado com registro SUSEP e dados de contato."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Rafael Guimarães"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Registro SUSEP *
              </label>
              <input
                type="text"
                required
                value={form.registroSusep}
                onChange={(e) => setForm({ ...form, registroSusep: e.target.value })}
                placeholder="Ex: 2024.998877"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={form.especialidade}
                onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                placeholder="Ex: Automóvel e Frotas"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="corretor@hcrseguros.com.br"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(61) 98765-4321"
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
              <option value="Ativo">Ativo</option>
              <option value="Férias">Férias</option>
              <option value="Inativo">Inativo</option>
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
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Salvar corretor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
