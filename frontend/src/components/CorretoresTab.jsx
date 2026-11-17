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
  AlertCircle,
  Pencil,
  Power,
  Search,
  Trash2
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal, useFeedback } from './ui/UiBits';
import { apiFetch } from '../api';
import { codigoSituacao, mapApolice, mapCorretor } from '../mappers';

const TELEFONE_REGEX = /^\(\d{2}\) \d{5}-\d{4}$/;

// Mantém só dígitos (máx. 11) e aplica a máscara (xx) xxxxx-xxxx conforme o usuário digita
const formatTelefone = (value = '') => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const CorretoresTab =({ currentUser, currentRole }) => {
  const [corretores, setCorretores] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingCorretor, setEditingCorretor] = useState(null); // null = cadastro novo
  const { showSuccess, showError, showWarning, confirm } = useFeedback();
  const [form, setForm] = useState({
    nome: '',
    registroSusep: '',
    especialidade: 'Geral',
    email: '',
    telefone: '',
    status: 'ATIVO'
  });

  useEffect(() => {
    loadCorretores();
  }, []);

  const loadCorretores = async () => {
    try {
      setLoading(true);
      // Os contadores (clientes atendidos / apólices ativas) vêm das apólices de cada corretor
      const [data, apolicesData] = await Promise.all([
        apiFetch('/corretores').catch(() => []),
        apiFetch('/apolices').catch(() => [])
      ]);
      const apolices = (apolicesData || []).map(mapApolice);
      setCorretores((data || []).map((c) => mapCorretor(c, apolices)));
    } catch (err) {
      console.error('Erro ao carregar corretores:', err);
    } finally {
      setLoading(false);
    }
  };

  const FORM_VAZIO = {
    nome: '',
    registroSusep: '',
    especialidade: 'Geral',
    email: '',
    telefone: '',
    status: 'ATIVO'
  };

  const abrirCadastro = () => {
    setEditingCorretor(null);
    setForm(FORM_VAZIO);
    setIsNewModalOpen(true);
  };

  const abrirEdicao = (corretor) => {
    setEditingCorretor(corretor);
    setForm({
      nome: corretor.nome || '',
      registroSusep: corretor.dadosProfissionais || '',
      especialidade: corretor.especialidade || 'Geral',
      email: corretor.email || '',
      telefone: corretor.telefone || '',
      status: codigoSituacao(corretor.status) || 'ATIVO'
    });
    setIsNewModalOpen(true);
  };

  // Mantém os contadores (calculados a partir das apólices) ao trocar o registro na lista
  const substituirNaLista = (atualizado) =>
    setCorretores((lista) =>
      lista.map((c) =>
        c.id === atualizado.id
          ? { ...mapCorretor(atualizado), totalClientes: c.totalClientes, totalApolices: c.totalApolices }
          : c
      )
    );

  const handleToggleStatus = async (corretor) => {
    const ativo = codigoSituacao(corretor.status) === 'ATIVO';
    if (ativo) {
      const confirmado = await confirm({
        title: 'Desativar corretor?',
        message: `${corretor.nome} deixará de acessar o sistema até ser reativado. As apólices e clientes dele não são alterados.`,
        confirmLabel: 'Desativar'
      });
      if (!confirmado) return;
    }
    try {
      const atualizado = await apiFetch(`/corretores/${corretor.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: ativo ? 'INATIVO' : 'ATIVO' })
      });
      substituirNaLista(atualizado);
      showSuccess(
        ativo ? `${corretor.nome} foi desativado e não consegue mais entrar no sistema.` : `${corretor.nome} foi reativado.`,
        ativo ? 'Corretor desativado' : 'Corretor reativado'
      );
    } catch (err) {
      showError(err.message, 'Erro ao alterar status');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.registroSusep || !form.email) {
      showWarning('Preencha os campos obrigatórios (*).', 'Campos obrigatórios');
      return;
    }
    if (form.telefone && !TELEFONE_REGEX.test(form.telefone)) {
      showWarning('Informe o telefone completo com DDD no formato (xx) xxxxx-xxxx.', 'Telefone incompleto');
      return;
    }
    try {
      const payload = {
        nome: form.nome,
        // O backend (CorretorRequest) espera o registro SUSEP no campo "dadosProfissionais"
        dadosProfissionais: form.registroSusep,
        especialidade: form.especialidade,
        email: form.email,
        telefone: form.telefone,
        status: form.status
      };

      const salvo = await apiFetch(editingCorretor ? `/corretores/${editingCorretor.id}` : '/corretores', {
        method: editingCorretor ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });

      if (editingCorretor) {
        substituirNaLista(salvo);
      } else {
        setCorretores([...corretores, mapCorretor(salvo)]);
      }
      setIsNewModalOpen(false);
      setForm(FORM_VAZIO);
      showSuccess(
        editingCorretor
          ? `Os dados de ${salvo?.nome || 'o corretor'} foram atualizados.`
          : `${salvo?.nome || 'O corretor'} foi cadastrado com sucesso.`,
        editingCorretor ? 'Corretor atualizado!' : 'Corretor cadastrado!'
      );
      setEditingCorretor(null);
    } catch (err) {
      showError(err.message, editingCorretor ? 'Erro ao atualizar corretor' : 'Erro ao cadastrar corretor');
    }
  };

  const handleDelete = async (corretor) => {
    const confirmado = await confirm({
      title: 'Excluir corretor?',
      message: `Excluir o corretor ${corretor.nome}? O acesso dele ao sistema também será removido.`,
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!confirmado) {
      return;
    }
    try {
      await apiFetch(`/corretores/${corretor.id}`, { method: 'DELETE' });
      setCorretores(corretores.filter((c) => c.id !== corretor.id));
      showSuccess(`${corretor.nome} foi removido da equipe.`, 'Corretor excluído');
    } catch (err) {
      showError(err.message, 'Erro ao excluir corretor');
    }
  };

  const termo = busca.trim().toLowerCase();
  const corretoresFiltrados = !termo
    ? corretores
    : corretores.filter((c) =>
        [c.nome, c.dadosProfissionais, c.email, c.especialidade, c.telefone]
          .filter(Boolean)
          .some((texto) => texto.toLowerCase().includes(termo))
      );

  const getInitials = (nome = '') => {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'CR';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        eyebrow="Equipe"
        title="Corretores"
        description="Profissionais vinculados à HCR, seus clientes atendidos e apólices sob responsabilidade."
        actions={
          <button
            onClick={abrirCadastro}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo corretor
          </button>
        }
      />

      {/* Busca (RF25) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquise por nome, SUSEP, e-mail, especialidade ou telefone…"
          aria-label="Pesquisar corretores"
          className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
        />
      </div>

      {corretoresFiltrados.length === 0 && !loading && (
        <SectionCard>
          <EmptyState title="Nenhum corretor encontrado" text="Tente outro termo de busca." />
        </SectionCard>
      )}

      {/* Grid de Cards de Corretores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {corretoresFiltrados.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-sm shrink-0">
                  {getInitials(c.nome)}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground text-sm leading-tight">
                    {c.nome}
                  </h3>
                  <span className="text-[0.7rem] text-muted-foreground font-mono">
                    {c.dadosProfissionais}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status || 'ATIVO'} />
                <button
                  type="button"
                  onClick={() => abrirEdicao(c)}
                  title="Editar corretor"
                  aria-label={`Editar corretor ${c.nome}`}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(c)}
                  title={codigoSituacao(c.status) === 'ATIVO' ? 'Desativar corretor' : 'Reativar corretor'}
                  aria-label={`${codigoSituacao(c.status) === 'ATIVO' ? 'Desativar' : 'Reativar'} corretor ${c.nome}`}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Power className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  title="Excluir corretor"
                  aria-label={`Excluir corretor ${c.nome}`}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
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
                <span className="block font-semibold text-lg text-foreground tabular-nums">
                  {c.totalClientes || 0}
                </span>
                <span className="text-[0.68rem] text-muted-foreground">
                  Clientes atendidos
                </span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <span className="block font-semibold text-lg text-foreground tabular-nums">
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
        title={editingCorretor ? 'Editar corretor' : 'Novo corretor'}
        subtitle={
          editingCorretor
            ? `Altere os dados profissionais e de contato de ${editingCorretor.nome}.`
            : 'Cadastre um corretor autorizado com registro SUSEP e dados de contato.'
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Telefone
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={15}
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: formatTelefone(e.target.value) })}
                placeholder="(61) 98765-4321"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              {editingCorretor ? 'Salvar alterações' : 'Salvar corretor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
