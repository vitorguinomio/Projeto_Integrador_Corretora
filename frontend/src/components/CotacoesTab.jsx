import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  User,
  Shield,
  AlertCircle
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal } from './ui/UiBits';
import { apiFetch } from '../api';

export const CotacoesTab = ({ currentUser, currentRole }) => {
  const [cotacoes, setCotacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Form Nova Proposta
  const [propostaForm, setPropostaForm] = useState({
    premio: '',
    condicoes: 'Cobertura compreensiva 100% tabela FIPE com assistência 24h e carro reserva por 15 dias.'
  });

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
        setCotacaoForm({
          clienteId: clientesData[0].id,
          seguroId: segurosData[0].id,
          informacoesAdicionais: ''
        });
      }
    } catch (err) {
      console.error('Erro ao carregar cotações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCotacao = async (e) => {
    e.preventDefault();
    if (!cotacaoForm.clienteId || !cotacaoForm.seguroId) {
      alert('Selecione cliente e seguro.');
      return;
    }
    try {
      const payload = {
        clienteId: Number(cotacaoForm.clienteId),
        seguroId: Number(cotacaoForm.seguroId),
        informacoesAdicionais: cotacaoForm.informacoesAdicionais || 'Solicitação de cotação padrão.'
      };

      const nova = await apiFetch('/cotacoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCotacoes([nova, ...cotacoes]);
      setIsNewCotacaoOpen(false);
      setCotacaoForm((prev) => ({ ...prev, informacoesAdicionais: '' }));
      alert('Cotação registrada com sucesso!');
    } catch (err) {
      alert(`Erro ao registrar cotação: ${err.message}`);
    }
  };

  const handleOpenElaborarProposta = (cotacao) => {
    setSelectedCotacao(cotacao);
    const seg = seguros.find((s) => s.nome === cotacao.seguroNome);
    setPropostaForm({
      premio: seg?.premioBase || 2500,
      condicoes: 'Cobertura total e assistência 24h com franquia reduzida.'
    });
    setIsNewPropostaOpen(true);
  };

  const handleCreateProposta = async (e) => {
    e.preventDefault();
    if (!propostaForm.premio) {
      alert('Informe o valor do prêmio.');
      return;
    }
    try {
      const payload = {
        cotacaoId: selectedCotacao.id,
        premio: Number(propostaForm.premio),
        condicoes: propostaForm.condicoes
      };

      const novaProp = await apiFetch('/propostas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Atualiza na cotação
      const updated = cotacoes.map((c) =>
        c.id === selectedCotacao.id
          ? { ...c, situacao: 'Em análise', propostas: [...(c.propostas || []), novaProp] }
          : c
      );
      setCotacoes(updated);
      setIsNewPropostaOpen(false);
      alert('Proposta elaborada e enviada para o cliente!');
    } catch (err) {
      alert(`Erro ao criar proposta: ${err.message}`);
    }
  };

  const handleResponderProposta = async (propostaId, aceita) => {
    try {
      const endpoint = aceita ? `/propostas/${propostaId}/aceitar` : `/propostas/${propostaId}/recusar`;
      await apiFetch(endpoint, {
        method: 'POST'
      });
      alert(
        aceita
          ? 'Proposta ACEITA! A apólice e suas parcelas foram geradas automaticamente no sistema.'
          : 'Proposta recusada pelo cliente.'
      );
      loadData();
    } catch (err) {
      alert(`Erro ao responder proposta: ${err.message}`);
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
            onClick={() => setIsNewCotacaoOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Nova cotação
          </button>
        }
      />

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
                    Solicitada em: {cotacao.dataCotacao}
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
                        {cotacao.seguroNome || 'Seguro'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Informações Fornecidas
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cotacao.informacoesAdicionais || 'Sem observações adicionais.'}
                      </p>
                    </div>
                  </div>

                  {/* Área de Proposta */}
                  {hasProposta ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Propostas Vinculadas
                      </p>
                      {cotacao.propostas.map((prop) => (
                        <div
                          key={prop.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-border bg-accent/20 gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                Proposta #{prop.id} · {formatCurrency(prop.premio)}
                              </span>
                              <StatusBadge status={prop.situacao} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {prop.condicoes}
                            </p>
                          </div>

                          {prop.situacao === 'Pendente' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResponderProposta(prop.id, true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-success-soft text-success border border-success/30 hover:bg-success hover:text-white transition-colors"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Aceitar (Gera apólice)
                              </button>
                              <button
                                onClick={() => handleResponderProposta(prop.id, false)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-white transition-colors"
                              >
                                <XCircle className="size-3.5" />
                                Recusar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground italic">
                        Nenhuma proposta elaborada ainda para esta solicitação.
                      </p>
                      <button
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
        <form onSubmit={handleCreateCotacao} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Cliente *
            </label>
            <select
              value={cotacaoForm.clienteId}
              onChange={(e) => setCotacaoForm({ ...cotacaoForm, clienteId: e.target.value })}
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
              Tipo de Seguro *
            </label>
            <select
              value={cotacaoForm.seguroId}
              onChange={(e) => setCotacaoForm({ ...cotacaoForm, seguroId: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {seguros.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} (a partir de R$ {s.premioBase})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Informações para a cotação *
            </label>
            <textarea
              required
              rows={3}
              value={cotacaoForm.informacoesAdicionais}
              onChange={(e) => setCotacaoForm({ ...cotacaoForm, informacoesAdicionais: e.target.value })}
              placeholder="Ex: Veículo Toyota Corolla 2024, CEP pernoite 70000-000, motorista 35 anos..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
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
        subtitle={`Para Cotação #${selectedCotacao?.id} · ${selectedCotacao?.clienteNome}`}
      >
        <form onSubmit={handleCreateProposta} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Valor do Prêmio (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={propostaForm.premio}
              onChange={(e) => setPropostaForm({ ...propostaForm, premio: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Condições Oferecidas *
            </label>
            <textarea
              required
              rows={3}
              value={propostaForm.condicoes}
              onChange={(e) => setPropostaForm({ ...propostaForm, condicoes: e.target.value })}
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
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
