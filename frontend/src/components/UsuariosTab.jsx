import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Shield,
  Key,
  Mail,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal } from './ui/UiBits';
import { apiFetch } from '../api';

export const UsuariosTab = ({ currentUser, currentRole }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'CORRETOR'
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/usuarios').catch(() => []);
      setUsuarios(data || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) {
      alert('Preencha os campos obrigatórios (*).');
      return;
    }
    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        perfil: form.perfil
      };

      const novo = await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setUsuarios([...usuarios, novo]);
      setIsNewModalOpen(false);
      setForm({
        nome: '',
        email: '',
        senha: '',
        perfil: 'CORRETOR'
      });
      alert('Usuário cadastrado com sucesso!');
    } catch (err) {
      alert(`Erro ao cadastrar usuário: ${err.message}`);
    }
  };

  const handleToggleAtivo = async (usuario) => {
    try {
      const novoStatus = !usuario.ativo;
      await apiFetch(`/usuarios/${usuario.id}/status?ativo=${novoStatus}`, {
        method: 'PUT'
      });
      setUsuarios(
        usuarios.map((u) => (u.id === usuario.id ? { ...u, ativo: novoStatus } : u))
      );
    } catch (err) {
      alert(`Erro ao atualizar status: ${err.message}`);
    }
  };

  const permissions = [
    { module: 'Painel e Indicadores Gerais', admin: true, corretor: true, cliente: true },
    { module: 'Cadastro e Edição de Clientes', admin: true, corretor: true, cliente: false },
    { module: 'Emissão e Renovação de Apólices', admin: true, corretor: true, cliente: false },
    { module: 'Elaboração e Envio de Propostas', admin: true, corretor: true, cliente: false },
    { module: 'Aceite de Proposta pelo Cliente', admin: true, corretor: false, cliente: true },
    { module: 'Visualização de Parcelas e Pagamentos', admin: true, corretor: true, cliente: true },
    { module: 'Configuração de Produtos e Coberturas', admin: true, corretor: false, cliente: false },
    { module: 'Gestão de Usuários e Permissões', admin: true, corretor: false, cliente: false },
    { module: 'Relatórios Gerenciais e Auditoria', admin: true, corretor: false, cliente: false }
  ];

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Segurança"
        title="Usuários e permissões"
        description="Controle quem acessa o sistema. Cada perfil enxerga apenas as funções permitidas."
        actions={
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo usuário
          </button>
        }
      />

      {/* Tabela de Usuários */}
      <SectionCard title="Usuários Cadastrados">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">Usuário</th>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Data de Criação</th>
                <th className="px-5 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {usuarios.map((u) => {
                const perfilDisplay =
                  u.perfil === 'ADMINISTRADOR'
                    ? 'Administrador'
                    : u.perfil === 'CORRETOR'
                    ? 'Corretor'
                    : 'Cliente';
                return (
                  <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{u.nome}</p>
                        <span className="text-xs text-muted-foreground font-mono">{u.email}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={perfilDisplay} />
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleAtivo(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          u.ativo
                            ? 'bg-success-soft text-success border border-success/30 hover:bg-danger-soft hover:text-danger'
                            : 'bg-muted text-muted-foreground border border-border hover:bg-success-soft hover:text-success'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {u.dataCriacao ? u.dataCriacao.substring(0, 10) : '—'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleToggleAtivo(u)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {u.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Matriz de Permissões */}
      <SectionCard title="Matriz de Permissões por Perfil">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">Funcionalidade</th>
                <th className="px-5 py-3.5 text-center">Administrador</th>
                <th className="px-5 py-3.5 text-center">Corretor</th>
                <th className="px-5 py-3.5 text-center">Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-accent/20">
                  <td className="px-5 py-3 font-medium text-foreground">{p.module}</td>
                  <td className="px-5 py-3 text-center">
                    {p.admin ? (
                      <Check className="size-4 text-success mx-auto" />
                    ) : (
                      <X className="size-4 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {p.corretor ? (
                      <Check className="size-4 text-success mx-auto" />
                    ) : (
                      <X className="size-4 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {p.cliente ? (
                      <Check className="size-4 text-success mx-auto" />
                    ) : (
                      <X className="size-4 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Modal Novo Usuário */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Novo usuário"
        subtitle="Crie um usuário com credenciais de acesso e perfil de segurança."
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
              placeholder="Ex: Amanda Nogueira"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              E-mail de Acesso *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@hcrseguros.com.br"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Senha Provisória *
            </label>
            <input
              type="password"
              required
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Perfil de Acesso
            </label>
            <select
              value={form.perfil}
              onChange={(e) => setForm({ ...form, perfil: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="ADMINISTRADOR">Administrador (Acesso total)</option>
              <option value="CORRETOR">Corretor (Operação e Vendas)</option>
              <option value="CLIENTE">Cliente (Portal do Segurado)</option>
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
              Criar usuário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
