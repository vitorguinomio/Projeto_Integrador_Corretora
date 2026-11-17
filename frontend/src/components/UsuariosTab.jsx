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
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal, useFeedback } from './ui/UiBits';
import { apiFetch } from '../api';
import { mapUsuario } from '../mappers';
export const UsuariosTab = ({ currentUser, currentRole }) => {
  const { showSuccess, showError, showWarning, confirm } = useFeedback();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [form, setForm] = useState({
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
      setUsuarios((data || []).map(mapUsuario));
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.senha) {
      showWarning('Preencha os campos obrigatórios (*).', 'Campos obrigatórios');
      return;
    }
    try {
      // Formato de UsuarioCreateRequest (backend)
      const payload = {
        loginEmail: form.email,
        senha: form.senha,
        perfilAcesso: form.perfil,
        status: 'ATIVO'
      };
      const novo = await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setUsuarios([...usuarios, mapUsuario(novo)]);
      setIsNewModalOpen(false);
      setForm({
        email: '',
        senha: '',
        perfil: 'CORRETOR'
      });
      showSuccess('O usuário foi cadastrado com sucesso.', 'Usuário cadastrado!');
    } catch (err) {
      showError(err.message, 'Erro ao cadastrar usuário');
    }
  };
  const PERFIS = [
    { valor: 'ADMINISTRADOR', rotulo: 'Administrador' },
    { valor: 'CORRETOR', rotulo: 'Corretor' },
    { valor: 'CLIENTE', rotulo: 'Cliente' }
  ];
  const rotuloPerfil = (perfil) => PERFIS.find((p) => p.valor === perfil)?.rotulo || perfil;

  // Troca de perfil (RF28): passa a valer na hora, inclusive para quem já está logado
  const handleAlterarPerfil = async (usuario, novoPerfil) => {
    if (novoPerfil === usuario.perfil) return;
    const ok = await confirm({
      title: 'Alterar perfil de acesso?',
      message: `${usuario.email} passará de ${rotuloPerfil(usuario.perfil)} para ${rotuloPerfil(novoPerfil)} e verá apenas as telas desse perfil.`,
      confirmLabel: 'Alterar perfil'
    });
    if (!ok) return;
    try {
      const atualizado = await apiFetch(`/usuarios/${usuario.id}/perfil`, {
        method: 'PATCH',
        body: JSON.stringify({ perfil: novoPerfil })
      });
      setUsuarios(usuarios.map((u) => (u.id === usuario.id ? mapUsuario(atualizado) : u)));
      showSuccess(`${usuario.email} agora tem o perfil ${rotuloPerfil(novoPerfil)}.`, 'Perfil alterado');
    } catch (err) {
      showError(err.message, 'Erro ao alterar perfil');
    }
  };

  const handleToggleAtivo = async (usuario) => {
    try {
      const atualizado = await apiFetch(`/usuarios/${usuario.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: usuario.ativo ? 'INATIVO' : 'ATIVO' })
      });
      setUsuarios(usuarios.map((u) => (u.id === usuario.id ? mapUsuario(atualizado) : u)));
    } catch (err) {
      showError(err.message, 'Erro ao atualizar status');
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
    <div className="space-y-6 animate-fade-in">
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
              <tr className="border-b border-border bg-muted/60 text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3.5">Usuário</th>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Status</th>
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
                const ehVoce = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {u.nome}
                          {ehVoce && <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>}
                        </p>
                        <span className="text-xs text-muted-foreground font-mono">{u.email}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {ehVoce ? (
                        <StatusBadge status={perfilDisplay} />
                      ) : (
                        <select
                          value={u.perfil}
                          onChange={(e) => handleAlterarPerfil(u, e.target.value)}
                          aria-label={`Perfil de ${u.email}`}
                          className="h-8 rounded-md border border-input bg-card px-2 text-xs font-medium text-foreground"
                        >
                          {PERFIS.map((p) => (
                            <option key={p.valor} value={p.valor}>
                              {p.rotulo}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleAtivo(u)}
                        disabled={ehVoce}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors disabled:pointer-events-none ${
                          u.ativo
                            ? 'bg-success-soft text-success border border-success/30 hover:bg-danger-soft hover:text-danger'
                            : 'bg-muted text-muted-foreground border border-border hover:bg-success-soft hover:text-success'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {ehVoce ? (
                        <span className="text-xs text-muted-foreground">Sua conta</span>
                      ) : (
                        <button
                          onClick={() => handleToggleAtivo(u)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      )}
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
              <tr className="border-b border-border bg-muted/60 text-xs font-medium text-muted-foreground">
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
