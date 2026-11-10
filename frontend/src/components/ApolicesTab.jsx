import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Plus,
  RefreshCw,
  XCircle,
  CreditCard,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal, CodeText } from './ui/UiBits';
import { apiFetch } from '../api';

export const ApolicesTab = ({ currentUser, currentRole }) => {
  const [apolices, setApolices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('TODAS');
  const [seguroFilter, setSeguroFilter] = useState('');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedApoliceParcelas, setSelectedApoliceParcelas] = useState(null);
  const [renewingApolice, setRenewingApolice] = useState(null);
  const [cancelingApolice, setCancelingApolice] = useState(null);

  // Form Contratação
  const [form, setForm] = useState({
    numeroApolice: '',
    clienteId: '',
    seguroId: '',
    corretorId: '',
    premio: '',
    dataInicio: '',
    dataTermino: '',
    quantidadeParcelas: 12
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Renovação
  const [renewForm, setRenewForm] = useState({
    novaDataTermino: '',
    novoPremio: ''
  });

  // Form Cancelamento
  const [cancelMotivo, setCancelMotivo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apolicesData, clientesData, segurosData, corretoresData] = await Promise.all([
        apiFetch('/apolices').catch(() => []),
        apiFetch('/clientes').catch(() => []),
        apiFetch('/seguros').catch(() => []),
        apiFetch('/corretores').catch(() => [])
      ]);
      setApolices(apolicesData || []);
      setClientes(clientesData || []);
      setSeguros(segurosData || []);
      setCorretores(corretoresData || []);

      if (clientesData?.length && segurosData?.length && corretoresData?.length) {
        const today = new Date().toISOString().substring(0, 10);
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setForm((prev) => ({
          ...prev,
          clienteId: clientesData[0].id,
          seguroId: segurosData[0].id,
          corretorId: corretoresData[0].id,
          dataInicio: today,
          dataTermino: nextYear.toISOString().substring(0, 10),
          premio: segurosData[0].premioBase || 2400
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar apólices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.clienteId || !form.seguroId || !form.corretorId || !form.premio) {
      setFormError('Por favor preencha todos os campos obrigatórios (*).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        numeroApolice: form.numeroApolice || `AP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        clienteId: Number(form.clienteId),
        seguroId: Number(form.seguroId),
        corretorId: Number(form.corretorId),
        premio: Number(form.premio),
        dataInicio: form.dataInicio,
        dataTermino: form.dataTermino,
        quantidadeParcelas: Number(form.quantidadeParcelas) || 12
      };

      const nova = await apiFetch('/apolices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setApolices([nova, ...apolices]);
      setIsNewModalOpen(false);
      alert('Apólice contratada e parcelas geradas com sucesso!');
    } catch (err) {
      setFormError(err.message || 'Erro ao registrar apólice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenParcelas = async (apolice) => {
    try {
      setSelectedApoliceParcelas(apolice);
      const parcelas = await apiFetch(`/apolices/${apolice.id}/parcelas`).catch(() => []);
      setSelectedApoliceParcelas({ ...apolice, parcelas });
    } catch (err) {
      console.error('Erro ao buscar parcelas:', err);
    }
  };

  const handlePagarParcela = async (parcelaId) => {
    try {
      await apiFetch(`/apolices/parcelas/${parcelaId}/pagar`, { method: 'POST' });
      // Atualiza parcelas locais
      if (selectedApoliceParcelas?.parcelas) {
        const updated = selectedApoliceParcelas.parcelas.map((p) =>
          p.id === parcelaId ? { ...p, situacao: 'Paga', dataPagamento: new Date().toISOString().substring(0, 10) } : p
        );
        setSelectedApoliceParcelas({ ...selectedApoliceParcelas, parcelas: updated });
      }
      alert('Pagamento de parcela confirmado!');
    } catch (err) {
      alert(`Erro ao registrar pagamento: ${err.message}`);
    }
  };

  const handleOpenRenew = (apolice) => {
    setRenewingApolice(apolice);
    const currEnd = new Date(apolice.dataTermino || new Date());
    currEnd.setFullYear(currEnd.getFullYear() + 1);
    setRenewForm({
      novaDataTermino: currEnd.toISOString().substring(0, 10),
      novoPremio: apolice.premio
    });
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      const renovada = await apiFetch(`/apolices/${renewingApolice.id}/renovar`, {
        method: 'POST',
        body: JSON.stringify({
          novaDataTermino: renewForm.novaDataTermino,
          novoPremio: Number(renewForm.novoPremio)
        })
      });

      setApolices(apolices.map((a) => (a.id === renewingApolice.id ? renovada : a)));
      setRenewingApolice(null);
      alert('Apólice renovada com sucesso!');
    } catch (err) {
      alert(`Erro na renovação: ${err.message}`);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelMotivo.trim()) {
      alert('Informe o motivo do cancelamento.');
      return;
    }
    try {
      const cancelada = await apiFetch(`/apolices/${cancelingApolice.id}/cancelar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: cancelMotivo })
      });

      setApolices(apolices.map((a) => (a.id === cancelingApolice.id ? cancelada : a)));
      setCancelingApolice(null);
      setCancelMotivo('');
      alert('Apólice cancelada.');
    } catch (err) {
      alert(`Erro ao cancelar apólice: ${err.message}`);
    }
  };

  const filteredApolices = apolices.filter((a) => {
    const matchesSearch =
      (a.numeroApolice && a.numeroApolice.toLowerCase().includes(search.toLowerCase())) ||
      (a.clienteNome && a.clienteNome.toLowerCase().includes(search.toLowerCase())) ||
      (a.seguroNome && a.seguroNome.toLowerCase().includes(search.toLowerCase()));

    const matchesSituacao =
      situacaoFilter === 'TODAS' || a.situacao === situacaoFilter;

    const matchesSeguro =
      !seguroFilter || String(a.seguroId) === String(seguroFilter);

    return matchesSearch && matchesSituacao && matchesSeguro;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Contratos"
        title="Apólices"
        description="Acompanhe vigência e situação, registre contratações, renovações e cancelamentos."
        actions={
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Registrar contratação
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por número da apólice, cliente ou seguro..."
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <select
          value={situacaoFilter}
          onChange={(e) => setSituacaoFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="TODAS">Todas as situações</option>
          <option value="Ativa">Ativa</option>
          <option value="Em renovação">Em renovação</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Vencida">Vencida</option>
        </select>

        <select
          value={seguroFilter}
          onChange={(e) => setSeguroFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todos os seguros</option>
          {seguros.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Apólices */}
      <SectionCard>
        {filteredApolices.length === 0 ? (
          <EmptyState
            title="Nenhuma apólice encontrada"
            text="Tente ajustar os filtros ou registre uma nova contratação."
            action={
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                <Plus className="size-4" />
                Registrar primeira apólice
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Apólice</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Corretor</th>
                  <th className="px-5 py-3.5">Vigência</th>
                  <th className="px-5 py-3.5">Situação</th>
                  <th className="px-5 py-3.5 text-right">Prêmio</th>
                  <th className="px-5 py-3.5 text-center">Parcelas</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredApolices.map((apolice) => (
                  <tr key={apolice.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">{apolice.numeroApolice}</p>
                          <span className="text-[0.7rem] text-muted-foreground">{apolice.seguroNome}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-foreground">
                      {apolice.clienteNome || `Cliente #${apolice.clienteId}`}
                    </td>

                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {apolice.corretorNome || 'HCR'}
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <span className="text-foreground">{apolice.dataInicio}</span>
                      <span className="text-muted-foreground"> até </span>
                      <span className="text-foreground font-medium">{apolice.dataTermino}</span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={apolice.situacao} />
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-foreground tabular">
                      {formatCurrency(apolice.premio)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleOpenParcelas(apolice)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted hover:bg-accent text-foreground transition-colors"
                      >
                        <CreditCard className="size-3 text-primary" />
                        Ver parcelas
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apolice.situacao !== 'Cancelada' && (
                          <button
                            onClick={() => handleOpenRenew(apolice)}
                            title="Renovar apólice"
                            className="p-1.5 rounded-md hover:bg-muted text-primary transition-colors"
                          >
                            <RefreshCw className="size-4" />
                          </button>
                        )}
                        {apolice.situacao === 'Ativa' && (
                          <button
                            onClick={() => setCancelingApolice(apolice)}
                            title="Cancelar apólice"
                            className="p-1.5 rounded-md hover:bg-danger-soft text-danger transition-colors"
                          >
                            <XCircle className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Modal Registrar Contratação */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar contratação"
        subtitle="Vincule cliente, produto securitário, corretor e gere o cronograma de parcelas."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger border border-danger/20">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Cliente *
              </label>
              <select
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.cpfCnpj})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Seguro *
              </label>
              <select
                value={form.seguroId}
                onChange={(e) => {
                  const s = seguros.find((item) => String(item.id) === e.target.value);
                  setForm({
                    ...form,
                    seguroId: e.target.value,
                    premio: s?.premioBase || form.premio
                  });
                }}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {seguros.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Corretor Responsável *
              </label>
              <select
                value={form.corretorId}
                onChange={(e) => setForm({ ...form, corretorId: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Número da Apólice (opcional)
              </label>
              <input
                type="text"
                value={form.numeroApolice}
                onChange={(e) => setForm({ ...form, numeroApolice: e.target.value })}
                placeholder="Ex: AP-2026-9988"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Prêmio Anual (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.premio}
                onChange={(e) => setForm({ ...form, premio: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Início da Vigência
              </label>
              <input
                type="date"
                required
                value={form.dataInicio}
                onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Término da Vigência
              </label>
              <input
                type="date"
                required
                value={form.dataTermino}
                onChange={(e) => setForm({ ...form, dataTermino: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Plano de Pagamento
            </label>
            <select
              value={form.quantidadeParcelas}
              onChange={(e) => setForm({ ...form, quantidadeParcelas: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="1">1x parcela única (à vista)</option>
              <option value="3">3x parcelas</option>
              <option value="6">6x parcelas semestrais</option>
              <option value="10">10x parcelas</option>
              <option value="12">12x parcelas mensais</option>
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
              {submitting ? 'Gerando...' : 'Gerar apólice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualizar Parcelas */}
      <Modal
        isOpen={!!selectedApoliceParcelas}
        onClose={() => setSelectedApoliceParcelas(null)}
        title={`Parcelas — ${selectedApoliceParcelas?.numeroApolice}`}
        subtitle={`Cliente: ${selectedApoliceParcelas?.clienteNome} · Prêmio Total: ${formatCurrency(selectedApoliceParcelas?.premio)}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
            {selectedApoliceParcelas?.parcelas && selectedApoliceParcelas.parcelas.length > 0 ? (
              selectedApoliceParcelas.parcelas.map((p) => {
                const isPaga = p.situacao === 'Paga';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 bg-card hover:bg-accent/20 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-7 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">
                        {p.numeroParcela}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          Parcela {p.numeroParcela} · {formatCurrency(p.valor)}
                        </p>
                        <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="size-3" />
                          Vencimento: {p.dataVencimento}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.situacao} />
                      {!isPaga && (
                        <button
                          onClick={() => handlePagarParcela(p.id)}
                          className="px-2.5 py-1 rounded bg-success-soft text-success border border-success/30 font-semibold hover:bg-success hover:text-white transition-colors"
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma parcela encontrada para esta apólice.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Renovar Apólice */}
      <Modal
        isOpen={!!renewingApolice}
        onClose={() => setRenewingApolice(null)}
        title="Renovar apólice"
        subtitle={`Apólice: ${renewingApolice?.numeroApolice} · Cliente: ${renewingApolice?.clienteNome}`}
      >
        <form onSubmit={handleRenewSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Nova Data de Término (+1 ano)
            </label>
            <input
              type="date"
              required
              value={renewForm.novaDataTermino}
              onChange={(e) => setRenewForm({ ...renewForm, novaDataTermino: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Novo Prêmio Anual (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={renewForm.novoPremio}
              onChange={(e) => setRenewForm({ ...renewForm, novoPremio: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setRenewingApolice(null)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Confirmar renovação
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Cancelar Apólice */}
      <Modal
        isOpen={!!cancelingApolice}
        onClose={() => setCancelingApolice(null)}
        title="Cancelar apólice"
        subtitle={`Apólice: ${cancelingApolice?.numeroApolice} · ${cancelingApolice?.clienteNome}`}
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Motivo do cancelamento *
            </label>
            <textarea
              required
              rows={3}
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
              placeholder="Descreva o motivo solicitado pelo cliente ou decisão da seguradora..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCancelingApolice(null)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-danger text-white font-semibold hover:bg-danger/90"
            >
              Confirmar cancelamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
