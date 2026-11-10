// Utilitário de chamadas para a API com suporte a JWT Token

let currentToken = localStorage.getItem('hcr_token') || null;

export const setAuthToken = (token) => {
  currentToken = token;
  if (token) {
    localStorage.setItem('hcr_token', token);
  } else {
    localStorage.removeItem('hcr_token');
  }
};

export const getAuthToken = () => currentToken;

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let msg = 'Erro na requisição';
    if (typeof data === 'object' && data !== null) {
      if (data.message && typeof data.message === 'string') {
        msg = data.message;
      } else if (data.message && typeof data.message === 'object') {
        msg = Object.values(data.message).join(' | ');
      } else if (data.error) {
        msg = data.error;
      }
    } else if (typeof data === 'string' && data.length > 0) {
      msg = data;
    }
    throw new Error(msg);
  }

  return data;
};
