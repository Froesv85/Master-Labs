'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

const CATEGORY_BADGE: Record<string, string> = {
  Printing3D: 'bg-violet-100 text-violet-800',
  '3D_Printing': 'bg-violet-100 text-violet-800',
  Robotics: 'bg-blue-100 text-blue-800',
  IoT: 'bg-teal-100 text-teal-800',
  Woodworking: 'bg-amber-100 text-amber-800',
};

const CATEGORY_EMOJI: Record<string, string> = {
  Printing3D: '🖨️',
  '3D_Printing': '🖨️',
  Robotics: '🤖',
  IoT: '📡',
  Woodworking: '🪵',
};

function displayCategory(category: ProfileProject['category']) {
  return category === 'Printing3D' ? '3D Printing' : category;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AvatarPlaceholder({ name }: { name: string | null }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700 ring-2 ring-indigo-200">
      {initials}
    </div>
  );
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
    } catch (err) {
      console.error('Failed to update language', err);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-8">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maker Profile</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Visão social do maker — projetos publicados e reputação por votos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector onSelect={handleLanguageChange} />
            <Link
              href="/feed"
              className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-600 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50"
            >
              ← Voltar ao Feed
            </Link>
          </div>
        </header>

        {/* Email search */}
        <form onSubmit={(e) => { e.preventDefault(); void loadProfile(emailInput); }} className="mb-8 flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="Buscar maker por e-mail..."
            className="h-10 min-w-[260px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Buscar
          </button>
          {emailInput && (
            <button
              type="button"
              onClick={() => {
                setEmailInput('');
                void loadProfile();
              }}
              className="h-10 rounded-lg bg-white px-3 text-sm text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-100"
            >
              ✕
            </button>
          )}
        </form>

        {/* Error */}
        {error ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 animate-pulse rounded-2xl bg-zinc-200" />
              <div className="h-20 animate-pulse rounded-2xl bg-zinc-200" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
          </div>
        ) : null}

        {!loading && profile ? (
          <>
            {/* Maker identity card */}
            <section className="mb-5 flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6">
              <AvatarPlaceholder name={profile.maker.name} />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-zinc-900">
                  {profile.maker.name ?? 'Maker sem nome'}
                </h2>
                <p className="text-sm text-zinc-500">{profile.maker.email}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{profile.stats.projects}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Projetos</p>
                </div>
                <div className="border-l border-zinc-200 pl-6">
                  <p className="text-2xl font-bold text-indigo-700">{profile.stats.totalVotes}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Votos</p>
                </div>
              </div>
            </section>

            {/* Projects list */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-base font-semibold text-zinc-800">
                Projetos publicados
                <span className="ml-2 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                  {profile.projects.length}
                </span>
              </h3>

              {profile.projects.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <span className="text-3xl" aria-hidden="true">📭</span>
                  <p className="text-sm text-zinc-500">Nenhum projeto publicado ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {profile.projects.map((project) => {
                    const badgeClass = CATEGORY_BADGE[project.category] ?? 'bg-zinc-100 text-zinc-700';
                    const emoji = CATEGORY_EMOJI[project.category] ?? '📦';
                    return (
                      <article key={project.id} className="flex flex-col rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                            <span aria-hidden="true">{emoji}</span>
                            {displayCategory(project.category)}
                          </span>
                          <time className="text-xs text-zinc-400" dateTime={project.createdAt}>
                            {relativeTime(project.createdAt)}
                          </time>
                        </div>
                        <h4 className="line-clamp-2 text-sm font-semibold text-zinc-900">{project.title}</h4>
                        <p className="mt-1 line-clamp-2 flex-1 text-xs text-zinc-500">
                          {project.description ?? 'Sem descrição.'}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                              ▲ {project.votes}
                            </span>
                            {project.parentId ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">
                                Fork #{project.parentId}
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
                                Original
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="rounded-lg px-2.5 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-white"
                          >
                            Ver →
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
