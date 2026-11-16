import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Plus,
  RefreshCw,
  XCircle,
  CreditCard,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Wallet
} from 'lucide-react';
import {
  PageHeader,
  StatusBadge,
  SectionCard,
  EmptyState,
  Modal,
  FieldError,
  FeedbackBanner,
  getErrorInputStyle
} from './ui/UiBits';
import { apiFetch } from '../api';

const FORMAS_PAGAMENTO = [
  'PIX',
  'Boleto Bancário',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência / TED',
  'Dinheiro'
];

export const ApolicesTab = ({ currentUser, currentRole }) => {
  const [apolices, setApolices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('TODAS');
  const [seguroFilter, setSeguroFilter] = useState('');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedApoliceParcelas, setSelectedApoliceParcelas] = useState(null);
  const [parcelasLoading, setParcelasLoading] = useState(false);
  const [parcelaFiltroModal, setParcelaFiltroModal] = useState('NAO_PAGAS'); // 'TODAS' | 'NAO_PAGAS' | 'PAGAS'
  const [tiposPagamentoPorParcela, setTiposPagamentoPorParcela] = useState({});
  const [parcelaFeedback, setParcelaFeedback] = useState(null);
  const [processingParcelaId, setProcessingParcelaId] = useState(null);

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
  const [formErrors, setFormErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Renovação (mantém dataInicio do 1º contrato automaticamente)
  const [renewForm, setRenewForm] = useState({
    novaDataTermino: '',
    novoPremio: '',
    quantidadeParcelas: 12
  });
  const [renewErrors, setRenewErrors] = useState({});
  const [renewBannerError, setRenewBannerError] = useState(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  // Form Cancelamento
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelError, setCancelError] = useState(null);

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
        const valorInicial = segurosData[0].valorBase ?? segurosData[0].premioBase ?? '';
        setForm((prev) => ({
          ...prev,
          clienteId: prev.clienteId || clientesData[0].id,
          seguroId: prev.seguroId || segurosData[0].id,
          corretorId: prev.corretorId || corretoresData[0].id,
          dataInicio: prev.dataInicio || today,
          dataTermino: prev.dataTermino || nextYear.toISOString().substring(0, 10),
          premio: prev.premio || valorInicial
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar apólices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPremioValue = (ap) => {
    if (!ap) return 0;
    return Number(ap.valorPremio ?? ap.premio ?? 0);
  };

  const isParcelaPaga = (p) => {
    if (!p) return false;
    const st = String(p.status || p.situacao || '').toUpperCase();
    return st === 'PAGO' || st === 'PAGA';
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!form.clienteId) errors.clienteId = 'Selecione o cliente titular da apólice.';
    if (!form.seguroId) errors.seguroId = 'Selecione o produto de seguro.';
    if (!form.corretorId) errors.corretorId = 'Selecione o corretor responsável.';
    if (!form.premio || Number(form.premio) <= 0) {
      errors.premio = 'Informe um valor de prêmio anual maior que zero.';
    }
    if (!form.dataInicio) {
      errors.dataInicio = 'A data de início da vigência é obrigatória.';
    }
    if (!form.dataTermino) {
      errors.dataTermino = 'A data de término da vigência é obrigatória.';
    } else if (form.dataInicio && form.dataTermino <= form.dataInicio) {
      errors.dataTermino = 'A data de término deve ser posterior à data de início.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormBannerError(null);

    if (!validateCreateForm()) {
      setFormBannerError('Verifique os campos destacados em vermelho antes de gerar a apólice.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        numeroApolice: form.numeroApolice?.trim() || undefined,
        clienteId: Number(form.clienteId),
        seguroId: Number(form.seguroId),
        corretorId: Number(form.corretorId),
        valorPremio: Number(form.premio),
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
      setFormErrors({});
      setPageFeedback({
        type: 'success',
        message: `Apólice ${nova.numeroApolice} emitida e parcelas geradas com sucesso!`
      });
    } catch (err) {
      setFormBannerError(err.message || 'Erro ao registrar contratação da apólice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenParcelas = async (apolice) => {
    setParcelaFeedback(null);
    setParcelaFiltroModal('TODAS');
    setParcelasLoading(true);
    setSelectedApoliceParcelas({
      ...apolice,
      parcelas: apolice.parcelas || []
    });

    try {
      const parcelas = await apiFetch(`/apolices/${apolice.id}/parcelas`);
      const lista = Array.isArray(parcelas) ? parcelas : (apolice.parcelas || []);
      const mapaTipos = {};
      lista.forEach((p) => {
        mapaTipos[p.id] = p.formaPagamento || p.tipoPagamento || 'PIX';
      });
      setTiposPagamentoPorParcela(mapaTipos);
      setSelectedApoliceParcelas({ ...apolice, parcelas: lista });
    } catch (err) {
      setParcelaFeedback({
        type: 'error',
        message: err.message || 'Não foi possível carregar as parcelas desta apólice.'
      });
    } finally {
      setParcelasLoading(false);
    }
  };

  const handleCloseParcelasModal = () => {
    setSelectedApoliceParcelas(null);
    setParcelaFeedback(null);
    setProcessingParcelaId(null);
  };

  const handleMarcarParcelaPaga = async (parcela) => {
    const tipoEscolhido = tiposPagamentoPorParcela[parcela.id] || 'PIX';
    try {
      setProcessingParcelaId(parcela.id);
      setParcelaFeedback(null);

      const atualizada = await apiFetch(`/apolices/parcelas/${parcela.id}/pagar`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'PAGO',
          formaPagamento: tipoEscolhido,
          tipoPagamento: tipoEscolhido
        })
      });

      setSelectedApoliceParcelas((prev) => {
        if (!prev) return null;
        const novasParcelas = (prev.parcelas || []).map((p) =>
          p.id === parcela.id
            ? {
                ...p,
                ...atualizada,
                status: 'PAGO',
                situacao: 'Paga',
                formaPagamento: tipoEscolhido,
                tipoPagamento: tipoEscolhido,
                dataPagamento: atualizada?.dataPagamento || new Date().toISOString().substring(0, 10)
              }
            : p
        );
        return { ...prev, parcelas: novasParcelas };
      });

      // Atualiza também na lista principal de apólices
      setApolices((prevList) =>
        prevList.map((ap) =>
          ap.id === selectedApoliceParcelas?.id
            ? {
                ...ap,
                parcelas: (ap.parcelas || []).map((p) =>
                  p.id === parcela.id
                    ? { ...p, status: 'PAGO', situacao: 'Paga', formaPagamento: tipoEscolhido }
                    : p
                )
              }
            : ap
        )
      );

      setParcelaFeedback({
        type: 'success',
        message: `Parcela #${parcela.numeroParcela || parcela.id} marcada como PAGA via ${tipoEscolhido}!`
      });
    } catch (err) {
      setParcelaFeedback({
        type: 'error',
        message: err.message || 'Erro ao registrar pagamento da parcela.'
      });
    } finally {
      setProcessingParcelaId(null);
    }
  };

  const handleReabrirParcela = async (parcela) => {
    try {
      setProcessingParcelaId(parcela.id);
      setParcelaFeedback(null);

      const atualizada = await apiFetch(`/apolices/parcelas/${parcela.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'PENDENTE',
          formaPagamento: null
        })
      });

      setSelectedApoliceParcelas((prev) => {
        if (!prev) return null;
        const novasParcelas = (prev.parcelas || []).map((p) =>
          p.id === parcela.id
            ? {
                ...p,
                ...atualizada,
                status: 'PENDENTE',
                situacao: 'Pendente',
                formaPagamento: null,
                tipoPagamento: null,
                dataPagamento: null
              }
            : p
        );
        return { ...prev, parcelas: novasParcelas };
      });

      setParcelaFeedback({
        type: 'success',
        message: `Parcela #${parcela.numeroParcela || parcela.id} reaberta como Pendente.`
      });
    } catch (err) {
      setParcelaFeedback({
        type: 'error',
        message: err.message || 'Erro ao reabrir parcela.'
      });
    } finally {
      setProcessingParcelaId(null);
    }
  };

  const handleOpenRenew = (apolice) => {
    setRenewingApolice(apolice);
    setRenewErrors({});
    setRenewBannerError(null);

    const baseEnd = apolice.dataTermino ? new Date(apolice.dataTermino + 'T00:00:00') : new Date();
    baseEnd.setFullYear(baseEnd.getFullYear() + 1);
    setRenewForm({
      novaDataTermino: baseEnd.toISOString().substring(0, 10),
      novoPremio: getPremioValue(apolice),
      quantidadeParcelas: 12
    });
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setRenewBannerError(null);

    const errors = {};
    if (!renewForm.novaDataTermino) {
      errors.novaDataTermino = 'Informe a nova data de término para a renovação.';
    } else if (renewingApolice?.dataInicio && renewForm.novaDataTermino <= renewingApolice.dataInicio) {
      errors.novaDataTermino = `A data de término deve ser posterior à data de início do 1º contrato (${renewingApolice.dataInicio}).`;
    }
    if (!renewForm.novoPremio || Number(renewForm.novoPremio) <= 0) {
      errors.novoPremio = 'Informe um valor de prêmio válido maior que zero.';
    }

    setRenewErrors(errors);
    if (Object.keys(errors).length > 0) {
      setRenewBannerError('Corrija os campos destacados em vermelho para concluir a renovação.');
      return;
    }

    try {
      setRenewSubmitting(true);
      const renovada = await apiFetch(`/apolices/${renewingApolice.id}/renovar`, {
        method: 'POST',
        body: JSON.stringify({
          // Não exige novaDataInicio do usuário: o backend preserva a dataInicio do 1º contrato
          novaDataTermino: renewForm.novaDataTermino,
          novoValorPremio: Number(renewForm.novoPremio),
          novoPremio: Number(renewForm.novoPremio),
          quantidadeParcelas: Number(renewForm.quantidadeParcelas) || 12
        })
      });

      await loadData();
      setRenewingApolice(null);
      setPageFeedback({
        type: 'success',
        message: `Apólice renovada com sucesso (${renovada.numeroApolice}) mantendo a data de início original (${renovada.dataInicio})!`
      });
    } catch (err) {
      setRenewBannerError(err.message || 'Erro ao renovar apólice.');
    } finally {
      setRenewSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelError(null);
    if (!cancelMotivo.trim() || cancelMotivo.trim().length < 5) {
      setCancelError('Informe o motivo detalhado do cancelamento (mínimo de 5 caracteres).');
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
      setPageFeedback({
        type: 'success',
        message: `Apólice ${cancelada.numeroApolice} cancelada com registro preservado.`
      });
    } catch (err) {
      setCancelError(err.message || 'Erro ao cancelar apólice.');
    }
  };

  const normalizeSituacao = (sit = '') => {
    const upper = String(sit).toUpperCase();
    if (upper === 'ATIVA' || upper === 'ATIVO') return 'ATIVA';
    if (upper === 'EM_RENOVACAO' || upper === 'EM RENOVAÇÃO') return 'EM_RENOVACAO';
    if (upper === 'CANCELADA') return 'CANCELADA';
    if (upper === 'VENCIDA') return 'VENCIDA';
    return upper;
  };

  const filteredApolices = apolices.filter((a) => {
    const matchesSearch =
      (a.numeroApolice && a.numeroApolice.toLowerCase().includes(search.toLowerCase())) ||
      (a.clienteNome && a.clienteNome.toLowerCase().includes(search.toLowerCase())) ||
      (a.seguroNome && a.seguroNome.toLowerCase().includes(search.toLowerCase()));

    const matchesSituacao =
      situacaoFilter === 'TODAS' || normalizeSituacao(a.situacao) === situacaoFilter;

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

  // Dados calculados para o modal de parcelas
  const todasParcelasModal = selectedApoliceParcelas?.parcelas || [];
  const parcelasPagasModal = todasParcelasModal.filter((p) => isParcelaPaga(p));
  const parcelasNaoPagasModal = todasParcelasModal.filter((p) => !isParcelaPaga(p));
  const parcelasExibidasModal =
    parcelaFiltroModal === 'NAO_PAGAS'
      ? parcelasNaoPagasModal
      : parcelaFiltroModal === 'PAGAS'
      ? parcelasPagasModal
      : todasParcelasModal;

  const totalQuitadoModal = parcelasPagasModal.reduce((acc, p) => acc + Number(p.valor || 0), 0);
  const totalPendenteModal = parcelasNaoPagasModal.reduce((acc, p) => acc + Number(p.valor || 0), 0);

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Contratos"
        title="Apólices"
        description="Acompanhe vigência e situação, gerencie parcelas e pagamentos, registre contratações, renovações e cancelamentos."
        actions={
          <button
            onClick={() => {
              setFormErrors({});
              setFormBannerError(null);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Registrar contratação
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
          <option value="ATIVA">Ativa</option>
          <option value="EM_RENOVACAO">Em renovação</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="VENCIDA">Vencida</option>
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
                {filteredApolices.map((apolice) => {
                  const sitNorm = normalizeSituacao(apolice.situacao);
                  const qtdPagas = (apolice.parcelas || []).filter((p) => isParcelaPaga(p)).length;
                  const qtdTotal = (apolice.parcelas || []).length;
                  return (
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
                        {formatCurrency(getPremioValue(apolice))}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenParcelas(apolice)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-muted hover:bg-accent text-foreground border border-border transition-colors"
                        >
                          <CreditCard className="size-3.5 text-primary" />
                          <span>Ver parcelas</span>
                          {qtdTotal > 0 && (
                            <span className="font-mono text-[0.68rem] text-muted-foreground">
                              ({qtdPagas}/{qtdTotal})
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sitNorm !== 'CANCELADA' && (
                            <button
                              type="button"
                              onClick={() => handleOpenRenew(apolice)}
                              title="Renovar apólice (mantém a data de início do 1º contrato)"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted text-primary text-xs font-semibold border border-border transition-colors"
                            >
                              <RefreshCw className="size-3.5" />
                              <span>Renovar</span>
                            </button>
                          )}
                          {sitNorm === 'ATIVA' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancelError(null);
                                setCancelMotivo('');
                                setCancelingApolice(apolice);
                              }}
                              title="Cancelar apólice"
                              className="p-1.5 rounded-md hover:bg-danger-soft text-danger transition-colors"
                            >
                              <XCircle className="size-4" />
                            </button>
                          )}
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

      {/* Modal Registrar Contratação */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar contratação"
        subtitle="Vincule cliente, produto securitário, corretor e gere o cronograma de parcelas."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={formBannerError}
            onClose={() => setFormBannerError(null)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Cliente *
              </label>
              <select
                value={form.clienteId}
                onChange={(e) => {
                  setForm({ ...form, clienteId: e.target.value });
                  if (formErrors.clienteId) setFormErrors({ ...formErrors, clienteId: null });
                }}
                style={getErrorInputStyle(!!formErrors.clienteId)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.cpfCnpj})
                  </option>
                ))}
              </select>
              <FieldError error={formErrors.clienteId} />
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
                    premio: s?.valorBase ?? s?.premioBase ?? form.premio
                  });
                  if (formErrors.seguroId) setFormErrors({ ...formErrors, seguroId: null });
                }}
                style={getErrorInputStyle(!!formErrors.seguroId)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Selecione um seguro...</option>
                {seguros.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <FieldError error={formErrors.seguroId} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Corretor Responsável *
              </label>
              <select
                value={form.corretorId}
                onChange={(e) => {
                  setForm({ ...form, corretorId: e.target.value });
                  if (formErrors.corretorId) setFormErrors({ ...formErrors, corretorId: null });
                }}
                style={getErrorInputStyle(!!formErrors.corretorId)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Selecione um corretor...</option>
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <FieldError error={formErrors.corretorId} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Número da Apólice (opcional)
              </label>
              <input
                type="text"
                value={form.numeroApolice}
                onChange={(e) => setForm({ ...form, numeroApolice: e.target.value })}
                placeholder="Gerado automaticamente se vazio"
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
                value={form.premio}
                onChange={(e) => {
                  setForm({ ...form, premio: e.target.value });
                  if (formErrors.premio) setFormErrors({ ...formErrors, premio: null });
                }}
                style={getErrorInputStyle(!!formErrors.premio)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
              <FieldError error={formErrors.premio} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Início da Vigência *
              </label>
              <input
                type="date"
                value={form.dataInicio}
                onChange={(e) => {
                  setForm({ ...form, dataInicio: e.target.value });
                  if (formErrors.dataInicio) setFormErrors({ ...formErrors, dataInicio: null });
                }}
                style={getErrorInputStyle(!!formErrors.dataInicio)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
              <FieldError error={formErrors.dataInicio} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Término da Vigência *
              </label>
              <input
                type="date"
                value={form.dataTermino}
                onChange={(e) => {
                  setForm({ ...form, dataTermino: e.target.value });
                  if (formErrors.dataTermino) setFormErrors({ ...formErrors, dataTermino: null });
                }}
                style={getErrorInputStyle(!!formErrors.dataTermino)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
              <FieldError error={formErrors.dataTermino} />
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

      {/* Modal Visualizar e Quitar Parcelas */}
      <Modal
        isOpen={!!selectedApoliceParcelas}
        onClose={handleCloseParcelasModal}
        title={`Parcelas — ${selectedApoliceParcelas?.numeroApolice || ''}`}
        subtitle={`Cliente: ${selectedApoliceParcelas?.clienteNome || ''} · Prêmio Total: ${formatCurrency(getPremioValue(selectedApoliceParcelas))}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {parcelaFeedback && (
            <FeedbackBanner
              type={parcelaFeedback.type}
              message={parcelaFeedback.message}
              onClose={() => setParcelaFeedback(null)}
            />
          )}

          {/* Resumo Financeiro das Parcelas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-[0.68rem] uppercase font-semibold text-muted-foreground">
                Total de Parcelas
              </p>
              <p className="font-display text-lg font-bold text-foreground mt-0.5">
                {todasParcelasModal.length}x
              </p>
            </div>
            <div className="rounded-lg border border-border bg-success-soft p-3 text-center">
              <p className="text-[0.68rem] uppercase font-semibold text-success">
                Pagas ({parcelasPagasModal.length})
              </p>
              <p className="font-display text-lg font-bold text-success mt-0.5 tabular">
                {formatCurrency(totalQuitadoModal)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-warning-soft p-3 text-center">
              <p className="text-[0.68rem] uppercase font-semibold text-warning">
                Não Pagas ({parcelasNaoPagasModal.length})
              </p>
              <p className="font-display text-lg font-bold text-warning mt-0.5 tabular">
                {formatCurrency(totalPendenteModal)}
              </p>
            </div>
          </div>

          {/* Botões de Filtro: Todas / Não Pagas / Pagas */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParcelaFiltroModal('TODAS')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  parcelaFiltroModal === 'TODAS'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                Todas ({todasParcelasModal.length})
              </button>
              <button
                type="button"
                onClick={() => setParcelaFiltroModal('NAO_PAGAS')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  parcelaFiltroModal === 'NAO_PAGAS'
                    ? 'bg-warning-soft text-warning border-warning'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                Não pagas ({parcelasNaoPagasModal.length})
              </button>
              <button
                type="button"
                onClick={() => setParcelaFiltroModal('PAGAS')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  parcelaFiltroModal === 'PAGAS'
                    ? 'bg-success-soft text-success border-success'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                Pagas ({parcelasPagasModal.length})
              </button>
            </div>
            <span className="text-[0.7rem] text-muted-foreground">
              Selecione a forma de pagamento e clique em <strong>Marcar Pago</strong>
            </span>
          </div>

          {/* Lista de Parcelas com rolagem controlada */}
          <div
            style={{ maxHeight: '46vh', overflowY: 'auto' }}
            className="divide-y divide-border border border-border rounded-lg overflow-hidden"
          >
            {parcelasLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Carregando parcelas da apólice...
              </div>
            ) : parcelasExibidasModal.length > 0 ? (
              parcelasExibidasModal.map((p, idx) => {
                const isPaga = isParcelaPaga(p);
                const numero = p.numeroParcela || idx + 1;
                const tipoAtual = tiposPagamentoPorParcela[p.id] || p.formaPagamento || p.tipoPagamento || 'PIX';
                const isProcessing = processingParcelaId === p.id;

                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card hover:bg-accent/20 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          isPaga
                            ? 'bg-success-soft text-success'
                            : 'bg-warning-soft text-warning'
                        }`}
                      >
                        {numero}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">
                            Parcela #{numero} · {formatCurrency(p.valor)}
                          </p>
                          <StatusBadge status={isPaga ? 'PAGO' : 'PENDENTE'} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            Vencimento: <strong className="text-foreground">{p.dataVencimento}</strong>
                          </span>
                          {isPaga && (p.formaPagamento || p.tipoPagamento) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              <Wallet className="size-3" />
                              Tipo: {p.formaPagamento || p.tipoPagamento}
                            </span>
                          )}
                          {isPaga && p.dataPagamento && (
                            <span>Pago em: {p.dataPagamento}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {!isPaga ? (
                        <>
                          <select
                            aria-label={`Tipo de pagamento da parcela ${numero}`}
                            value={tipoAtual}
                            onChange={(e) =>
                              setTiposPagamentoPorParcela({
                                ...tiposPagamentoPorParcela,
                                [p.id]: e.target.value
                              })
                            }
                            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
                          >
                            {FORMAS_PAGAMENTO.map((forma) => (
                              <option key={forma} value={forma}>
                                {forma}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleMarcarParcelaPaga(p)}
                            style={{
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>{isProcessing ? 'Salvando...' : 'Marcar Pago'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReabrirParcela(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-muted hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                        >
                          <RotateCcw className="size-3" />
                          <span>Marcar Não Pago</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma parcela encontrada para o filtro selecionado.
              </div>
            )}
          </div>

          {/* Rodapé com botão explícito para fechar */}
          <div className="flex items-center justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleCloseParcelasModal}
              className="px-5 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Fechar tela de parcelas
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Renovar Apólice (Usa automaticamente a mesma data de início do 1º contrato) */}
      <Modal
        isOpen={!!renewingApolice}
        onClose={() => setRenewingApolice(null)}
        title="Renovar apólice"
        subtitle={`Apólice: ${renewingApolice?.numeroApolice || ''} · Cliente: ${renewingApolice?.clienteNome || ''}`}
      >
        <form onSubmit={handleRenewSubmit} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={renewBannerError}
            onClose={() => setRenewBannerError(null)}
          />

          <div className="rounded-lg border border-border bg-muted/50 p-3.5 text-xs space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              Data de Início Original (1º Contrato):{' '}
              <span className="font-mono font-bold text-primary">{renewingApolice?.dataInicio}</span>
            </p>
            <p className="text-muted-foreground">
              Por se tratar de uma renovação contratual, a data de início original do 1º contrato é mantida automaticamente sem necessidade de novo preenchimento.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Nova Data de Término da Vigência *
            </label>
            <input
              type="date"
              value={renewForm.novaDataTermino}
              onChange={(e) => {
                setRenewForm({ ...renewForm, novaDataTermino: e.target.value });
                if (renewErrors.novaDataTermino) setRenewErrors({ ...renewErrors, novaDataTermino: null });
              }}
              style={getErrorInputStyle(!!renewErrors.novaDataTermino)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
            <FieldError error={renewErrors.novaDataTermino} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Novo Prêmio Anual (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={renewForm.novoPremio}
                onChange={(e) => {
                  setRenewForm({ ...renewForm, novoPremio: e.target.value });
                  if (renewErrors.novoPremio) setRenewErrors({ ...renewErrors, novoPremio: null });
                }}
                style={getErrorInputStyle(!!renewErrors.novoPremio)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
              <FieldError error={renewErrors.novoPremio} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Parcelamento da Renovação
              </label>
              <select
                value={renewForm.quantidadeParcelas}
                onChange={(e) => setRenewForm({ ...renewForm, quantidadeParcelas: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="1">1x à vista</option>
                <option value="3">3x parcelas</option>
                <option value="6">6x parcelas</option>
                <option value="10">10x parcelas</option>
                <option value="12">12x parcelas mensais</option>
              </select>
            </div>
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
              disabled={renewSubmitting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {renewSubmitting ? 'Renovando...' : 'Confirmar renovação'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Cancelar Apólice */}
      <Modal
        isOpen={!!cancelingApolice}
        onClose={() => setCancelingApolice(null)}
        title="Cancelar apólice"
        subtitle={`Apólice: ${cancelingApolice?.numeroApolice || ''} · ${cancelingApolice?.clienteNome || ''}`}
      >
        <form onSubmit={handleCancelSubmit} noValidate className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Motivo do cancelamento *
            </label>
            <textarea
              rows={3}
              value={cancelMotivo}
              onChange={(e) => {
                setCancelMotivo(e.target.value);
                if (cancelError) setCancelError(null);
              }}
              style={getErrorInputStyle(!!cancelError)}
              placeholder="Descreva o motivo solicitado pelo cliente ou decisão da seguradora..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
            <FieldError error={cancelError} />
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
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              className="px-4 py-2 text-sm rounded-md font-semibold hover:opacity-90"
            >
              Confirmar cancelamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
