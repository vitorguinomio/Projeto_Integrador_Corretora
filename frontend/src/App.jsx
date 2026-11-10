import React, { useState, useEffect } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from './api';
import { styles } from './styles';

import DashboardTab from './components/DashboardTab';
import ClientesTab from './components/ClientesTab';
import CorretoresTab from './components/CorretoresTab';
import SegurosTab from './components/SegurosTab';
import CotacoesTab from './components/CotacoesTab';
import ApolicesTab from './components/ApolicesTab';
import AlertasTab from './components/AlertasTab';
import RelatoriosTab from './components/RelatoriosTab';
import AuditoriaTab from './components/AuditoriaTab';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loginModal, setLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const checarSessao = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const me = await apiFetch('/auth/me');
      setUsuarioLogado(me);
    } catch (e) {
      setAuthToken(null);
      setUsuarioLogado(null);
    }
  };

  useEffect(() => {
    checarSessao();
  }, []);

  const loginRapido = async (email, senha) => {
    try {
      setFeedback(null);
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      setAuthToken(res.token);
      setUsuarioLogado({
        id: res.userId,
        email: res.email,
        perfilAcesso: res.perfilAcesso,
        nome: res.nome
      });
      setFeedback({ tipo: 'sucesso', texto: `Autenticado com sucesso como ${res.nome} (${res.perfilAcesso})!` });
      setLoginModal(false);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: `Falha no login: ${err.message}` });
    }
  };

  const fazerLogout = () => {
    setAuthToken(null);
    setUsuarioLogado(null);
    setFeedback({ tipo: 'info', texto: 'Sessão encerrada.' });
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            HCR Corretora de Seguros <span style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>| Homologação de Dados do Projeto Integrador</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {usuarioLogado ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px' }}>
                Conectado: <strong>{usuarioLogado.nome}</strong> ({usuarioLogado.email})
              </span>
              <span style={styles.badge(usuarioLogado.perfilAcesso)}>{usuarioLogado.perfilAcesso}</span>
              <button style={styles.button('secondary')} onClick={fazerLogout}>Sair</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Testar Acesso Rápido:</span>
              <button style={styles.button('primary')} onClick={() => loginRapido('admin@hcr.com', 'admin123')}>Admin</button>
              <button style={styles.button('primary')} onClick={() => loginRapido('carlos.silva@corretora.com', 'corretor123')}>Corretor</button>
              <button style={styles.button('primary')} onClick={() => loginRapido('joao.silva@email.com', 'cliente123')}>Cliente</button>
              <button style={styles.button('secondary')} onClick={() => setLoginModal(true)}>Outro Login</button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Bar */}
      <nav style={styles.nav}>
        <button style={styles.navButton(abaAtiva === 'dashboard')} onClick={() => setAbaAtiva('dashboard')}>
          📊 Dashboard & KPIs
        </button>
        <button style={styles.navButton(abaAtiva === 'clientes')} onClick={() => setAbaAtiva('clientes')}>
          👥 Clientes & Histórico
        </button>
        <button style={styles.navButton(abaAtiva === 'corretores')} onClick={() => setAbaAtiva('corretores')}>
          👔 Corretores
        </button>
        <button style={styles.navButton(abaAtiva === 'seguros')} onClick={() => setAbaAtiva('seguros')}>
          🛡️ Seguros & Coberturas
        </button>
        <button style={styles.navButton(abaAtiva === 'cotacoes')} onClick={() => setAbaAtiva('cotacoes')}>
          📝 Cotações & Propostas
        </button>
        <button style={styles.navButton(abaAtiva === 'apolices')} onClick={() => setAbaAtiva('apolices')}>
          📑 Apólices, Vigência & Parcelas
        </button>
        <button style={styles.navButton(abaAtiva === 'alertas')} onClick={() => setAbaAtiva('alertas')}>
          ⚠️ Alertas de Vencimento
        </button>
        <button style={styles.navButton(abaAtiva === 'relatorios')} onClick={() => setAbaAtiva('relatorios')}>
          📈 Relatórios
        </button>
        <button style={styles.navButton(abaAtiva === 'auditoria')} onClick={() => setAbaAtiva('auditoria')}>
          🔒 Usuários & Auditoria
        </button>
      </nav>

      {/* Main Content */}
      <main style={styles.content}>
        {feedback && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            backgroundColor: feedback.tipo === 'erro' ? '#fee2e2' : feedback.tipo === 'sucesso' ? '#dcfce7' : '#e0f2fe',
            color: feedback.tipo === 'erro' ? '#b91c1c' : feedback.tipo === 'sucesso' ? '#15803d' : '#0369a1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{feedback.texto}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {abaAtiva === 'dashboard' && <DashboardTab />}
        {abaAtiva === 'clientes' && <ClientesTab />}
        {abaAtiva === 'corretores' && <CorretoresTab />}
        {abaAtiva === 'seguros' && <SegurosTab />}
        {abaAtiva === 'cotacoes' && <CotacoesTab />}
        {abaAtiva === 'apolices' && <ApolicesTab />}
        {abaAtiva === 'alertas' && <AlertasTab />}
        {abaAtiva === 'relatorios' && <RelatoriosTab />}
        {abaAtiva === 'auditoria' && <AuditoriaTab />}
      </main>

      {/* Modal Login Manual */}
      {loginModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '400px' }}>
            <h3>Autenticação no Sistema (RF08 / EU02)</h3>
            <form onSubmit={(e) => { e.preventDefault(); loginRapido(emailInput, senhaInput); }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>E-mail:</label>
                <input
                  type="email"
                  style={styles.input}
                  required
                  placeholder="usuario@hcr.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Senha:</label>
                <input
                  type="password"
                  style={styles.input}
                  required
                  placeholder="Senha"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setLoginModal(false)}>Cancelar</button>
                <button type="submit" style={styles.button('primary')}>Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
