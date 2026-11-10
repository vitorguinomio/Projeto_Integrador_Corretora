import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function RelatoriosTab() {
  const [subAba, setSubAba] = useState('clientes');
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const carregar = async (tipo) => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiFetch(`/relatorios/${tipo}`);
      setDados(res);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar(subAba);
  }, [subAba]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Relatórios Gerenciais Consolidados (RF35)</h2>
        <button style={styles.button('secondary')} onClick={() => window.print()}>Imprimir / Salvar PDF</button>
      </div>

      {feedback && (
        <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
          {feedback.texto}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={styles.button(subAba === 'clientes' ? 'primary' : 'secondary')} onClick={() => setSubAba('clientes')}>
          Relatório de Clientes
        </button>
        <button style={styles.button(subAba === 'corretores' ? 'primary' : 'secondary')} onClick={() => setSubAba('corretores')}>
          Desempenho de Corretores
        </button>
        <button style={styles.button(subAba === 'seguros' ? 'primary' : 'secondary')} onClick={() => setSubAba('seguros')}>
          Seguros Comercializados
        </button>
        <button style={styles.button(subAba === 'apolices' ? 'primary' : 'secondary')} onClick={() => setSubAba('apolices')}>
          Consolidado de Apólices
        </button>
      </div>

      <div style={styles.card}>
        {subAba === 'clientes' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nome do Segurado</th>
                <th style={styles.th}>CPF/CNPJ</th>
                <th style={styles.th}>E-mail</th>
                <th style={styles.th}>Total de Apólices</th>
                <th style={styles.th}>Apólices Ativas</th>
                <th style={styles.th}>Volume em Prêmios (R$)</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(c => (
                <tr key={c.clienteId}>
                  <td style={styles.td}>#{c.clienteId}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{c.nome}</td>
                  <td style={styles.td}>{c.cpfCnpj}</td>
                  <td style={styles.td}>{c.email}</td>
                  <td style={styles.td}>{c.totalApolices}</td>
                  <td style={styles.td}><span style={styles.badge('ATIVA')}>{c.apolicesAtivas}</span></td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a' }}>R$ {c.totalPremio?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {subAba === 'corretores' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Corretor</th>
                <th style={styles.th}>Registro SUSEP</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Cotações</th>
                <th style={styles.th}>Apólices Emitidas</th>
                <th style={styles.th}>Volume Gerenciado (R$)</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(c => (
                <tr key={c.corretorId}>
                  <td style={styles.td}>#{c.corretorId}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{c.nome}</td>
                  <td style={styles.td}>{c.dadosProfissionais}</td>
                  <td style={styles.td}><span style={styles.badge(c.status)}>{c.status}</span></td>
                  <td style={styles.td}>{c.totalCotacoes}</td>
                  <td style={styles.td}>{c.totalApolices}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a' }}>R$ {c.totalPremioGerenciado?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {subAba === 'seguros' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tipo de Seguro</th>
                <th style={styles.th}>Valor Base Médio</th>
                <th style={styles.th}>Apólices Contratadas</th>
                <th style={styles.th}>Faturamento Acumulado (R$)</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(s => (
                <tr key={s.seguroId}>
                  <td style={styles.td}>#{s.seguroId}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{s.nome}</td>
                  <td style={styles.td}>R$ {s.valorBase?.toFixed(2)}</td>
                  <td style={styles.td}>{s.totalApolices}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a' }}>R$ {s.totalPremio?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {subAba === 'apolices' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Número</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Corretor</th>
                <th style={styles.th}>Seguro</th>
                <th style={styles.th}>Início / Fim</th>
                <th style={styles.th}>Prêmio</th>
                <th style={styles.th}>Parcelas (Pagas / Pend.)</th>
                <th style={styles.th}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(a => (
                <tr key={a.apoliceId}>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{a.numeroApolice}</td>
                  <td style={styles.td}>{a.clienteNome}</td>
                  <td style={styles.td}>{a.corretorNome}</td>
                  <td style={styles.td}>{a.seguroNome}</td>
                  <td style={styles.td}>{a.dataInicio} ~ {a.dataTermino}</td>
                  <td style={styles.td}>R$ {a.valorPremio?.toFixed(2)}</td>
                  <td style={styles.td}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{a.parcelasPagas} pagas</span> / <span style={{ color: '#b45309' }}>{a.parcelasPendentes} pend.</span>
                  </td>
                  <td style={styles.td}><span style={styles.badge(a.situacao)}>{a.situacao}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
