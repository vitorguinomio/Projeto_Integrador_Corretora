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
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal, useFeedback } from './ui/UiBits';
import { apiFetch } from '../api';
import { pode } from '../permissoes';
import { mapCotacao, mapProposta, mapSeguro } from '../mappers';
export const CotacoesTab = ({ currentUser, currentRole }) => {
  const isCliente = currentRole === 'cliente';
  const { showSuccess, showError, showWarning, showInfo } = useFeedback();
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
    valor: ''
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
      const [cotacoesData, propostasData, clientesData, segurosData] = await Promise.all([
        apiFetch('/cotacoes').catch(() => []),
        apiFetch('/propostas').catch(() => []),
        isCliente ? [] : apiFetch('/clientes').catch(() => []),
        apiFetch('/seguros').catch(() => [])
      ]);
      setCotacoes((cotacoesData || []).map((c) => mapCotacao(c, propostasData || [])));
      setClientes(clientesData || []);
      setSeguros((segurosData || []).map(mapSeguro));
      // O cliente solicita cotação sempre para si mesmo
      const clientePadrao = isCliente ? currentUser?.clienteId : clientesData?.[0]?.id;
      if (clientePadrao && segurosData?.length) {
        setCotacaoForm({
          clienteId: clientePadrao,
          seguroId: segurosData[0].id,
          valor: segurosData[0].valorBase ?? ''
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
      showWarning('Selecione o cliente e o seguro para registrar a cotação.', 'Campos obrigatórios');
      return;
    }
    try {
      const seguro = seguros.find((s) => String(s.id) === String(cotacaoForm.seguroId));
      // Formato de CotacaoRequest (backend): o corretor é o usuário logado, quando for corretor
      const payload = {
        clienteId: Number(cotacaoForm.clienteId),
        seguroId: Number(cotacaoForm.seguroId),
        corretorId: currentUser?.corretorId ?? null,
        valor: cotacaoForm.valor !== '' ? Number(cotacaoForm.valor) : seguro?.premioBase ?? null,
        situacao: 'SOLICITADA'
      };
      const nova = await apiFetch('/cotacoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCotacoes([mapCotacao(nova), ...cotacoes]);
      setIsNewCotacaoOpen(false);
      setCotacaoForm((prev) => ({ ...prev, valor: '' }));
      showSuccess('A cotação foi registrada com sucesso.', 'Cotação registrada!');
    } catch (err) {
      showError(err.message, 'Erro ao registrar cotação');
    }
  };
  const handleOpenElaborarProposta = (cotacao) => {
    setSelectedCotacao(cotacao);
    const seg = seguros.find((s) => s.nome === cotacao.seguroNome);
    setPropostaForm({
      premio: cotacao.valor || seg?.premioBase || 0,
      condicoes: 'Cobertura total e assistência 24h com franquia reduzida.'
    });
    setIsNewPropostaOpen(true);
  };
  const handleCreateProposta = async (e) => {
    e.preventDefault();
    try {
      // Formato de PropostaRequest (backend); o valor da proposta é o valor da cotação
      const payload = {
        cotacaoId: selectedCotacao.id,
        condicoes: propostaForm.condicoes,
        situacao: 'PENDENTE'
      };
      const novaProp = await apiFetch('/propostas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      // Atualiza na cotação
      const updated = cotacoes.map((c) =>
        c.id === selectedCotacao.id
          ? { ...c, propostas: [...(c.propostas || []), mapProposta(novaProp)] }
          : c
      );
      setCotacoes(updated);
      setIsNewPropostaOpen(false);
      showSuccess('A proposta foi elaborada e enviada para o cliente.', 'Proposta enviada!');
    } catch (err) {
      showError(err.message, 'Erro ao criar proposta');
    }
  };

  const handleResponderProposta = async (propostaId, aceita) => {
    try {
      const endpoint = aceita ? `/propostas/${propostaId}/aceitar` : `/propostas/${propostaId}/recusar`;
      await apiFetch(endpoint, {
        method: 'POST'
      });
      if (aceita) {
        showSuccess('A cotação foi aprovada. Registre a contratação na tela de Apólices.', 'Proposta aceita!');
      } else {
        showInfo('A proposta foi registrada como recusada pelo cliente.', 'Proposta recusada');
      }
      loadData();
    } catch (err) {
      showError(err.message, 'Erro ao responder proposta');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        eyebrow="Vendas"
        title={isCliente ? 'Minhas cotações' : 'Cotações e propostas'}
        description={
          isCliente
            ? 'Solicite cotações, acompanhe as propostas recebidas e responda a cada uma.'
            : 'Da solicitação ao aceite: crie cotações, elabore propostas e acompanhe a resposta do cliente.'
        }
        actions={
          <button
            onClick={() => setIsNewCotacaoOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            {isCliente ? 'Solicitar cotação' : 'Nova cotação'}
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
                    <span className="font-medium text-base text-foreground">
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
                      <p className="text-xs font-semibold text-muted-foreground">
                        Cliente
                      </p>
                      <p className="font-medium text-foreground text-sm mt-0.5">
                        {cotacao.clienteNome || `Cliente #${cotacao.clienteId}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Tipo de Seguro
                      </p>
                      <p className="font-medium text-foreground text-sm mt-0.5">
                        {cotacao.seguroNome || 'Seguro'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Valor cotado · Corretor
                      </p>
                      <p className="font-medium text-foreground text-sm mt-0.5">
                        {formatCurrency(cotacao.valor)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cotacao.corretorNome || 'Corretor não atribuído'}
                      </p>
                    </div>
                  </div>

                  {/* Área de Proposta */}
                  {hasProposta ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-primary">
                        Propostas Vinculadas
                      </p>
                      {cotacao.propostas.map((prop) => (
                        <div
                          key={prop.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-accent/20 gap-3"
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

                          {prop.situacao === 'Pendente' && pode(currentRole, 'responderProposta') && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResponderProposta(prop.id, true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-success-soft text-success border border-success/30 hover:bg-success hover:text-white transition-colors"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Aceitar
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
                      {pode(currentRole, 'elaborarProposta') && (
                      <button
                        onClick={() => handleOpenElaborarProposta(cotacao)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                      >
                        <FileCheck className="size-3.5" />
                        Elaborar proposta
                      </button>
                      )}
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
          {!isCliente && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Valor estimado da cotação (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={cotacaoForm.valor}
              onChange={(e) => setCotacaoForm({ ...cotacaoForm, valor: e.target.value })}
              placeholder="Se vazio, usa o prêmio base do seguro"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Valor do Prêmio (valor da cotação)
            </label>
            <p className="h-10 flex items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-semibold">
              {formatCurrency(propostaForm.premio)}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
