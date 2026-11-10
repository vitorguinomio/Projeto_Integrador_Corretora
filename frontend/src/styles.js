export const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f4f6f9',
    minHeight: '100vh',
    color: '#212529',
    margin: 0,
    padding: 0
  },
  header: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  nav: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#0f172a',
    padding: '8px 24px',
    overflowX: 'auto',
    borderBottom: '1px solid #334155'
  },
  navButton: (active) => ({
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: active ? '#2563eb' : 'transparent',
    color: active ? '#ffffff' : '#cbd5e1',
    cursor: 'pointer',
    fontWeight: active ? '600' : '500',
    fontSize: '14px',
    transition: 'all 0.15s ease'
  }),
  content: {
    maxWidth: '1200px',
    margin: '24px auto',
    padding: '0 16px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  statCard: (color = '#2563eb') => ({
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    borderLeft: `4px solid ${color}`
  }),
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    color: '#475569',
    fontWeight: '600'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'middle'
  },
  badge: (type = 'info') => {
    const colors = {
      ATIVA: { bg: '#dcfce7', text: '#15803d' },
      PAGO: { bg: '#dcfce7', text: '#15803d' },
      ATIVO: { bg: '#dcfce7', text: '#15803d' },
      ACEITA: { bg: '#dcfce7', text: '#15803d' },
      APROVADA: { bg: '#dcfce7', text: '#15803d' },
      LIDA: { bg: '#e2e8f0', text: '#475569' },
      PENDENTE: { bg: '#fef9c3', text: '#854d0e' },
      SOLICITADA: { bg: '#fef9c3', text: '#854d0e' },
      EM_ANALISE: { bg: '#e0e7ff', text: '#3730a3' },
      EM_RENOVACAO: { bg: '#ffedd5', text: '#9a3412' },
      VENCIDA: { bg: '#fee2e2', text: '#b91c1c' },
      CANCELADA: { bg: '#fee2e2', text: '#b91c1c' },
      RECUSADA: { bg: '#fee2e2', text: '#b91c1c' },
      INATIVO: { bg: '#fee2e2', text: '#b91c1c' },
      info: { bg: '#e0f2fe', text: '#0369a1' }
    };
    const c = colors[type] || colors.info;
    return {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: c.bg,
      color: c.text
    };
  },
  button: (variant = 'primary') => {
    const bg = variant === 'primary' ? '#2563eb' :
               variant === 'success' ? '#16a34a' :
               variant === 'warning' ? '#ea580c' :
               variant === 'danger' ? '#dc2626' : '#64748b';
    return {
      padding: '6px 14px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: bg,
      color: '#ffffff',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '13px',
      marginRight: '6px'
    };
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '650px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
  }
};
