import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock
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

export const CotacoesTab = ({ currentUser, currentRole }) => {
  const [cotacoes, setCotacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState(null);

  // Modais
  const [isNewCotacaoOpen, setIsNewCotacaoOpen] = useState(false);
  const [isNewPropostaOpen, setIsNewPropostaOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState(null);

  // Form Nova Cotação
  const [cotacaoForm, setCotacaoForm] = useState({
    clienteId: '',
    seguroId: '',
    informacoesAdicionais: ''
  });
  const [cotacaoErrors, setCotacaoErrors] = useState({});
  const [cotacaoBannerError, setCotacaoBannerError] = useState(null);

  // Form Nova Proposta
  const [propostaForm, setPropostaForm] = useState({
    premio: '',
    condicoes: ''
  });
  const [propostaErrors, setPropostaErrors] = useState({});
  const [propostaBannerError, setPropostaBannerError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cotacoesData, clientesData, segurosData] = await Promise.all([
        apiFetch('/cotacoes').catch(() => []),
        apiFetch('/clientes').catch(() => []),
        apiFetch('/seguros').catch(() => [])
      ]);
      setCotacoes(cotacoesData || []);
      setClientes(clientesData || []);
      setSeguros(segurosData || []);

      if (clientesData?.length && segurosData?.length) {
        setCotacaoForm((prev) => ({
          clienteId: prev.clienteId || clientesData[0].id,
          seguroId: prev.seguroId || segurosData[0].id,
          informacoesAdicionais: ''
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar cotações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCotacao = async (e) => {
    e.preventDefault();
    setCotacaoBannerError(null);

    const errors = {};
    if (!cotacaoForm.clienteId) errors.clienteId = 'Selecione o cliente solicitante.';
    if (!cotacaoForm.seguroId) errors.seguroId = 'Selecione o tipo de seguro.';
    if (!cotacaoForm.informacoesAdicionais || cotacaoForm.informacoesAdicionais.trim().length < 5) {
      errors.informacoesAdicionais = 'Descreva as informações do bem/risco para a cotação (mínimo 5 caracteres).';
    }

    setCotacaoErrors(errors);
    if (Object.keys(errors).length > 0) {
      setCotacaoBannerError('Corrija os campos destacados em vermelho.');
      return;
    }

    try {
      const seg = seguros.find((s) => String(s.id) === String(cotacaoForm.seguroId));
      const payload = {
        clienteId: Number(cotacaoForm.clienteId),
        seguroId: Number(cotacaoForm.seguroId),
        valor: seg?.valorBase ?? seg?.premioBase ?? 0,
        informacoesAdicionais: cotacaoForm.informacoesAdicionais.trim()
      };

      const nova = await apiFetch('/cotacoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCotacoes([nova, ...cotacoes]);
      setIsNewCotacaoOpen(false);
      setCotacaoForm((prev) => ({ ...prev, informacoesAdicionais: '' }));
      setCotacaoErrors({});
      setPageFeedback({
        type: 'success',
        message: `Cotação #${nova.id} registrada com sucesso!`
      });
    } catch (err) {
      setCotacaoBannerError(err.message || 'Erro ao registrar cotação.');
    }
  };

  const handleOpenElaborarProposta = (cotacao) => {
    setSelectedCotacao(cotacao);
    const seg = seguros.find((s) => s.id === cotacao.seguroId || s.nome === cotacao.seguroNome);
    setPropostaForm({
      premio: cotacao.valor ?? seg?.valorBase ?? seg?.premioBase ?? '',
      condicoes: ''
    });
    setPropostaErrors({});
    setPropostaBannerError(null);
    setIsNewPropostaOpen(true);
  };

  const handleCreateProposta = async (e) => {
    e.preventDefault();
    setPropostaBannerError(null);

    const errors = {};
    if (!propostaForm.premio || Number(propostaForm.premio) <= 0) {
      errors.premio = 'Informe um valor de prêmio maior que zero.';
    }
    if (!propostaForm.condicoes || propostaForm.condicoes.trim().length < 5) {
      errors.condicoes = 'Descreva as condições comerciais oferecidas na proposta.';
    }

    setPropostaErrors(errors);
    if (Object.keys(errors).length > 0) {
      setPropostaBannerError('Corrija os campos destacados em vermelho.');
      return;
    }

    try {
      const payload = {
        cotacaoId: selectedCotacao.id,
        premio: Number(propostaForm.premio),
        condicoes: propostaForm.condicoes.trim()
      };

      const novaProp = await apiFetch('/propostas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const updated = cotacoes.map((c) =>
        c.id === selectedCotacao.id
          ? { ...c, situacao: 'PROPOSTA_GERADA', propostas: [...(c.propostas || []), novaProp] }
          : c
      );
      setCotacoes(updated);
      setIsNewPropostaOpen(false);
      setPageFeedback({
        type: 'success',
        message: `Proposta #${novaProp.id} elaborada e enviada para avaliação do cliente!`
      });
    } catch (err) {
      setPropostaBannerError(err.message || 'Erro ao criar proposta.');
    }
  };

  const handleResponderProposta = async (propostaId, aceita) => {
    try {
      const endpoint = aceita ? `/propostas/${propostaId}/aceitar` : `/propostas/${propostaId}/recusar`;
      await apiFetch(endpoint, {
        method: 'POST'
      });
      setPageFeedback({
        type: 'success',
        message: aceita
          ? 'Proposta ACEITA! A apólice e suas parcelas foram geradas automaticamente no PostgreSQL.'
          : 'Proposta recusada.'
      });
      loadData();
    } catch (err) {
      setPageFeedback({
        type: 'error',
        message: err.message || 'Erro ao responder proposta.'
      });
    }
  };

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
        eyebrow="Vendas"
        title="Cotações e propostas"
        description="Da solicitação ao aceite: crie cotações, elabore propostas e acompanhe a resposta do cliente."
        actions={
          <button
            onClick={() => {
              setCotacaoErrors({});
              setCotacaoBannerError(null);
              setIsNewCotacaoOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Nova cotação
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

      {/* Lista de Cotações */}
      {cotacoes.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="Nada por aqui"
            text="Nenhuma cotação foi registrada ainda. Inicie um processo de venda acima."
            action={
              <button
                onClick={() => setIsNewCotacaoOpen(true)}
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                <Plus className="size-4" />
                Registrar primeira cotação
              </button>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-6">
          {cotacoes.map((cotacao) => {
            const hasProposta = cotacao.propostas && cotacao.propostas.length > 0;
            const dataStr = cotacao.dataCotacao || (cotacao.dataSolicitacao ? cotacao.dataSolicitacao.substring(0, 10) : '—');
            return (
              <SectionCard
                key={cotacao.id}
                title={
                  <div className="flex items-center gap-3">
                    <span className="font-display font-medium text-base text-foreground">
                      Cotação #{cotacao.id}
                    </span>
                    <StatusBadge status={cotacao.situacao} />
                  </div>
                }
                action={
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Solicitada em: {dataStr}
                  </span>
                }
              >
                <div className="p-5 space-y-4">
                  {/* Dados da Cotação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border/60">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Cliente
                      </p>
                      <p className="font-medium text-foreground text-sm mt-0.5">
                        {cotacao.clienteNome || `Cliente #${cotacao.clienteId}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tipo de Seguro
                      </p>
                      <p className="font-medium text-foreground text-sm mt-0.5">
                        {cotacao.seguroNome || 'Seguro'} ({formatCurrency(cotacao.valor)})
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Corretor Responsável
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cotacao.corretorNome || 'HCR Corretora'}
                      </p>
                    </div>
                  </div>

                  {/* Área de Proposta */}
                  {hasProposta ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Propostas Vinculadas
                      </p>
                      {cotacao.propostas.map((prop) => {
                        const isPendente = String(prop.situacao || '').toUpperCase() === 'PENDENTE';
                        return (
                          <div
                            key={prop.id}
                            className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-border bg-accent/20 gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">
                                  Proposta #{prop.id} · {formatCurrency(prop.premio ?? prop.valorCotacao ?? cotacao.valor)}
                                </span>
                                <StatusBadge status={prop.situacao} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {prop.condicoes}
                              </p>
                            </div>

                            {isPendente && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResponderProposta(prop.id, true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-success-soft text-success border border-success/30 hover:bg-success hover:text-white transition-colors"
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  Aceitar (Gera apólice)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResponderProposta(prop.id, false)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-white transition-colors"
                                >
                                  <XCircle className="size-3.5" />
                                  Recusar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground italic">
                        Nenhuma proposta elaborada ainda para esta solicitação.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenElaborarProposta(cotacao)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                      >
                        <FileCheck className="size-3.5" />
                        Elaborar proposta
                      </button>
                    </div>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      {/* Modal Nova Cotação */}
      <Modal
        isOpen={isNewCotacaoOpen}
        onClose={() => setIsNewCotacaoOpen(false)}
        title="Nova cotação"
        subtitle="Selecione o cliente solicitante, ramo de cobertura e detalhes do risco."
      >
        <form onSubmit={handleCreateCotacao} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={cotacaoBannerError}
            onClose={() => setCotacaoBannerError(null)}
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Cliente *
            </label>
            <select
              value={cotacaoForm.clienteId}
              onChange={(e) => {
                setCotacaoForm({ ...cotacaoForm, clienteId: e.target.value });
                if (cotacaoErrors.clienteId) setCotacaoErrors({ ...cotacaoErrors, clienteId: null });
              }}
              style={getErrorInputStyle(!!cotacaoErrors.clienteId)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.cpfCnpj})
                </option>
              ))}
            </select>
            <FieldError error={cotacaoErrors.clienteId} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Tipo de Seguro *
            </label>
            <select
              value={cotacaoForm.seguroId}
              onChange={(e) => {
                setCotacaoForm({ ...cotacaoForm, seguroId: e.target.value });
                if (cotacaoErrors.seguroId) setCotacaoErrors({ ...cotacaoErrors, seguroId: null });
              }}
              style={getErrorInputStyle(!!cotacaoErrors.seguroId)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {seguros.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} (a partir de R$ {s.valorBase ?? s.premioBase})
                </option>
              ))}
            </select>
            <FieldError error={cotacaoErrors.seguroId} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Informações para a cotação *
            </label>
            <textarea
              rows={3}
              value={cotacaoForm.informacoesAdicionais}
              onChange={(e) => {
                setCotacaoForm({ ...cotacaoForm, informacoesAdicionais: e.target.value });
                if (cotacaoErrors.informacoesAdicionais) {
                  setCotacaoErrors({ ...cotacaoErrors, informacoesAdicionais: null });
                }
              }}
              style={getErrorInputStyle(!!cotacaoErrors.informacoesAdicionais)}
              placeholder="Descreva os dados do bem/segurado para avaliação de risco..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
            <FieldError error={cotacaoErrors.informacoesAdicionais} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewCotacaoOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Registrar cotação
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Elaborar Proposta */}
      <Modal
        isOpen={isNewPropostaOpen}
        onClose={() => setIsNewPropostaOpen(false)}
        title="Elaborar proposta"
        subtitle={`Para Cotação #${selectedCotacao?.id || ''} · ${selectedCotacao?.clienteNome || ''}`}
      >
        <form onSubmit={handleCreateProposta} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={propostaBannerError}
            onClose={() => setPropostaBannerError(null)}
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Valor do Prêmio (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={propostaForm.premio}
              onChange={(e) => {
                setPropostaForm({ ...propostaForm, premio: e.target.value });
                if (propostaErrors.premio) setPropostaErrors({ ...propostaErrors, premio: null });
              }}
              style={getErrorInputStyle(!!propostaErrors.premio)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
            <FieldError error={propostaErrors.premio} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Condições Oferecidas *
            </label>
            <textarea
              rows={3}
              value={propostaForm.condicoes}
              onChange={(e) => {
                setPropostaForm({ ...propostaForm, condicoes: e.target.value });
                if (propostaErrors.condicoes) setPropostaErrors({ ...propostaErrors, condicoes: null });
              }}
              style={getErrorInputStyle(!!propostaErrors.condicoes)}
              placeholder="Descreva franquia, coberturas inclusas e condições de pagamento..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
            <FieldError error={propostaErrors.condicoes} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewPropostaOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Enviar proposta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
