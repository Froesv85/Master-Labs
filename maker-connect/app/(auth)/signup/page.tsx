'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
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
      router.push('/feed');
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
          <label className={labelCls}>Senha <span className="normal-case text-zinc-600">(mín. 6 caracteres)</span></label>
          <input
            type="password"
            required
            minLength={6}
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
        <Link href="/login" className="font-semibold text-amber-400 hover:text-amber-300">
          Entrar
        </Link>
      </p>
    </div>
  );
}
