import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function CotacoesTab() {
  const [cotacoes, setCotacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [filtroSituacao, setFiltroSituacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalCotacao, setModalCotacao] = useState(false);
  const [modalProposta, setModalProposta] = useState(null); // cotacao selecionada para criar proposta
  const [visualizarProposta, setVisualizarProposta] = useState(null); // proposta selecionada para visualizacao
  const [feedback, setFeedback] = useState(null);

  // Form Cotação
  const [clienteId, setClienteId] = useState('');
  const [corretorId, setCorretorId] = useState('');
  const [seguroId, setSeguroId] = useState('');
  const [valor, setValor] = useState('');

  // Form Proposta
  const [condicoes, setCondicoes] = useState('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const urlCotacoes = filtroSituacao ? `/cotacoes?situacao=${filtroSituacao}` : '/cotacoes';
      const [cots, cls, cors, segs] = await Promise.all([
        apiFetch(urlCotacoes),
        apiFetch('/clientes'),
        apiFetch('/corretores'),
        apiFetch('/seguros')
      ]);
      setCotacoes(cots);
      setClientes(cls);
      setCorretores(cors);
      setSeguros(segs);
      if (cls.length > 0 && !clienteId) setClienteId(cls[0].id);
      if (segs.length > 0 && !seguroId) setSeguroId(segs[0].id);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroSituacao]);

  const abrirNovaCotacao = () => {
    if (clientes.length > 0) setClienteId(clientes[0].id);
    if (seguros.length > 0) {
      setSeguroId(seguros[0].id);
      setValor(seguros[0].valorBase || '1000.00');
    }
    setCorretorId(corretores.length > 0 ? corretores[0].id : '');
    setModalCotacao(true);
  };

  const salvarCotacao = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/cotacoes', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: Number(clienteId),
          corretorId: corretorId ? Number(corretorId) : undefined,
          seguroId: Number(seguroId),
          valor: Number(valor),
          situacao: 'SOLICITADA'
        })
      });
      setFeedback({ tipo: 'sucesso', texto: 'Cotação solicitada com sucesso!' });
      setModalCotacao(false);
      carregarDados();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const abrirGerarProposta = (c) => {
    setModalProposta(c);
    setCondicoes(`Proposta comercial para o seguro ${c.seguroNome}. Franquia de R$ 1.200,00, assistência 24 horas completa, pagamento em até 12x.`);
  };

  const salvarProposta = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/propostas', {
        method: 'POST',
        body: JSON.stringify({
          cotacaoId: modalProposta.id,
          condicoes,
          situacao: 'PENDENTE'
        })
      });
      setFeedback({ tipo: 'sucesso', texto: 'Proposta elaborada e enviada ao cliente com sucesso!' });
      setModalProposta(null);
      carregarDados();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const verProposta = async (cotacaoId) => {
    try {
      const prop = await apiFetch(`/propostas/cotacao/${cotacaoId}`);
      setVisualizarProposta(prop);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const aceitarProposta = async (propostaId) => {
    try {
      await apiFetch(`/propostas/${propostaId}/aceitar`, { method: 'POST' });
      setFeedback({ tipo: 'sucesso', texto: 'Proposta aceita! Cotação aprovada para contratação de apólice (EU08).' });
      setVisualizarProposta(null);
      carregarDados();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const recusarProposta = async (propostaId) => {
    try {
      await apiFetch(`/propostas/${propostaId}/recusar`, { method: 'POST' });
      setFeedback({ tipo: 'sucesso', texto: 'Proposta recusada.' });
      setVisualizarProposta(null);
      carregarDados();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Cotações & Propostas Comerciais (EU05 - EU12)</h2>
        <button style={styles.button('success')} onClick={abrirNovaCotacao}>+ Nova Cotação</button>
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

      <div style={{ ...styles.card, padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Filtrar por Situação:</span>
          <select style={{ ...styles.input, width: '220px' }} value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)}>
            <option value="">Todas as Cotações</option>
            <option value="SOLICITADA">SOLICITADA</option>
            <option value="PROPOSTA_GERADA">PROPOSTA_GERADA</option>
            <option value="APROVADA">APROVADA</option>
            <option value="RECUSADA">RECUSADA</option>
          </select>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>Corretor</th>
              <th style={styles.th}>Seguro</th>
              <th style={styles.th}>Valor</th>
              <th style={styles.th}>Situação</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cotacoes.map(c => (
              <tr key={c.id}>
                <td style={styles.td}>#{c.id}</td>
                <td style={styles.td}>{c.dataSolicitacao?.substring(0, 10)}</td>
                <td style={{ ...styles.td, fontWeight: '600' }}>{c.clienteNome}</td>
                <td style={styles.td}>{c.corretorNome}</td>
                <td style={styles.td}>{c.seguroNome}</td>
                <td style={styles.td}>R$ {c.valor?.toFixed(2)}</td>
                <td style={styles.td}><span style={styles.badge(c.situacao)}>{c.situacao}</span></td>
                <td style={styles.td}>
                  {c.situacao === 'SOLICITADA' && (
                    <button style={styles.button('primary')} onClick={() => abrirGerarProposta(c)}>
                      Elaborar Proposta (EU12)
                    </button>
                  )}
                  {c.situacao === 'PROPOSTA_GERADA' && (
                    <button style={styles.button('warning')} onClick={() => verProposta(c.id)}>
                      Avaliar Proposta (EU07/EU08)
                    </button>
                  )}
                  {c.situacao === 'APROVADA' && (
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>✓ Aprovada</span>
                  )}
                </td>
              </tr>
            ))}
            {cotacoes.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  Nenhuma cotação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Cotação */}
      {modalCotacao && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Solicitar Nova Cotação (EU05, EU11)</h3>
            <form onSubmit={salvarCotacao}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cliente *</label>
                <select style={styles.input} required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  {clientes.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.nome} ({cl.cpfCnpj})</option>
                  ))}
                </select>
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
                    if (s) setValor(s.valorBase);
                  }}
                >
                  {seguros.map(sg => (
                    <option key={sg.id} value={sg.id}>{sg.nome} (Base: R$ {sg.valorBase?.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Corretor Responsável</label>
                <select style={styles.input} value={corretorId} onChange={(e) => setCorretorId(e.target.value)}>
                  <option value="">Aguardando atribuição</option>
                  {corretores.map(cr => (
                    <option key={cr.id} value={cr.id}>{cr.nome} ({cr.dadosProfissionais})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Valor do Seguro / Prêmio Estimado (R$)</label>
                <input type="number" step="0.01" style={styles.input} required value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalCotacao(false)}>Cancelar</button>
                <button type="submit" style={styles.button('success')}>Solicitar Cotação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Elaborar Proposta */}
      {modalProposta && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Elaborar Proposta Comercial (EU12)</h3>
            <p style={{ margin: '4px 0 12px', color: '#475569' }}>
              <strong>Cotação:</strong> #{modalProposta.id} | <strong>Cliente:</strong> {modalProposta.clienteNome} | <strong>Seguro:</strong> {modalProposta.seguroNome}
            </p>
            <form onSubmit={salvarProposta}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Condições e Cláusulas da Proposta *</label>
                <textarea
                  style={{ ...styles.input, height: '110px' }}
                  required
                  value={condicoes}
                  onChange={(e) => setCondicoes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalProposta(null)}>Cancelar</button>
                <button type="submit" style={styles.button('primary')}>Enviar Proposta ao Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar / Aceitar Proposta */}
      {visualizarProposta && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Avaliação da Proposta (EU07 / EU08)</h3>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px' }}><strong>Proposta #{visualizarProposta.id}</strong></p>
              <p style={{ margin: '0 0 8px' }}><strong>Cliente:</strong> {visualizarProposta.clienteNome}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Seguro:</strong> {visualizarProposta.seguroNome}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Valor:</strong> R$ {visualizarProposta.valorCotacao?.toFixed(2)}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Situação:</strong> <span style={styles.badge(visualizarProposta.situacao)}>{visualizarProposta.situacao}</span></p>
              <p style={{ margin: '12px 0 4px', fontWeight: 'bold' }}>Condições:</p>
              <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {visualizarProposta.condicoes}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button style={styles.button('secondary')} onClick={() => setVisualizarProposta(null)}>Fechar</button>
              {visualizarProposta.situacao === 'PENDENTE' && (
                <>
                  <button style={styles.button('danger')} onClick={() => recusarProposta(visualizarProposta.id)}>Recusar Proposta</button>
                  <button style={styles.button('success')} onClick={() => aceitarProposta(visualizarProposta.id)}>✓ Aceitar Proposta (EU08)</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
