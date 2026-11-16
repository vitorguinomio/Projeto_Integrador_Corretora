import React, { useState, useEffect } from 'react';
import {
  Umbrella,
  Plus,
  ShieldCheck,
  Check,
  Car,
  Home,
  Heart,
  Building2,
  XCircle
} from 'lucide-react';
import {
  PageHeader,
  Modal,
  FieldError,
  FeedbackBanner,
  getErrorInputStyle
} from './ui/UiBits';
import { apiFetch } from '../api';

export const SegurosTab = ({ currentUser, currentRole }) => {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState(null);

  // Modais
  const [isNewSeguroOpen, setIsNewSeguroOpen] = useState(false);
  const [selectedSeguroForCoverage, setSelectedSeguroForCoverage] = useState(null);

  // Form Novo Seguro (sem valores de teste fixos)
  const [seguroForm, setSeguroForm] = useState({
    nome: '',
    tipo: 'Auto',
    descricao: '',
    premioBase: '',
    coberturasTexto: ''
  });
  const [seguroErrors, setSeguroErrors] = useState({});
  const [seguroBannerError, setSeguroBannerError] = useState(null);

  // Form Nova Cobertura
  const [coverageForm, setCoverageForm] = useState({
    nome: '',
    descricao: '',
    valorLimite: ''
  });
  const [coverageErrors, setCoverageErrors] = useState({});
  const [coverageBannerError, setCoverageBannerError] = useState(null);

  useEffect(() => {
    loadSeguros();
  }, []);

  const loadSeguros = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/seguros').catch(() => []);
      setSeguros(data || []);
    } catch (err) {
      console.error('Erro ao carregar seguros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeguro = async (e) => {
    e.preventDefault();
    setSeguroBannerError(null);

    const errors = {};
    if (!seguroForm.nome || seguroForm.nome.trim().length < 3) {
      errors.nome = 'Informe o nome do produto de seguro.';
    }
    if (!seguroForm.premioBase || Number(seguroForm.premioBase) <= 0) {
      errors.premioBase = 'Informe um prêmio base anual maior que zero.';
    }
    if (!seguroForm.descricao || seguroForm.descricao.trim().length < 5) {
      errors.descricao = 'Informe a descrição do seguro.';
    }

    setSeguroErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSeguroBannerError('Corrija os campos em vermelho antes de cadastrar o seguro.');
      return;
    }

    try {
      const coberturas = seguroForm.coberturasTexto
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((nome) => ({
          nome,
          descricao: nome,
          valor: Number(seguroForm.premioBase) * 10,
          valorLimite: Number(seguroForm.premioBase) * 10
        }));

      const payload = {
        nome: seguroForm.nome.trim(),
        tipo: seguroForm.tipo,
        caracteristicas: seguroForm.tipo,
        descricao: seguroForm.descricao.trim(),
        valorBase: Number(seguroForm.premioBase),
        premioBase: Number(seguroForm.premioBase),
        coberturas
      };

      const novo = await apiFetch('/seguros', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSeguros([...seguros, novo]);
      setIsNewSeguroOpen(false);
      setSeguroForm({
        nome: '',
        tipo: 'Auto',
        descricao: '',
        premioBase: '',
        coberturasTexto: ''
      });
      setSeguroErrors({});
      setPageFeedback({
        type: 'success',
        message: `Seguro "${novo.nome}" cadastrado com sucesso!`
      });
    } catch (err) {
      setSeguroBannerError(err.message || 'Erro ao cadastrar seguro.');
    }
  };

  const handleAddCoverage = async (e) => {
    e.preventDefault();
    setCoverageBannerError(null);

    const errors = {};
    if (!coverageForm.nome || coverageForm.nome.trim().length < 3) {
      errors.nome = 'Informe o nome da cobertura.';
    }
    if (!coverageForm.valorLimite || Number(coverageForm.valorLimite) <= 0) {
      errors.valorLimite = 'Informe um valor limite maior que zero.';
    }

    setCoverageErrors(errors);
    if (Object.keys(errors).length > 0) {
      setCoverageBannerError('Corrija os campos em vermelho antes de salvar a cobertura.');
      return;
    }

    try {
      const payload = {
        nome: coverageForm.nome.trim(),
        descricao: coverageForm.nome.trim(),
        valor: Number(coverageForm.valorLimite),
        valorLimite: Number(coverageForm.valorLimite)
      };

      const novaCob = await apiFetch(`/seguros/${selectedSeguroForCoverage.id}/coberturas`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const updated = seguros.map((s) =>
        s.id === selectedSeguroForCoverage.id
          ? { ...s, coberturas: [...(s.coberturas || []), novaCob] }
          : s
      );
      setSeguros(updated);
      setSelectedSeguroForCoverage(null);
      setCoverageForm({ nome: '', descricao: '', valorLimite: '' });
      setCoverageErrors({});
      setPageFeedback({
        type: 'success',
        message: `Cobertura "${novaCob.nome || novaCob.descricao}" adicionada ao seguro!`
      });
    } catch (err) {
      setCoverageBannerError(err.message || 'Erro ao adicionar cobertura.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const getIconForType = (nome = '', tipo = '') => {
    const text = (nome + ' ' + tipo).toLowerCase();
    if (text.includes('auto') || text.includes('veículo') || text.includes('carro')) return Car;
    if (text.includes('resid') || text.includes('casa') || text.includes('imóvel')) return Home;
    if (text.includes('vida') || text.includes('saúde')) return Heart;
    if (text.includes('empresa') || text.includes('comercial')) return Building2;
    return Umbrella;
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="Gestão"
        title="Seguros e coberturas"
        description="Catálogo de produtos securitários oferecidos pela corretora e suas coberturas associadas."
        actions={
          <button
            onClick={() => {
              setSeguroErrors({});
              setSeguroBannerError(null);
              setIsNewSeguroOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo seguro
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

      {/* Grid de Seguros */}
      <div className="grid gap-6 md:grid-cols-2">
        {seguros.map((seguro) => {
          const Icon = getIconForType(seguro.nome, seguro.tipo || seguro.caracteristicas);
          const premioBase = seguro.valorBase ?? seguro.premioBase ?? 0;
          return (
            <div
              key={seguro.id}
              className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-medium text-lg text-foreground">
                      {seguro.nome}
                    </h3>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {seguro.tipo || 'Geral'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    a partir de
                  </p>
                  <p className="font-display font-semibold text-lg text-foreground tabular leading-tight">
                    {formatCurrency(premioBase)}
                    <span className="text-xs font-normal text-muted-foreground">/ano</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">
                {seguro.descricao}
              </p>

              {/* Coberturas */}
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    Coberturas ({seguro.coberturas?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverageErrors({});
                      setCoverageBannerError(null);
                      setSelectedSeguroForCoverage(seguro);
                    }}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5">
                  {seguro.coberturas && seguro.coberturas.length > 0 ? (
                    seguro.coberturas.map((cob) => {
                      const val = cob.valorLimite ?? cob.valor;
                      return (
                        <div
                          key={cob.id}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-foreground">
                            <Check className="size-3 text-success shrink-0" />
                            {cob.nome || cob.descricao}
                          </span>
                          {val && (
                            <span className="text-muted-foreground font-mono text-[0.7rem]">
                              {formatCurrency(val)}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma cobertura cadastrada ainda.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Seguro */}
      <Modal
        isOpen={isNewSeguroOpen}
        onClose={() => setIsNewSeguroOpen(false)}
        title="Novo seguro"
        subtitle="Cadastre um novo produto da corretora com prêmio base e coberturas."
      >
        <form onSubmit={handleCreateSeguro} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={seguroBannerError}
            onClose={() => setSeguroBannerError(null)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Nome do Seguro *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={seguroForm.nome}
                  onChange={(e) => {
                    setSeguroForm({ ...seguroForm, nome: e.target.value });
                    if (seguroErrors.nome) setSeguroErrors({ ...seguroErrors, nome: null });
                  }}
                  placeholder="Nome comercial do seguro"
                  style={getErrorInputStyle(!!seguroErrors.nome)}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
                />
                {seguroErrors.nome && (
                  <XCircle
                    className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#dc2626' }}
                  />
                )}
              </div>
              <FieldError error={seguroErrors.nome} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Categoria / Ramo
              </label>
              <select
                value={seguroForm.tipo}
                onChange={(e) => setSeguroForm({ ...seguroForm, tipo: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="Auto">Automóvel (Auto)</option>
                <option value="Residencial">Residencial</option>
                <option value="Vida">Vida e Previdência</option>
                <option value="Empresarial">Empresarial</option>
                <option value="Saúde">Saúde</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Prêmio Base Anual (R$) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={seguroForm.premioBase}
                onChange={(e) => {
                  setSeguroForm({ ...seguroForm, premioBase: e.target.value });
                  if (seguroErrors.premioBase) setSeguroErrors({ ...seguroErrors, premioBase: null });
                }}
                placeholder="0.00"
                style={getErrorInputStyle(!!seguroErrors.premioBase)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
              />
              {seguroErrors.premioBase && (
                <XCircle
                  className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#dc2626' }}
                />
              )}
            </div>
            <FieldError error={seguroErrors.premioBase} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Descrição do Produto *
            </label>
            <textarea
              rows={2}
              value={seguroForm.descricao}
              onChange={(e) => {
                setSeguroForm({ ...seguroForm, descricao: e.target.value });
                if (seguroErrors.descricao) setSeguroErrors({ ...seguroErrors, descricao: null });
              }}
              placeholder="Descreva as garantias e perfil deste seguro..."
              style={getErrorInputStyle(!!seguroErrors.descricao)}
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
            <FieldError error={seguroErrors.descricao} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Coberturas Iniciais (uma por linha, opcional)
            </label>
            <textarea
              rows={3}
              value={seguroForm.coberturasTexto}
              onChange={(e) => setSeguroForm({ ...seguroForm, coberturasTexto: e.target.value })}
              placeholder="Digite cada cobertura em uma linha..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewSeguroOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Cadastrar seguro
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Adicionar Cobertura */}
      <Modal
        isOpen={!!selectedSeguroForCoverage}
        onClose={() => setSelectedSeguroForCoverage(null)}
        title="Adicionar cobertura"
        subtitle={`Para o produto: ${selectedSeguroForCoverage?.nome || ''}`}
      >
        <form onSubmit={handleAddCoverage} noValidate className="space-y-4">
          <FeedbackBanner
            type="error"
            message={coverageBannerError}
            onClose={() => setCoverageBannerError(null)}
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Nome da Cobertura *
            </label>
            <div className="relative">
              <input
                type="text"
                value={coverageForm.nome}
                onChange={(e) => {
                  setCoverageForm({ ...coverageForm, nome: e.target.value });
                  if (coverageErrors.nome) setCoverageErrors({ ...coverageErrors, nome: null });
                }}
                placeholder="Nome da cobertura"
                style={getErrorInputStyle(!!coverageErrors.nome)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
              />
              {coverageErrors.nome && (
                <XCircle
                  className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#dc2626' }}
                />
              )}
            </div>
            <FieldError error={coverageErrors.nome} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Valor / Limite de Indenização (R$) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={coverageForm.valorLimite}
                onChange={(e) => {
                  setCoverageForm({ ...coverageForm, valorLimite: e.target.value });
                  if (coverageErrors.valorLimite) setCoverageErrors({ ...coverageErrors, valorLimite: null });
                }}
                placeholder="0.00"
                style={getErrorInputStyle(!!coverageErrors.valorLimite)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 pr-9 text-sm"
              />
              {coverageErrors.valorLimite && (
                <XCircle
                  className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#dc2626' }}
                />
              )}
            </div>
            <FieldError error={coverageErrors.valorLimite} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setSelectedSeguroForCoverage(null)}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Salvar cobertura
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
