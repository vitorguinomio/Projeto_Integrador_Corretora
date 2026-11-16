import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, XCircle } from 'lucide-react';
import { apiFetch, setAuthToken } from '../api';
import {
  validateEmail,
  FieldError,
  FeedbackBanner,
  getErrorInputStyle
} from './ui/UiBits';

export const LoginView = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [bannerError, setBannerError] = useState(null);

  const handleEmailChange = (val) => {
    setEmail(val);
    if (fieldErrors.email) {
      const err = validateEmail(val);
      setFieldErrors((prev) => ({ ...prev, email: err }));
    }
    if (bannerError) setBannerError(null);
  };

  const handleEmailBlur = () => {
    if (email.trim().length > 0) {
      const err = validateEmail(email);
      setFieldErrors((prev) => ({ ...prev, email: err }));
    }
  };

  const handleSenhaChange = (val) => {
    setSenha(val);
    if (fieldErrors.senha) {
      setFieldErrors((prev) => ({
        ...prev,
        senha: val.length >= 6 ? null : 'A senha deve conter no mínimo 6 caracteres.'
      }));
    }
    if (bannerError) setBannerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError(null);

    const errors = {};
    const emailErr = validateEmail(email);
    if (emailErr) {
      errors.email = emailErr;
    }
    if (!senha || senha.length < 6) {
      errors.senha = 'Informe uma senha válida com no mínimo 6 caracteres.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setBannerError('Verifique os campos destacados em vermelho para acessar o sistema.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha })
      });

      const perfil = data.perfilAcesso || data.perfil || 'ADMINISTRADOR';
      setAuthToken(data.token);
      onLoginSuccess({
        id: data.userId || data.id,
        nome: data.nome,
        email: data.email,
        perfil,
        perfilAcesso: perfil,
        role:
          perfil === 'ADMINISTRADOR'
            ? 'admin'
            : perfil === 'CORRETOR'
            ? 'corretor'
            : 'cliente'
      });
    } catch (err) {
      const msg = err.message || 'Credenciais inválidas. Verifique o e-mail e a senha digitados.';
      setBannerError(msg);
      if (msg.toLowerCase().includes('senha')) {
        setFieldErrors({ senha: msg });
      } else if (msg.toLowerCase().includes('e-mail') || msg.toLowerCase().includes('desativado')) {
        setFieldErrors({ email: msg });
      } else {
        setFieldErrors({
          email: 'Confira o e-mail informado.',
          senha: 'Confira a senha informada.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Coluna Esquerda - Hero Imagem e Mensagem HCR */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/login-brasilia.jpg"
          alt="Arquitetura modernista de Brasília ao entardecer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ink-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-signal">
            HCR Corretora de Seguros · Brasília
          </p>
          <h1 className="mt-4 max-w-md font-display text-5xl leading-[1.05]">
            Proteção bem construída, do contrato à renovação.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-ink-foreground/80">
            Clientes, corretores, seguros e apólices reunidos em um só lugar com tecnologia e segurança.
          </p>
        </div>
      </div>

      {/* Coluna Direita - Formulário de Acesso */}
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm animate-rise">
          <div className="mb-8">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-signal font-display text-xl font-bold text-signal-foreground shadow-lift">
              H
            </span>
          </div>

          <h2 className="text-3xl font-display font-medium text-foreground">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com seu e-mail corporativo ou pessoal cadastrado no PostgreSQL.
          </p>

          <div className="mt-6 space-y-4">
            <FeedbackBanner
              type="error"
              title="Falha na autenticação"
              message={bannerError}
              onClose={() => setBannerError(null)}
            />

            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail de Acesso *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  style={getErrorInputStyle(!!fieldErrors.email)}
                  className="h-11 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="usuario@hcr.com.br ou nome@gmail.com"
                />
                {fieldErrors.email && (
                  <XCircle
                    className="size-4 absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#dc2626' }}
                  />
                )}
              </div>
              <p className="text-[0.68rem] text-muted-foreground">
                Formatos aceitos: corporativo (ex: @hcr.com.br), Gmail, Hotmail, Outlook (.com ou .com.br).
              </p>
              <FieldError error={fieldErrors.email} />
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha *
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => handleSenhaChange(e.target.value)}
                  placeholder="••••••••"
                  style={getErrorInputStyle(!!fieldErrors.senha)}
                  className="h-11 w-full rounded-md border border-input bg-card pl-9 pr-10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError error={fieldErrors.senha} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>

          <div className="mt-6 rounded-lg border border-border/80 bg-accent/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Ambiente PostgreSQL Integrado:</strong> Autenticação via JWT (HMAC-SHA256) validando usuários ativos diretamente no banco de dados.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
