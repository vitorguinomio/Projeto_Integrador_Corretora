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
  Briefcase,
  Pencil,
  Search,
  Trash2
} from 'lucide-react';
import { PageHeader, StatusBadge, SectionCard, EmptyState, Modal, useFeedback } from './ui/UiBits';
import { apiFetch } from '../api';
import { pode } from '../permissoes';
import { mapCobertura, mapSeguro } from '../mappers';
export const SegurosTab = ({ currentUser, currentRole }) => {
  const podeGerenciar = pode(currentRole, 'gerenciarSeguros');
  const { showSuccess, showError, showWarning, confirm } = useFeedback();
  const [busca, setBusca] = useState('');
  const [editingCobertura, setEditingCobertura] = useState(null); // null = nova cobertura
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isNewSeguroOpen, setIsNewSeguroOpen] = useState(false);
  const [editingSeguro, setEditingSeguro] = useState(null); // null = cadastro novo
  const [selectedSeguroForCoverage, setSelectedSeguroForCoverage] = useState(null);

  // Form Novo Seguro
  const [seguroForm, setSeguroForm] = useState({
    nome: '',
    tipo: 'Auto',
    descricao: '',
    premioBase: '',
    comissao: '',
    coberturasTexto: 'Colisão e roubo\nDanos a terceiros\nAssistência 24h guincho'
  });

  // Form Nova Cobertura
  const [coverageForm, setCoverageForm] = useState({
    nome: '',
    descricao: '',
    valorLimite: 50000
  });

  useEffect(() => {
    loadSeguros();
  }, []);
  const loadSeguros = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/seguros').catch(() => []);
      setSeguros((data || []).map(mapSeguro));
    } catch (err) {
      console.error('Erro ao carregar seguros:', err);
    } finally {
      setLoading(false);
    }
  };

  const COBERTURAS_EXEMPLO = 'Colisão e roubo\nDanos a terceiros\nAssistência 24h guincho';

  const abrirCadastro = () => {
    setEditingSeguro(null);
    setSeguroForm({ nome: '', tipo: 'Auto', descricao: '', premioBase: '', comissao: '', coberturasTexto: COBERTURAS_EXEMPLO });
    setIsNewSeguroOpen(true);
  };

  const abrirEdicao = (seguro) => {
    setEditingSeguro(seguro);
    setSeguroForm({
      nome: seguro.nome || '',
      tipo: seguro.tipo || 'Auto',
      descricao: seguro.descricao || '',
      premioBase: seguro.premioBase ?? '',
      comissao: seguro.percentualComissao ?? '',
      coberturasTexto: ''
    });
    setIsNewSeguroOpen(true);
  };

  // Edição: altera nome, descrição e prêmio base; as coberturas são mantidas
  // (o backend só troca a lista quando ela é enviada)
  const handleEditSeguro = async () => {
    try {
      const atualizado = await apiFetch(`/seguros/${editingSeguro.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: seguroForm.nome,
          descricao: seguroForm.descricao || editingSeguro.descricao,
          caracteristicas: editingSeguro.caracteristicas,
          valorBase: Number(seguroForm.premioBase),
          percentualComissao: Number(seguroForm.comissao) || 0
        })
      });
      setSeguros(seguros.map((s) => (s.id === atualizado.id ? mapSeguro(atualizado) : s)));
      setIsNewSeguroOpen(false);
      setEditingSeguro(null);
      showSuccess(`Os dados de ${atualizado.nome} foram atualizados.`, 'Seguro atualizado!');
    } catch (err) {
      showError(err.message, 'Erro ao atualizar seguro');
    }
  };

  const handleCreateSeguro = async (e) => {
    e.preventDefault();
    if (!seguroForm.nome || !seguroForm.premioBase) {
      showWarning('Preencha os campos obrigatórios (*).', 'Campos obrigatórios');
      return;
    }
    if (editingSeguro) {
      await handleEditSeguro();
      return;
    }
    try {
      const coberturas = seguroForm.coberturasTexto
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((descricao) => ({ descricao, valor: null }));
      const payload = {
        nome: seguroForm.nome,
        descricao: seguroForm.descricao || `Seguro ${seguroForm.nome} com proteção completa HCR.`,
        caracteristicas: coberturas.map((c) => c.descricao).join(', '),
        valorBase: Number(seguroForm.premioBase),
        percentualComissao: Number(seguroForm.comissao) || 0,
        coberturas
      };
      const novo = await apiFetch('/seguros', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSeguros([...seguros, mapSeguro(novo)]);
      setIsNewSeguroOpen(false);
      setSeguroForm({
        nome: '',
        tipo: 'Auto',
        descricao: '',
        premioBase: '',
        comissao: '',
        coberturasTexto: 'Colisão e roubo\nDanos a terceiros\nAssistência 24h guincho'
      });
      showSuccess('O seguro foi cadastrado com sucesso.', 'Seguro cadastrado!');
    } catch (err) {
      showError(err.message, 'Erro ao cadastrar seguro');
    }
  };

  const abrirNovaCobertura = (seguro) => {
    setEditingCobertura(null);
    setCoverageForm({ nome: '', descricao: '', valorLimite: '' });
    setSelectedSeguroForCoverage(seguro);
  };

  const abrirEdicaoCobertura = (seguro, cobertura) => {
    setEditingCobertura(cobertura);
    setCoverageForm({ nome: cobertura.nome || '', descricao: '', valorLimite: cobertura.valorLimite ?? '' });
    setSelectedSeguroForCoverage(seguro);
  };

  const substituirCoberturas = (seguroId, transformar) =>
    setSeguros((lista) => lista.map((s) => (s.id === seguroId ? { ...s, coberturas: transformar(s.coberturas || []) } : s)));

  const removerCobertura = async (seguro, cobertura) => {
    const ok = await confirm({
      title: 'Excluir cobertura?',
      message: `A cobertura "${cobertura.nome}" será removida do ${seguro.nome}.`,
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      await apiFetch(`/seguros/coberturas/${cobertura.id}`, { method: 'DELETE' });
      substituirCoberturas(seguro.id, (cobs) => cobs.filter((c) => c.id !== cobertura.id));
      showSuccess(`A cobertura "${cobertura.nome}" foi removida.`, 'Cobertura excluída');
    } catch (err) {
      showError(err.message, 'Erro ao excluir cobertura');
    }
  };

  const handleAddCoverage = async (e) => {
    e.preventDefault();
    if (!coverageForm.nome) {
      showWarning('Informe o nome da cobertura para continuar.', 'Nome obrigatório');
      return;
    }
    try {
      const payload = {
        descricao: coverageForm.nome,
        valor: Number(coverageForm.valorLimite) || null
      };
      const salva = await apiFetch(
        editingCobertura ? `/seguros/coberturas/${editingCobertura.id}` : `/seguros/${selectedSeguroForCoverage.id}/coberturas`,
        { method: editingCobertura ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      const cobertura = mapCobertura(salva);
      substituirCoberturas(selectedSeguroForCoverage.id, (cobs) =>
        editingCobertura ? cobs.map((c) => (c.id === cobertura.id ? cobertura : c)) : [...cobs, cobertura]
      );
      setSelectedSeguroForCoverage(null);
      setCoverageForm({ nome: '', descricao: '', valorLimite: '' });
      showSuccess(
        editingCobertura ? `A cobertura "${cobertura.nome}" foi atualizada.` : 'A cobertura foi adicionada ao seguro.',
        editingCobertura ? 'Cobertura atualizada!' : 'Cobertura adicionada!'
      );
      setEditingCobertura(null);
    } catch (err) {
      showError(err.message, editingCobertura ? 'Erro ao atualizar cobertura' : 'Erro ao adicionar cobertura');
    }
  };

  const termo = busca.trim().toLowerCase();
  const segurosFiltrados = !termo
    ? seguros
    : seguros.filter((s) =>
        [s.nome, s.descricao, s.caracteristicas, ...(s.coberturas || []).map((c) => c.nome)]
          .filter(Boolean)
          .some((texto) => texto.toLowerCase().includes(termo))
      );

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        eyebrow="Gestão"
        title="Seguros e coberturas"
        description="Catálogo de produtos securitários oferecidos pela corretora e suas coberturas associadas."
        actions={
          podeGerenciar && (
          <button
            onClick={abrirCadastro}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Novo seguro
          </button>
          )
        }
      />

      {/* Busca (RF25) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquise por nome, descrição ou cobertura…"
          aria-label="Pesquisar seguros"
          className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
        />
      </div>

      {segurosFiltrados.length === 0 && !loading && (
        <SectionCard>
          <EmptyState title="Nenhum seguro encontrado" text="Tente outro termo de busca." />
        </SectionCard>
      )}

      {/* Grid de Seguros */}
      <div className="grid gap-6 md:grid-cols-2">
        {segurosFiltrados.map((seguro) => {
          const Icon = getIconForType(seguro.nome, seguro.tipo);
          return (
            <div
              key={seguro.id}
              className="rounded-lg border border-border bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-medium text-lg text-foreground">
                      {seguro.nome}
                    </h3>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {seguro.tipo || 'Geral'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                <div className="text-right">
                  <p className="text-[0.65rem] text-muted-foreground">
                    a partir de
                  </p>
                  <p className="font-semibold text-lg text-foreground tabular-nums leading-tight">
                    {formatCurrency(seguro.premioBase)}
                    <span className="text-xs font-normal text-muted-foreground">/ano</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    comissão {Number(seguro.percentualComissao || 0).toLocaleString('pt-BR')}%
                  </p>
                </div>
                {podeGerenciar && (
                  <button
                    type="button"
                    onClick={() => abrirEdicao(seguro)}
                    title="Editar seguro"
                    aria-label={`Editar seguro ${seguro.nome}`}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">
                {seguro.descricao}
              </p>

              {/* Coberturas */}
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    Coberturas ({seguro.coberturas?.length || 0})
                  </span>
                  {podeGerenciar && (
                  <button
                    onClick={() => abrirNovaCobertura(seguro)}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    Adicionar
                  </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {seguro.coberturas && seguro.coberturas.length > 0 ? (
                    seguro.coberturas.map((cob) => (
                      <div
                        key={cob.id}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-foreground">
                          <Check className="size-3 text-success shrink-0" />
                          {cob.nome}
                        </span>
                        <span className="flex items-center gap-1">
                          {cob.valorLimite ? (
                            <span className="text-muted-foreground font-mono text-[0.7rem]">
                              {formatCurrency(cob.valorLimite)}
                            </span>
                          ) : null}
                          {podeGerenciar && (
                            <>
                              <button
                                type="button"
                                onClick={() => abrirEdicaoCobertura(seguro, cob)}
                                title="Editar cobertura"
                                aria-label={`Editar cobertura ${cob.nome}`}
                                className="ml-1 rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                              >
                                <Pencil className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removerCobertura(seguro, cob)}
                                title="Excluir cobertura"
                                aria-label={`Excluir cobertura ${cob.nome}`}
                                className="rounded p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </>
                          )}
                        </span>
                      </div>
                    ))
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
        title={editingSeguro ? 'Editar seguro' : 'Novo seguro'}
        subtitle={
          editingSeguro
            ? 'Altere nome, descrição e prêmio base. As coberturas são gerenciadas no card do seguro.'
            : 'Cadastre um novo produto da corretora com prêmio base e coberturas.'
        }
      >
        <form onSubmit={handleCreateSeguro} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nome do Seguro *
              </label>
              <input
                type="text"
                required
                value={seguroForm.nome}
                onChange={(e) => setSeguroForm({ ...seguroForm, nome: e.target.value })}
                placeholder="Ex: Seguro Residencial Premium"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Prêmio Base Anual (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={seguroForm.premioBase}
                onChange={(e) => setSeguroForm({ ...seguroForm, premioBase: e.target.value })}
                placeholder="Ex: 1800.00"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Comissão da corretora (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={seguroForm.comissao}
                onChange={(e) => setSeguroForm({ ...seguroForm, comissao: e.target.value })}
                placeholder="Ex: 15"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Descrição do Produto
            </label>
            <textarea
              rows={2}
              value={seguroForm.descricao}
              onChange={(e) => setSeguroForm({ ...seguroForm, descricao: e.target.value })}
              placeholder="Descreva as vantagens e público alvo deste seguro..."
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
          </div>

          {!editingSeguro && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Coberturas Iniciais (uma por linha)
            </label>
            <textarea
              rows={4}
              value={seguroForm.coberturasTexto}
              onChange={(e) => setSeguroForm({ ...seguroForm, coberturasTexto: e.target.value })}
              placeholder="Colisão e roubo&#10;Danos a terceiros&#10;Assistência 24h"
              className="w-full rounded-md border border-input bg-card p-3 text-sm font-mono text-xs"
            />
          </div>
          )}

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
              {editingSeguro ? 'Salvar alterações' : 'Cadastrar seguro'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Adicionar Cobertura */}
      <Modal
        isOpen={!!selectedSeguroForCoverage}
        onClose={() => {
          setSelectedSeguroForCoverage(null);
          setEditingCobertura(null);
        }}
        title={editingCobertura ? 'Editar cobertura' : 'Adicionar cobertura'}
        subtitle={`Para o produto: ${selectedSeguroForCoverage?.nome}`}
      >
        <form onSubmit={handleAddCoverage} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nome da Cobertura *
            </label>
            <input
              type="text"
              required
              value={coverageForm.nome}
              onChange={(e) => setCoverageForm({ ...coverageForm, nome: e.target.value })}
              placeholder="Ex: Carro Reserva 30 Dias"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Valor da Cobertura (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={coverageForm.valorLimite}
              onChange={(e) => setCoverageForm({ ...coverageForm, valorLimite: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
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
              {editingCobertura ? 'Salvar alterações' : 'Salvar cobertura'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
