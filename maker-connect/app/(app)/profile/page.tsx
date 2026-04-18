'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/components/language-provider';

type ProfileProject = {
  id: number;
  title: string;
  description: string | null;
  category: 'Printing3D' | 'Robotics' | 'IoT' | 'Woodworking';
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  votes: number;
};

type ProfileResponse = {
  data: {
    maker: {
      id: number;
      name: string | null;
      email: string;
      language: string;
    };
    stats: {
      projects: number;
      totalVotes: number;
    };
    projects: ProfileProject[];
  };
};

function displayCategory(category: ProfileProject['category']) {
  return category === 'Printing3D' ? '3D_Printing' : category;
}

export default function ProfilePage() {
  const { setLanguage } = useLanguage();
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse['data'] | null>(null);

  async function loadProfile(email?: string) {
    setLoading(true);
    setError(null);

    try {
      const url = email?.trim() ? `/api/profile?email=${encodeURIComponent(email.trim())}` : '/api/profile';
      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Falha ao carregar perfil maker.');
      }

      const payload = (await res.json()) as ProfileResponse;
      setProfile(payload.data);

      // Sincroniza o estado global com o que está no banco
      if (payload.data.maker.language) {
        setLanguage(payload.data.maker.language);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar perfil.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLanguageChange(code: string) {
    if (!profile) return;
    
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.maker.id, language: code }),
      });
      console.log('Language updated in DB');
    } catch (err) {
      console.error('Failed to update language', err);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadProfile(emailInput);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Maker Profile</h1>
            <p className="text-sm text-zinc-600">Visao social do maker com projetos publicados e total de votos.</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector onSelect={handleLanguageChange} />
            <Link
              href="/feed"
              className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200"
            >
              Voltar ao Feed
            </Link>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="Buscar por email (opcional)"
            className="h-10 min-w-[260px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none ring-zinc-200 placeholder:text-zinc-400 focus:ring-2"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-zinc-900 px-4 text-sm text-white transition hover:bg-zinc-700"
          >
            Carregar perfil
          </button>
          <button
            type="button"
            onClick={() => {
              setEmailInput('');
              void loadProfile();
            }}
            className="h-10 rounded-lg bg-white px-4 text-sm text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-100"
          >
            Padrao
          </button>
        </form>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-24 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-24 animate-pulse rounded-xl bg-zinc-200" />
          </div>
        ) : null}

        {!loading && profile ? (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Maker</p>
                <h2 className="mt-2 text-lg font-semibold">{profile.maker.name ?? 'Sem nome'}</h2>
                <p className="text-sm text-zinc-600">{profile.maker.email}</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Projetos</p>
                <p className="mt-2 text-3xl font-semibold">{profile.stats.projects}</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total de votos</p>
                <p className="mt-2 text-3xl font-semibold">{profile.stats.totalVotes}</p>
              </article>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-4 text-lg font-semibold">Projetos do maker</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {profile.projects.map((project) => (
                  <article key={project.id} className="rounded-lg border border-zinc-200 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {displayCategory(project.category)}
                      </span>
                      <span className="text-xs text-zinc-500">#{project.id}</span>
                    </div>
                    <h4 className="text-base font-semibold text-zinc-900">{project.title}</h4>
                    <p className="mt-1 text-sm text-zinc-600">
                      {project.description ?? 'Projeto sem descricao no momento.'}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>{project.votes} votos</span>
                      {project.parentId ? <span>Fork de #{project.parentId}</span> : <span>Original</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
