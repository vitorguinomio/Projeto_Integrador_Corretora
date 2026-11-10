import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function CorretoresTab() {
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [nome, setNome] = useState('');
  const [dadosProfissionais, setDadosProfissionais] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [status, setStatus] = useState('ATIVO');

  const carregarCorretores = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/corretores');
      setCorretores(data);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCorretores();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setDadosProfissionais('SUSEP-');
    setEmail('');
    setSenha('corretor123');
    setStatus('ATIVO');
    setModalAberto(true);
  };

  const abrirEdicao = (c) => {
    setEditando(c);
    setNome(c.nome);
    setDadosProfissionais(c.dadosProfissionais);
    setEmail(c.email || '');
    setSenha('');
    setStatus(c.status);
    setModalAberto(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setFeedback(null);
    const payload = { nome, dadosProfissionais, email, senha: senha || undefined, status };
    try {
      if (editando) {
        await apiFetch(`/corretores/${editando.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setFeedback({ tipo: 'sucesso', texto: 'Corretor atualizado com sucesso!' });
      } else {
        await apiFetch('/corretores', { method: 'POST', body: JSON.stringify(payload) });
        setFeedback({ tipo: 'sucesso', texto: 'Corretor cadastrado com sucesso!' });
      }
      setModalAberto(false);
      carregarCorretores();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const alternarStatus = async (c) => {
    const novoStatus = c.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await apiFetch(`/corretores/${c.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus })
      });
      setFeedback({ tipo: 'sucesso', texto: `Status do corretor ${c.nome} alterado para ${novoStatus}.` });
      carregarCorretores();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Gestão de Corretores (RF05 - RF07, EU20, EU21)</h2>
        <button style={styles.button('success')} onClick={abrirNovo}>+ Novo Corretor</button>
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

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Registro SUSEP</th>
              <th style={styles.th}>E-mail de Acesso</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {corretores.map(c => (
              <tr key={c.id}>
                <td style={styles.td}>#{c.id}</td>
                <td style={{ ...styles.td, fontWeight: '600' }}>{c.nome}</td>
                <td style={styles.td}>{c.dadosProfissionais}</td>
                <td style={styles.td}>{c.email || 'Sem login'}</td>
                <td style={styles.td}><span style={styles.badge(c.status)}>{c.status}</span></td>
                <td style={styles.td}>
                  <button style={styles.button('warning')} onClick={() => abrirEdicao(c)}>Editar</button>
                  <button
                    style={styles.button(c.status === 'ATIVO' ? 'danger' : 'success')}
                    onClick={() => alternarStatus(c)}
                  >
                    {c.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{editando ? `Editar Corretor #${editando.id}` : 'Novo Corretor (RF05)'}</h3>
            <form onSubmit={salvar}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nome do Profissional *</label>
                <input style={styles.input} required value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Registro SUSEP / Matrícula Profissional *</label>
                <input style={styles.input} required value={dadosProfissionais} onChange={(e) => setDadosProfissionais(e.target.value)} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>E-mail de Acesso ao Sistema *</label>
                <input type="email" style={styles.input} required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Senha de Acesso</label>
                <input type="password" style={styles.input} placeholder={editando ? 'Deixe em branco para manter' : 'Senha inicial'} value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Status</label>
                <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" style={styles.button('success')}>Salvar Corretor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
