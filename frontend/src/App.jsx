import { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('Enviando dados...');
    setErro(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha na autenticação');
      }

      setMensagem(`Sucesso! Token: ${data.token || 'Autenticado'}`);
    } catch (err) {
      setErro(true);
      setMensagem(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '360px', margin: '80px auto', fontFamily: 'monospace', padding: '20px', border: '1px solid #ccc' }}>
      <h2>HCR Corretora - Login PoC</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            required 
            style={{ width: '100%', padding: '6px' }}
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label>Senha:</label>
          <input 
            type="password" 
            required 
            style={{ width: '100%', padding: '6px' }}
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '8px', cursor: 'pointer' }}>
          Testar Conexão com API
        </button>
      </form>

      {mensagem && (
        <div style={{ marginTop: '16px', padding: '8px', background: erro ? '#ffebee' : '#e8f5e9', color: erro ? '#c62828' : '#2e7d32' }}>
          {mensagem}
        </div>
      )}
    </div>
  );
}
