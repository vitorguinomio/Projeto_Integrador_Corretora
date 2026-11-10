import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Shield,
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal, CodeText } from './ui/UiBits';
import { apiFetch } from '../api';

export const ClientesTab = ({ currentUser, currentRole }) => {
  const [clientes, setClientes] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [selectedCorretorId, setSelectedCorretorId] = useState('');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedClienteHistory, setSelectedClienteHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form de novo cliente
  const [form, setForm] = useState({
    nome: '',
    cpfCnpj: '',
    tipo: 'PF',
    email: '',
    telefone: '',
    tipoTelefone: 'CELULAR',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: 'DF',
    cep: '',
    dataNasc: '1990-01-01',
    corretorId: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientesData, corretoresData] = await Promise.all([
        apiFetch('/clientes').catch(() => []),
        apiFetch('/corretores').catch(() => [])
      ]);
      setClientes(clientesData || []);
      setCorretores(corretoresData || []);
      if (corretoresData && corretoresData.length > 0) {
        setForm((prev) => ({ ...prev, corretorId: corretoresData[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (cliente) => {
    try {
      setHistoryLoading(true);
      setSelectedClienteHistory(cliente);
      const fullHistory = await apiFetch(`/clientes/${cliente.id}/historico`).catch(() => null);
      if (fullHistory) {
        setSelectedClienteHistory(fullHistory);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Deseja realmente excluir o cliente "${nome}"? Esta ação removerá registros vinculados se permitido.`)) {
      return;
    }
    try {
      await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
      setClientes(clientes.filter((c) => c.id !== id));
      alert('Cliente excluído com sucesso.');
    } catch (err) {
      alert(`Não foi possível excluir o cliente: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.nome || !form.cpfCnpj || !form.email) {
      setFormError('Por favor preencha nome, CPF/CNPJ e e-mail.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome: form.nome,
        cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
        tipo: form.tipo,
        email: form.email,
        dataNasc: form.dataNasc || '1990-01-01',
        corretorId: form.corretorId ? Number(form.corretorId) : null,
        telefones: form.telefone
          ? [{ numero: form.telefone, tipo: form.tipoTelefone }]
          : [],
        enderecos: form.logradouro
          ? [
              {
                logradouro: form.logradouro,
                numero: form.numero,
                bairro: form.bairro,
                cidade: form.cidade || 'Brasília',
                estado: form.uf || 'DF',
                cep: form.cep || '70000-000'
              }
            ]
          : []
      };

      const novo = await apiFetch('/clientes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setClientes([novo, ...clientes]);
      setIsNewModalOpen(false);
      setForm({
        nome: '',
        cpfCnpj: '',
        tipo: 'PF',
        email: '',
        telefone: '',
        tipoTelefone: 'CELULAR',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: 'DF',
        cep: '',
        corretorId: corretores[0]?.id || ''
      });
      alert('Cliente cadastrado com sucesso!');
    } catch (err) {
      setFormError(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const matchesSearch =
      (c.nome && c.nome.toLowerCase().includes(search.toLowerCase())) ||
      (c.cpfCnpj && c.cpfCnpj.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.id && String(c.id).includes(search));

    const matchesTipo =
      tipoFilter === 'TODOS' ||
      (tipoFilter === 'PF' && (c.tipo === 'PF' || c.cpfCnpj?.length <= 14)) ||
      (tipoFilter === 'PJ' && (c.tipo === 'PJ' || c.cpfCnpj?.length > 14));

    const matchesCorretor =
      !selectedCorretorId || String(c.corretorId) === String(selectedCorretorId);

    return matchesSearch && matchesTipo && matchesCorretor;
  });

  const getInitials = (nome) => {
    if (!nome) return 'CL';
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatCpfCnpj = (val) => {
    if (!val) return '—';
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return val;
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        description="Pesquise por nome, CPF/CNPJ, e-mail ou código. Clique em um cliente para ver o histórico completo."
        actions={
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Cadastrar cliente
          </button>
        }
      />

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por nome, CPF/CNPJ, e-mail ou código..."
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="TODOS">Todos os tipos</option>
          <option value="PF">Pessoa física</option>
          <option value="PJ">Pessoa jurídica</option>
        </select>

        <select
          value={selectedCorretorId}
          onChange={(e) => setSelectedCorretorId(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todos os corretores</option>
          {corretores.map((corretor) => (
            <option key={corretor.id} value={corretor.id}>
              {corretor.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Clientes */}
      <SectionCard>
        {filteredClientes.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            text="Tente ajustar a busca ou os filtros aplicados."
            action={
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                <Plus className="size-4" />
                Cadastrar novo cliente
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">CPF / CNPJ</th>
                  <th className="px-5 py-3.5">Contato</th>
                  <th className="px-5 py-3.5">Corretor</th>
                  <th className="px-5 py-3.5 text-center">Apólices</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredClientes.map((cliente) => {
                  const isPj = cliente.tipo === 'PJ' || cliente.cpfCnpj?.length > 14;
                  return (
                    <tr
                      key={cliente.id}
                      className="hover:bg-accent/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenHistory(cliente)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground shrink-0">
                            {getInitials(cliente.nome)}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {cliente.nome}
                            </p>
                            <span className="text-[0.7rem] text-muted-foreground flex items-center gap-1">
                              {isPj ? <Building className="size-3" /> : <User className="size-3" />}
                              Código #{cliente.id} · {isPj ? 'Pessoa Jurídica' : 'Pessoa Física'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        {formatCpfCnpj(cliente.cpfCnpj)}
                      </td>

                      <td className="px-5 py-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3 text-primary" />
                          <span className="truncate max-w-[180px]">{cliente.email}</span>
                        </div>
                        {cliente.telefones && cliente.telefones.length > 0 && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3 text-primary" />
                            <span>{cliente.telefones[0].numero}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-foreground">
                        {cliente.corretorNome || 'HCR Corretora'}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                          {cliente.totalApolices || (cliente.apolices ? cliente.apolices.length : 0)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenHistory(cliente)}
                            title="Ver histórico completo"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id, cliente.nome)}
                            title="Excluir cliente"
                            className="p-1.5 rounded-md hover:bg-danger-soft text-muted-foreground hover:text-danger transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Modal Novo Cliente */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Cadastrar cliente"
        subtitle="Preencha os dados cadastrais, endereço e contato do novo cliente."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger border border-danger/20 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Tipo de Pessoa *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="PF">Pessoa Física (CPF)</option>
                <option value="PJ">Pessoa Jurídica (CNPJ)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                CPF / CNPJ *
              </label>
              <input
                type="text"
                required
                value={form.cpfCnpj}
                onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                placeholder={form.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Nome Completo / Razão Social *
            </label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Carlos Eduardo de Souza"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="cliente@email.com"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                placeholder="(61) 99888-7766"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Endereço Principal
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Logradouro (Rua, Av.)"
                  value={form.logradouro}
                  onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Número"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="UF (DF, SP...)"
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Corretor Responsável
            </label>
            <select
              value={form.corretorId}
              onChange={(e) => setForm({ ...form, corretorId: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {corretores.map((corretor) => (
                <option key={corretor.id} value={corretor.id}>
                  {corretor.nome} (SUSEP {corretor.registroSusep})
                </option>
              ))}
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
              {submitting ? 'Cadastrando...' : 'Salvar cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Drawer / Modal Histórico Completo */}
      <Modal
        isOpen={!!selectedClienteHistory}
        onClose={() => setSelectedClienteHistory(null)}
        title={selectedClienteHistory?.nome || 'Histórico do Cliente'}
        subtitle={`Código #${selectedClienteHistory?.id} · CPF/CNPJ: ${selectedClienteHistory?.cpfCnpj}`}
        maxWidth="max-w-3xl"
      >
        {historyLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando histórico do cliente...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informações de Contato e Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Dados de Contato
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-primary" />
                    <span>{selectedClienteHistory?.email}</span>
                  </div>
                  {selectedClienteHistory?.telefones?.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Phone className="size-3.5 text-primary" />
                      <span>{t.numero} ({t.tipo})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Endereço Cadastrado
                </p>
                {selectedClienteHistory?.enderecos && selectedClienteHistory.enderecos.length > 0 ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="text-foreground font-medium">
                      {selectedClienteHistory.enderecos[0].logradouro}, {selectedClienteHistory.enderecos[0].numero}
                    </p>
                    <p>
                      {selectedClienteHistory.enderecos[0].bairro} — {selectedClienteHistory.enderecos[0].cidade}/{selectedClienteHistory.enderecos[0].uf}
                    </p>
                    <p>CEP: {selectedClienteHistory.enderecos[0].cep}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum endereço vinculado.</p>
                )}
              </div>
            </div>

            {/* Apólices do Cliente */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-sans font-semibold text-sm text-foreground flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  Apólices Contratadas
                </h4>
                <span className="text-xs text-muted-foreground">
                  {selectedClienteHistory?.apolices?.length || 0} apólices
                </span>
              </div>

              {selectedClienteHistory?.apolices && selectedClienteHistory.apolices.length > 0 ? (
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {selectedClienteHistory.apolices.map((ap) => (
                    <div key={ap.id} className="p-3 bg-card hover:bg-accent/20 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {ap.seguroNome || 'Seguro'}
                          </span>
                          <StatusBadge status={ap.situacao} />
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          Apólice: {ap.numeroApolice} · Vigência até {ap.dataTermino}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          R$ {Number(ap.premio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-card p-3 rounded-lg border border-border text-center">
                  Nenhuma apólice contratada até o momento.
                </p>
              )}
            </div>

            {/* Cotações do Cliente */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-sans font-semibold text-sm text-foreground flex items-center gap-2">
                  <FileCheck className="size-4 text-primary" />
                  Cotações Solicitadas
                </h4>
                <span className="text-xs text-muted-foreground">
                  {selectedClienteHistory?.cotacoes?.length || 0} cotações
                </span>
              </div>

              {selectedClienteHistory?.cotacoes && selectedClienteHistory.cotacoes.length > 0 ? (
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {selectedClienteHistory.cotacoes.map((cot) => (
                    <div key={cot.id} className="p-3 bg-card hover:bg-accent/20 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            Cotação #{cot.id} · {cot.seguroNome || 'Seguro'}
                          </span>
                          <StatusBadge status={cot.situacao} />
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          Solicitada em {cot.dataCotacao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-card p-3 rounded-lg border border-border text-center">
                  Nenhuma cotação registrada.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
