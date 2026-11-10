import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function ApolicesTab() {
  const [apolices, setApolices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [termo, setTermo] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modais
  const [modalNovaApolice, setModalNovaApolice] = useState(false);
  const [modalRenovacao, setModalRenovacao] = useState(null);
  const [modalParcelas, setModalParcelas] = useState(null);

  // Form Nova Apólice
  const [numeroApolice, setNumeroApolice] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [corretorId, setCorretorId] = useState('');
  const [seguroId, setSeguroId] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().substring(0, 10));
  const [dataTermino, setDataTermino] = useState(new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0, 10));
  const [valorPremio, setValorPremio] = useState('2000.00');
  const [qtdParcelas, setQtdParcelas] = useState('12');

  // Form Renovação
  const [novaDataInicio, setNovaDataInicio] = useState('');
  const [novaDataTermino, setNovaDataTermino] = useState('');
  const [novoValorPremio, setNovoValorPremio] = useState('');

  const carregarApolices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (termo) params.append('termo', termo);
      if (filtroSituacao) params.append('situacao', filtroSituacao);
      const data = await apiFetch(`/apolices?${params.toString()}`);
      setApolices(data);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const carregarApoio = async () => {
    try {
      const [cls, cors, segs] = await Promise.all([
        apiFetch('/clientes'),
        apiFetch('/corretores'),
        apiFetch('/seguros')
      ]);
      setClientes(cls);
      setCorretores(cors);
      setSeguros(segs);
      if (cls.length > 0 && !clienteId) setClienteId(cls[0].id);
      if (cors.length > 0 && !corretorId) setCorretorId(cors[0].id);
      if (segs.length > 0 && !seguroId) setSeguroId(segs[0].id);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    carregarApolices();
    carregarApoio();
  }, [filtroSituacao]);

  const abrirNova = () => {
    setNumeroApolice('');
    setDataInicio(new Date().toISOString().substring(0, 10));
    setDataTermino(new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0, 10));
    setModalNovaApolice(true);
  };

  const salvarNovaApolice = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/apolices', {
        method: 'POST',
        body: JSON.stringify({
          numeroApolice: numeroApolice || undefined,
          clienteId: Number(clienteId),
          corretorId: Number(corretorId),
          seguroId: Number(seguroId),
          dataInicio,
          dataTermino,
          valorPremio: Number(valorPremio),
          quantidadeParcelas: Number(qtdParcelas)
        })
      });
      setFeedback({ tipo: 'sucesso', texto: 'Apólice emitida e parcelas geradas com sucesso! (RF12/RF21)' });
      setModalNovaApolice(false);
      carregarApolices();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const abrirRenovacao = (a) => {
    setModalRenovacao(a);
    const dtInicio = a.dataTermino || new Date().toISOString().substring(0, 10);
    const dtFim = new Date(new Date(dtInicio).getTime() + 365*24*60*60*1000).toISOString().substring(0, 10);
    setNovaDataInicio(dtInicio);
    setNovaDataTermino(dtFim);
    setNovoValorPremio(a.valorPremio?.toString() || '2000.00');
  };

  const executarRenovacao = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/apolices/${modalRenovacao.id}/renovar`, {
        method: 'POST',
        body: JSON.stringify({
          novaDataInicio,
          novaDataTermino,
          novoValorPremio: Number(novoValorPremio),
          quantidadeParcelas: 12
        })
      });
      setFeedback({ tipo: 'sucesso', texto: 'Apólice renovada com sucesso! Histórico preservado (RF22, EU16).' });
      setModalRenovacao(null);
      carregarApolices();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const cancelarApolice = async (a) => {
    if (!window.confirm(`Deseja cancelar a apólice ${a.numeroApolice}? O registro continuará no sistema como CANCELADA (RF23).`)) return;
    try {
      await apiFetch(`/apolices/${a.id}/cancelar`, { method: 'POST' });
      setFeedback({ tipo: 'sucesso', texto: `Apólice ${a.numeroApolice} cancelada com sucesso.` });
      carregarApolices();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const verParcelas = async (a) => {
    try {
      const parcelas = await apiFetch(`/apolices/${a.id}/parcelas`);
      setModalParcelas({ apolice: a, itens: parcelas });
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const atualizarStatusParcela = async (parcelaId, novoStatus) => {
    try {
      await apiFetch(`/apolices/parcelas/${parcelaId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus })
      });
      // atualizar lista
      const parcelas = await apiFetch(`/apolices/${modalParcelas.apolice.id}/parcelas`);
      setModalParcelas({ ...modalParcelas, itens: parcelas });
      setFeedback({ tipo: 'sucesso', texto: `Parcela atualizada para ${novoStatus} (EU28).` });
      carregarApolices();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Contratos & Apólices de Seguros (RF12 - RF16, RF21 - RF23)</h2>
        <button style={styles.button('success')} onClick={abrirNova}>+ Emitir Nova Apólice</button>
      </div>

      {feedback && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          backgroundColor: feedback.tipo === 'erro' ? '#fee2e2' : '#dcfce7',
          color: feedback.tipo === 'erro' ? '#b91c1c' : '#15803d'
        }}>
          {feedback.texto}
        </div>
      )}

      <div style={{ ...styles.card, padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder="Pesquisar por Número da Apólice ou Nome do Cliente..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && carregarApolices()}
        />
        <select style={{ ...styles.input, width: '180px' }} value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)}>
          <option value="">Todas Situações</option>
          <option value="ATIVA">ATIVA</option>
          <option value="VENCIDA">VENCIDA</option>
          <option value="EM_RENOVACAO">EM_RENOVACAO</option>
          <option value="CANCELADA">CANCELADA</option>
        </select>
        <button style={styles.button('primary')} onClick={carregarApolices}>Buscar</button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Número</th>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>Corretor</th>
              <th style={styles.th}>Seguro</th>
              <th style={styles.th}>Vigência (Início / Fim)</th>
              <th style={styles.th}>Prêmio Total</th>
              <th style={styles.th}>Situação</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {apolices.map(a => (
              <tr key={a.id}>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                  {a.numeroApolice}
                  {a.idApoliceAnterior && <div style={{ fontSize: '11px', color: '#64748b' }}>Renovação da #{a.idApoliceAnterior}</div>}
                </td>
                <td style={styles.td}>{a.clienteNome}</td>
                <td style={styles.td}>{a.corretorNome}</td>
                <td style={styles.td}>{a.seguroNome}</td>
                <td style={styles.td}>{a.dataInicio} até {a.dataTermino}</td>
                <td style={styles.td}>R$ {a.valorPremio?.toFixed(2)}</td>
                <td style={styles.td}><span style={styles.badge(a.situacao)}>{a.situacao}</span></td>
                <td style={styles.td}>
                  <button style={styles.button('primary')} onClick={() => verParcelas(a)}>Parcelas</button>
                  {a.situacao === 'ATIVA' && (
                    <>
                      <button style={styles.button('warning')} onClick={() => abrirRenovacao(a)}>Renovar</button>
                      <button style={styles.button('danger')} onClick={() => cancelarApolice(a)}>Cancelar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {apolices.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  Nenhuma apólice encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Apólice */}
      {modalNovaApolice && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Emissão de Contrato de Apólice (RF12, RF21)</h3>
            <form onSubmit={salvarNovaApolice}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Número da Apólice (deixe em branco para gerar auto)</label>
                <input style={styles.input} placeholder="Ex: APO-2026-AUTO-999" value={numeroApolice} onChange={(e) => setNumeroApolice(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cliente Segurado *</label>
                  <select style={styles.input} required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                    {clientes.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Corretor Responsável *</label>
                  <select style={styles.input} required value={corretorId} onChange={(e) => setCorretorId(e.target.value)}>
                    {corretores.map(cr => (
                      <option key={cr.id} value={cr.id}>{cr.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tipo de Seguro *</label>
                <select
                  style={styles.input}
                  required
                  value={seguroId}
                  onChange={(e) => {
                    setSeguroId(e.target.value);
                    const s = seguros.find(x => x.id === Number(e.target.value));
                    if (s) setValorPremio(s.valorBase);
                  }}
                >
                  {seguros.map(sg => (
                    <option key={sg.id} value={sg.id}>{sg.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Início da Vigência *</label>
                  <input type="date" style={styles.input} required value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Término da Vigência *</label>
                  <input type="date" style={styles.input} required value={dataTermino} onChange={(e) => setDataTermino(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Valor do Prêmio (R$) *</label>
                  <input type="number" step="0.01" style={styles.input} required value={valorPremio} onChange={(e) => setValorPremio(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Qtd. de Parcelas</label>
                  <input type="number" min="1" max="24" style={styles.input} required value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalNovaApolice(false)}>Cancelar</button>
                <button type="submit" style={styles.button('success')}>Emitir Apólice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Renovação */}
      {modalRenovacao && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Renovação de Contrato (RF22, EU16)</h3>
            <p style={{ margin: '4px 0 12px', color: '#475569' }}>
              <strong>Apólice Atual:</strong> {modalRenovacao.numeroApolice} | <strong>Cliente:</strong> {modalRenovacao.clienteNome}
            </p>
            <form onSubmit={executarRenovacao}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nova Data de Início *</label>
                  <input type="date" style={styles.input} required value={novaDataInicio} onChange={(e) => setNovaDataInicio(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nova Data de Término *</label>
                  <input type="date" style={styles.input} required value={novaDataTermino} onChange={(e) => setNovaDataTermino(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Novo Valor do Prêmio (R$)</label>
                <input type="number" step="0.01" style={styles.input} required value={novoValorPremio} onChange={(e) => setNovoValorPremio(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalRenovacao(null)}>Cancelar</button>
                <button type="submit" style={styles.button('warning')}>Confirmar Renovação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Parcelas */}
      {modalParcelas && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Controle de Parcelas & Pagamentos (EU28)</h3>
            <p style={{ margin: '4px 0 12px', color: '#475569' }}>
              <strong>Apólice:</strong> {modalParcelas.apolice.numeroApolice} | <strong>Cliente:</strong> {modalParcelas.apolice.clienteNome}
            </p>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Parcela</th>
                  <th style={styles.th}>Vencimento</th>
                  <th style={styles.th}>Valor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {modalParcelas.itens.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={styles.td}>#{idx + 1}</td>
                    <td style={styles.td}>{p.dataVencimento}</td>
                    <td style={styles.td}>R$ {p.valor?.toFixed(2)}</td>
                    <td style={styles.td}><span style={styles.badge(p.status)}>{p.status}</span></td>
                    <td style={styles.td}>
                      {p.status !== 'PAGO' ? (
                        <button style={styles.button('success')} onClick={() => atualizarStatusParcela(p.id, 'PAGO')}>
                          Marcar como PAGO
                        </button>
                      ) : (
                        <button style={styles.button('secondary')} onClick={() => atualizarStatusParcela(p.id, 'PENDENTE')}>
                          Reabrir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.button('primary')} onClick={() => setModalParcelas(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
