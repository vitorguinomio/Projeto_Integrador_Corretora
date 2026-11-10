import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function SegurosTab() {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalSeguro, setModalSeguro] = useState(false);
  const [modalCobertura, setModalCobertura] = useState(null); // id do seguro selecionado
  const [feedback, setFeedback] = useState(null);

  // Form Seguro
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [valorBase, setValorBase] = useState('1000.00');

  // Form Cobertura
  const [descCobertura, setDescCobertura] = useState('');
  const [valCobertura, setValCobertura] = useState('200.00');

  const carregarSeguros = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/seguros');
      setSeguros(data);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSeguros();
  }, []);

  const abrirNovoSeguro = () => {
    setNome('');
    setDescricao('');
    setCaracteristicas('');
    setValorBase('1200.00');
    setModalSeguro(true);
  };

  const salvarSeguro = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/seguros', {
        method: 'POST',
        body: JSON.stringify({ nome, descricao, caracteristicas, valorBase: Number(valorBase), coberturas: [] })
      });
      setFeedback({ tipo: 'sucesso', texto: 'Tipo de seguro cadastrado com sucesso!' });
      setModalSeguro(false);
      carregarSeguros();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const salvarCobertura = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/seguros/${modalCobertura}/coberturas`, {
        method: 'POST',
        body: JSON.stringify({ descricao: descCobertura, valor: Number(valCobertura) })
      });
      setFeedback({ tipo: 'sucesso', texto: 'Cobertura adicionada com sucesso!' });
      setModalCobertura(null);
      carregarSeguros();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const removerCobertura = async (coberturaId) => {
    try {
      await apiFetch(`/seguros/coberturas/${coberturaId}`, { method: 'DELETE' });
      setFeedback({ tipo: 'sucesso', texto: 'Cobertura removida com sucesso.' });
      carregarSeguros();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Catálogo de Seguros & Coberturas (RF09 - RF11, RF17)</h2>
        <button style={styles.button('success')} onClick={abrirNovoSeguro}>+ Novo Seguro</button>
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

      <div style={styles.grid}>
        {seguros.map(s => (
          <div key={s.id} style={{ ...styles.card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{s.nome}</h3>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a' }}>
                  R$ {s.valorBase?.toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 10px 0' }}>{s.descricao}</p>
              {s.caracteristicas && (
                <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
                  {s.caracteristicas}
                </p>
              )}

              <h4 style={{ fontSize: '13px', margin: '12px 0 6px 0', color: '#334155' }}>
                Coberturas Disponíveis ({s.coberturas?.length || 0}):
              </h4>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px' }}>
                {s.coberturas?.map(cob => (
                  <li key={cob.id} style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{cob.descricao} {cob.valor > 0 && `(R$ ${cob.valor.toFixed(2)})`}</span>
                    <button
                      onClick={() => removerCobertura(cob.id)}
                      style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px' }}
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <button
                style={styles.button('primary')}
                onClick={() => {
                  setDescCobertura('');
                  setValCobertura('150.00');
                  setModalCobertura(s.id);
                }}
              >
                + Adicionar Cobertura
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Seguro */}
      {modalSeguro && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Cadastrar Novo Seguro (RF09, EU22)</h3>
            <form onSubmit={salvarSeguro}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nome do Seguro *</label>
                <input style={styles.input} required value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Descrição Geral *</label>
                <textarea style={{ ...styles.input, height: '70px' }} required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Características e Diferenciais</label>
                <textarea style={{ ...styles.input, height: '60px' }} value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Valor Base Estimado (R$)</label>
                <input type="number" step="0.01" style={styles.input} required value={valorBase} onChange={(e) => setValorBase(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalSeguro(false)}>Cancelar</button>
                <button type="submit" style={styles.button('success')}>Salvar Seguro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cobertura */}
      {modalCobertura && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Nova Cobertura (RF17, EU23)</h3>
            <form onSubmit={salvarCobertura}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Descrição da Cobertura *</label>
                <input style={styles.input} required placeholder="Ex: Guincho Ilimitado, Vidros e Lanternas" value={descCobertura} onChange={(e) => setDescCobertura(e.target.value)} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Valor Adicional Estimado (R$)</label>
                <input type="number" step="0.01" style={styles.input} value={valCobertura} onChange={(e) => setValCobertura(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalCobertura(null)}>Cancelar</button>
                <button type="submit" style={styles.button('success')}>Adicionar Cobertura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
