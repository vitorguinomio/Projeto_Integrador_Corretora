Implementação do Frontend Mínimo de Teste (React + Vite + Nginx)

Crie a pasta frontend/ na raiz do projeto:

1. frontend/Dockerfile (Multi-stage enxuto)
Dockerfile

# Estágio 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Execução com Nginx Alpine
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

2. frontend/nginx.conf (Resolve rotas de SPA e faz Proxy Reverso da API)
Nginx

server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Encaminha chamadas /api para o contêiner do Spring Boot internamente
    location /api/ {
        proxy_pass http://app:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

3. frontend/src/App.jsx (Tela de Login Mínima com Feedback)
JavaScript

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