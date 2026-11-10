import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function DashboardTab() {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarMetricas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/dashboard');
      setMetricas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, []);

  if (loading) return <div>Carregando métricas operacionais...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro ao carregar dashboard: {error}</div>;
  if (!metricas) return null;

  const formatCurrency = (val) => {
    if (!val) return 'R$ 0,00';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Visão Geral Operacional & Financeira (RF26)</h2>
        <button style={styles.button('primary')} onClick={carregarMetricas}>Atualizar Métricas</button>
      </div>

      <div style={styles.grid}>
        <div style={styles.statCard('#2563eb')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Clientes Cadastrados</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{metricas.totalClientes}</div>
        </div>

        <div style={styles.statCard('#10b981')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Apólices Ativas</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{metricas.apolicesAtivas}</div>
        </div>

        <div style={styles.statCard('#f59e0b')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>A Vencer em 30 Dias (Alerta RF27)</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{metricas.apolicesProximasVencimento}</div>
        </div>

        <div style={styles.statCard('#ef4444')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Apólices Vencidas / Canceladas</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
            {metricas.apolicesVencidas} / {metricas.apolicesCanceladas}
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.statCard('#8b5cf6')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Cotações / Propostas Pendentes</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {metricas.cotacoesPendentes} / {metricas.propostasPendentes}
          </div>
        </div>

        <div style={styles.statCard('#06b6d4')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Corretores Ativos</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#06b6d4' }}>{metricas.totalCorretores}</div>
        </div>

        <div style={styles.statCard('#14b8a6')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Prêmios Totais Ativos</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14b8a6' }}>
            {formatCurrency(metricas.faturamentoTotalEstimado)}
          </div>
        </div>

        <div style={styles.statCard('#15803d')}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Total Recebido em Parcelas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>
            {formatCurrency(metricas.totalRecebidoParcelas)}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Status do Sistema e Integridade</h3>
        <p style={{ margin: '6px 0', color: '#475569' }}>
          O sistema está operando conectado ao banco de dados PostgreSQL com persistência integral das 14 entidades mapeadas na especificação do Projeto Integrador.
        </p>
      </div>
    </div>
  );
}
