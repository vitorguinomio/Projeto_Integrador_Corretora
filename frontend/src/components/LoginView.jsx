import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Users, BellRing, KeyRound, Info } from 'lucide-react';
import { apiFetch, setAuthToken } from '../api';
import { useFeedback } from './ui/UiBits';
import { mapLogin } from '../mappers';

// Contas de demonstração criadas pelo DataInitializer (as abas apenas preenchem o formulário)
const CONTAS_DEMO = [
  { role: 'admin', label: 'Administrador', email: 'admin@hcr.com', senha: 'admin123' },
  { role: 'corretor', label: 'Corretor', email: 'carlos.silva@corretora.com', senha: 'corretor123' },
  { role: 'cliente', label: 'Cliente', email: 'joao.silva@email.com', senha: 'cliente123' }
];

const DESTAQUES = [
  { icon: Users, texto: 'Clientes, corretores, seguros e apólices em um só lugar' },
  { icon: BellRing, texto: 'Alertas de vencimento e acompanhamento de propostas' },
  { icon: KeyRound, texto: 'Acesso por perfil: administrador, corretor e cliente' }
];

const inputClass =
  'h-11 w-full rounded-md border border-input bg-card pl-9 text-sm text-foreground transition-colors';

export const LoginView = ({ onLoginSuccess }) => {
  const { showInfo } = useFeedback();
  const [selectedRole, setSelectedRole] = useState(CONTAS_DEMO[0].role);
  const [email, setEmail] = useState(CONTAS_DEMO[0].email);
  const [senha, setSenha] = useState(CONTAS_DEMO[0].senha);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selecionarConta = (conta) => {
    setSelectedRole(conta.role);
    setEmail(conta.email);
    setSenha(conta.senha);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@') || senha.length < 6) {
      setError('Informe um e-mail válido e uma senha com no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      setAuthToken(data.token);
      onLoginSuccess(mapLogin(data));
    } catch (err) {
      setError(err.message || 'Credenciais inválidas. Verifique o e-mail e a senha digitados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Painel da marca */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        {/* Grade decorativa discreta */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <img src="/logo-hcr-monograma.png" alt="" className="size-10 brightness-0 invert" />
          <div className="leading-tight">
            <span className="block text-sm font-semibold">HCR Corretora de Seguros</span>
            <span className="block text-xs text-primary-foreground/70">Brasília</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            A rotina da corretora, do contrato à renovação.
          </h1>
          <ul className="mt-8 space-y-4">
            {DESTAQUES.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-start gap-3 text-sm text-primary-foreground/85">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                  <Icon className="size-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">© HCR Corretora de Seguros</p>
      </section>

      {/* Formulário de acesso */}
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-in">
          <img src="/logo-hcr.png" alt="HCR Corretora de Seguros" className="mx-auto h-28 w-auto" />

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">Acesse sua conta</h2>
          <p className="mt-2 text-sm text-muted-foreground">Entre com o e-mail e a senha cadastrados na HCR Corretora.</p>

          {/* Contas de demonstração */}
          <div
            className="mt-8 grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1"
            role="tablist"
            aria-label="Contas de demonstração"
          >
            {CONTAS_DEMO.map((conta) => {
              const isSelected = selectedRole === conta.role;
              return (
                <button
                  key={conta.role}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selecionarConta(conta)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    isSelected ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {conta.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} pr-3`}
                  placeholder="voce@hcrseguros.com.br"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() =>
                    showInfo(
                      'Para redefinir sua senha, entre em contato com o administrador pelo e-mail admin@hcr.com.',
                      'Esqueceu a senha?'
                    )
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
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
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-md border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            As abas acima preenchem as contas de demonstração de cada perfil.
          </p>
        </form>
      </div>
    </div>
  );
};
