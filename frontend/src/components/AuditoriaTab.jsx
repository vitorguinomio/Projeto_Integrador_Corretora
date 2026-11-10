import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function AuditoriaTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const [u, l] = await Promise.all([
        apiFetch('/usuarios'),
        apiFetch('/auditoria')
      ]);
      setUsuarios(u);
      setLogs(l);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const alternarStatusUsuario = async (u) => {
    const novoStatus = u.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await apiFetch(`/usuarios/${u.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus })
      });
      setFeedback({ tipo: 'sucesso', texto: `Status de ${u.loginEmail} alterado para ${novoStatus}.` });
      carregar();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Gerenciamento de Usuários & Auditoria (RF28, RF29, RNF22)</h2>
        <button style={styles.button('primary')} onClick={carregar}>Atualizar Dados</button>
      </div>

      {feedback && (
        <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '16px', backgroundColor: feedback.tipo === 'erro' ? '#fee2e2' : '#dcfce7', color: feedback.tipo === 'erro' ? '#b91c1c' : '#15803d' }}>
          {feedback.texto}
        </div>
      )}

      {/* Tabela de Usuários */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <h3 style={{ margin: 0 }}>Contas de Usuários do Sistema (RF28 / RF29)</h3>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>E-mail de Login</th>
              <th style={styles.th}>Perfil de Acesso</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Controle</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td style={styles.td}>#{u.id}</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{u.loginEmail}</td>
                <td style={styles.td}>
                  <span style={styles.badge(u.perfilAcesso)}>{u.perfilAcesso}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(u.status)}>{u.status}</span>
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.button(u.status === 'ATIVO' ? 'danger' : 'success')}
                    onClick={() => alternarStatusUsuario(u)}
                  >
                    {u.status === 'ATIVO' ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Logs de Auditoria */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>📜</span>
          <h3 style={{ margin: 0 }}>Trilha de Auditoria do Sistema (Tabela log_auditoria - RNF22)</h3>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Data/Hora</th>
              <th style={styles.th}>Ação Realizada</th>
              <th style={styles.th}>Tabela Afetada</th>
              <th style={styles.th}>IP de Origem</th>
              <th style={styles.th}>Usuário Responsável</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={styles.td}>{l.dataHora?.replace('T', ' ').substring(0, 19)}</td>
                <td style={{ ...styles.td, fontWeight: '500' }}>{l.acaoRealizada}</td>
                <td style={styles.td}><code>{l.tabelaAfetada}</code></td>
                <td style={styles.td}>{l.ipOrigem || '127.0.0.1'}</td>
                <td style={styles.td}>{l.usuarioEmail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Nenhum log registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
