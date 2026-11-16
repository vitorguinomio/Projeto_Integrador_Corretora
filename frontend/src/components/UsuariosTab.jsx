import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Power
} from 'lucide-react';
import {
  PageHeader,
  StatusBadge,
  SectionCard,
  Modal,
  FieldError,
  FeedbackBanner,
  validateEmail,
  getErrorInputStyle
} from './ui/UiBits';
import { apiFetch } from '../api';

export const UsuariosTab = ({ currentUser, currentRole }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('TODOS'); // 'TODOS' | 'ATIVOS' | 'INATIVOS'
  const [togglingId, setTogglingId] = useState(null);
  const [pageFeedback, setPageFeedback] = useState(null);

  // Modal Novo Usuário
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'CORRETOR'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalBannerError, setModalBannerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const isUserAtivo = (u) => {
    if (!u) return false;
    if (typeof u.status === 'string') {
      return u.status.toUpperCase() === 'ATIVO';
    }
    return Boolean(u.ativo);
  };

  const validateForm = (currentForm = form) => {
    const errors = {};
    if (!currentForm.nome || currentForm.nome.trim().length < 3) {
      errors.nome = 'Informe o nome completo (mínimo de 3 caracteres).';
    }
    const emailErr = validateEmail(currentForm.email);
    if (emailErr) {
      errors.email = emailErr;
    }
    if (!currentForm.senha || currentForm.senha.length < 6) {
      errors.senha = 'A senha deve conter no mínimo 6 caracteres.';
    }
    return errors;
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (fieldErrors[field]) {
      const newErrors = validateForm(updated);
      setFieldErrors((prev) => ({ ...prev, [field]: newErrors[field] || null }));
    }
  };

  const handleFieldBlur = (field) => {
    const newErrors = validateForm(form);
    if (newErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalBannerError(null);

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setModalBannerError('Corrija os campos em vermelho antes de criar o usuário.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome: form.nome.trim(),
        loginEmail: form.email.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        perfilAcesso: form.perfil,
        perfil: form.perfil,
        status: 'ATIVO'
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
      setFieldErrors({});
      setPageFeedback({
        type: 'success',
        message: `Usuário "${novo.nome || novo.loginEmail}" cadastrado e ativado com sucesso!`
      });
    } catch (err) {
      setModalBannerError(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAtivo = async (usuario) => {
    const ativoAtual = isUserAtivo(usuario);
    const novoAtivo = !ativoAtual;
    const novoStatus = novoAtivo ? 'ATIVO' : 'INATIVO';

    try {
      setTogglingId(usuario.id);
      setPageFeedback(null);

      const atualizado = await apiFetch(`/usuarios/${usuario.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: novoStatus,
          ativo: novoAtivo
        })
      });

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id
            ? {
                ...u,
                ...atualizado,
                status: novoStatus,
                ativo: novoAtivo
              }
            : u
        )
      );

      setPageFeedback({
        type: 'success',
        message: `Usuário "${usuario.nome || usuario.loginEmail}" foi ${novoAtivo ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`
      });
    } catch (err) {
      setPageFeedback({
        type: 'error',
        message: err.message || 'Não foi possível alterar o status do usuário.'
      });
    } finally {
      setTogglingId(null);
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

  const usuariosAtivosCount = usuarios.filter((u) => isUserAtivo(u)).length;
  const usuariosInativosCount = usuarios.filter((u) => !isUserAtivo(u)).length;

  const filteredUsuarios = usuarios.filter((u) => {
    if (statusFilter === 'ATIVOS') return isUserAtivo(u);
    if (statusFilter === 'INATIVOS') return !isUserAtivo(u);
    return true;
  });

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Segurança"
        title="Usuários e permissões"
        description="Controle quem acessa o sistema, ative ou desative contas de acesso e gerencie perfis."
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
            Novo usuário
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

      {/* Filtros Rápidos de Status */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('TODOS')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
            statusFilter === 'TODOS'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          Todos os usuários ({usuarios.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('ATIVOS')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
            statusFilter === 'ATIVOS'
              ? 'bg-success-soft text-success border-success'
              : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          Ativos ({usuariosAtivosCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('INATIVOS')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
            statusFilter === 'INATIVOS'
              ? 'bg-danger-soft text-danger border-danger'
              : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          Inativos ({usuariosInativosCount})
        </button>
      </div>

      {/* Tabela de Usuários */}
      <SectionCard title="Usuários Cadastrados">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">Usuário</th>
                <th className="px-5 py-3.5">E-mail de Acesso</th>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Status da Conta</th>
                <th className="px-5 py-3.5 text-right">Ativar / Desativar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsuarios.map((u) => {
                const rawPerfil = u.perfilAcesso || u.perfil || 'CLIENTE';
                const perfilDisplay =
                  rawPerfil === 'ADMINISTRADOR'
                    ? 'Administrador'
                    : rawPerfil === 'CORRETOR'
                    ? 'Corretor'
                    : 'Cliente';
                const ativo = isUserAtivo(u);
                const email = u.email || u.loginEmail || '';
                const isBusy = togglingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground text-sm">
                        {u.nome || email}
                      </p>
                      <span className="text-[0.7rem] text-muted-foreground">
                        ID #{u.id}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-foreground">
                      {email}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={perfilDisplay} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={ativo ? 'ATIVO' : 'INATIVO'} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleAtivo(u)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: ativo ? 'rgba(220, 38, 38, 0.1)' : '#16a34a',
                          color: ativo ? '#dc2626' : '#ffffff',
                          border: ativo ? '1px solid rgba(220, 38, 38, 0.35)' : '1px solid #16a34a'
                        }}
                        className="transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <Power className="size-3.5" />
                        <span>
                          {isBusy
                            ? 'Atualizando...'
                            : ativo
                            ? 'Desativar usuário'
                            : 'Ativar usuário'}
                        </span>
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
        subtitle="Crie um usuário com credenciais de acesso (aceita Gmail, Hotmail, Outlook ou e-mail corporativo)."
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
                placeholder="Informe o nome completo"
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

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              E-mail de Acesso *
            </label>
            <div className="relative">
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="ex: corretor@empresa.com.br, nome@gmail.com, nome@hotmail.com"
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
            <p className="text-[0.7rem] text-muted-foreground mt-1">
              Deve conter <strong>@</strong> e terminar com <strong>.com</strong> ou <strong>.com.br</strong> (qualquer provedor: empresa, Gmail, Hotmail, etc.).
            </p>
            <FieldError error={fieldErrors.email} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Senha de Acesso *
            </label>
            <div className="relative">
              <input
                type="password"
                value={form.senha}
                onChange={(e) => handleFieldChange('senha', e.target.value)}
                onBlur={() => handleFieldBlur('senha')}
                placeholder="Mínimo de 6 caracteres"
                style={getErrorInputStyle(!!fieldErrors.senha)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
              />
              {fieldErrors.senha && (
                <XCircle
                  className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#dc2626' }}
                />
              )}
            </div>
            <FieldError error={fieldErrors.senha} />
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
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
