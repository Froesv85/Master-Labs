'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import OAuthButtons from '../_components/OAuthButtons';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_state_invalido: 'Sessão de login expirada, tente novamente',
  oauth_nao_configurado: 'Login social indisponível no momento',
  oauth_token_falhou: 'Não foi possível autenticar com o provedor',
  oauth_falhou: 'Erro ao entrar com o provedor',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? OAUTH_ERROR_MESSAGES[oauthError] ?? 'Erro ao entrar' : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Erro ao entrar');
      }
      router.replace('/feed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
      <h1 className="mb-1 text-xl font-black text-white">Entrar</h1>
      <p className="mb-6 text-sm text-zinc-500">Acesse sua conta MakerConnect</p>

      <OAuthButtons />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wide text-zinc-600">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="h-10 w-full rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Senha
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="h-10 w-full rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-lg bg-amber-500 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Não tem conta?{' '}
        <Link href="/signup" className="font-semibold text-amber-400 hover:text-amber-300">
          Cadastrar
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
