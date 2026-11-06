'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { requestNodoWelcome } from '@/components/nodo/welcome-flag';
import { safeNextPath } from '@/lib/safe-next';
import { resetVisitFlag } from '@/components/visit-tracker';
import OAuthButtons from '../_components/OAuthButtons';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?next= vem do modo convidado: volta para a pagina em que a pessoa estava
  const rawNext = searchParams.get('next');
  const nextPath = safeNextPath(rawNext);
  const fromGuest = safeNextPath(rawNext, '') !== '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erro ao cadastrar');
      }
      requestNodoWelcome('signup');
      resetVisitFlag(); // proxima pagina conta como visita autenticada
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setLoading(false);
    }
  }

  const inputCls = 'h-10 w-full rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30';
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
      <h1 className="mb-1 text-xl font-black text-white">Criar conta</h1>
      <p className="mb-6 text-sm text-zinc-500">Junte-se à comunidade maker</p>

      {fromGuest && (
        <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Para criar projetos, equipes e comunidades, votar ou participar, crie sua conta ou entre. Depois você volta para onde estava.
        </p>
      )}

      <OAuthButtons next={fromGuest ? nextPath : undefined} />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wide text-zinc-600">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Nome <span className="normal-case text-zinc-600">(opcional)</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Senha <span className="normal-case text-zinc-600">(mín. 8 caracteres)</span></label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className={inputCls}
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
          {loading ? 'Cadastrando…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Já tem conta?{' '}
        <Link href={fromGuest ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className="font-semibold text-amber-400 hover:text-amber-300">
          Entrar
        </Link>
      </p>
    </div>
  );
}
