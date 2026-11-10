import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function AlertasTab() {
  const [alertasVencimento, setAlertasVencimento] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const carregarAlertas = async () => {
    try {
      setLoading(true);
      const [venc, notifs] = await Promise.all([
        apiFetch('/apolices/alertas-vencimento?dias=30'),
        apiFetch('/alertas')
      ]);
      setAlertasVencimento(venc);
      setNotificacoes(notifs);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAlertas();
  }, []);

  const marcarLida = async (id) => {
    try {
      await apiFetch(`/alertas/${id}/ler`, { method: 'PATCH' });
      setFeedback({ tipo: 'sucesso', texto: 'Notificação marcada como lida (EU27).' });
      carregarAlertas();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Alertas de Vencimento & Notificações (RF27, EU19, EU27)</h2>
        <button style={styles.button('primary')} onClick={carregarAlertas}>Atualizar Alertas</button>
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

      {/* Alertas de Vencimento de Apólices */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <h3 style={{ margin: 0 }}>Apólices com Vencimento Próximo (Próximos 30 dias - RF27)</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
          Contratos ativos que necessitam de contato comercial para início do processo de renovação.
        </p>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Apólice</th>
              <th style={styles.th}>Cliente Segurado</th>
              <th style={styles.th}>Corretor Responsável</th>
              <th style={styles.th}>Seguro</th>
              <th style={styles.th}>Término Vigência</th>
              <th style={styles.th}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {alertasVencimento.map(a => (
              <tr key={a.id} style={{ backgroundColor: '#fffbeb' }}>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{a.numeroApolice}</td>
                <td style={styles.td}>{a.clienteNome}</td>
                <td style={styles.td}>{a.corretorNome}</td>
                <td style={styles.td}>{a.seguroNome}</td>
                <td style={{ ...styles.td, color: '#b45309', fontWeight: 'bold' }}>{a.dataTermino}</td>
                <td style={styles.td}><span style={styles.badge('EM_RENOVACAO')}>A Vencer</span></td>
              </tr>
            ))}
            {alertasVencimento.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Nenhuma apólice vencendo nos próximos 30 dias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Caixa de Notificações do Sistema */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <h3 style={{ margin: 0 }}>Notificações do Usuário (Tabela notificacao_alerta - EU27)</h3>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Data/Hora</th>
              <th style={styles.th}>Destinatário</th>
              <th style={styles.th}>Assunto</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {notificacoes.map(n => (
              <tr key={n.id} style={{ backgroundColor: n.status === 'PENDENTE' ? '#f0fdf4' : 'transparent' }}>
                <td style={styles.td}>{n.dataCriacao?.replace('T', ' ').substring(0, 16)}</td>
                <td style={styles.td}>{n.usuarioEmail || `#${n.usuarioId}`}</td>
                <td style={{ ...styles.td, fontWeight: n.status === 'PENDENTE' ? 'bold' : 'normal' }}>{n.assunto}</td>
                <td style={styles.td}><span style={styles.badge(n.status)}>{n.status}</span></td>
                <td style={styles.td}>
                  {n.status === 'PENDENTE' ? (
                    <button style={styles.button('primary')} onClick={() => marcarLida(n.id)}>
                      Marcar como Lida
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Lida</span>
                  )}
                </td>
              </tr>
            ))}
            {notificacoes.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Nenhuma notificação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
