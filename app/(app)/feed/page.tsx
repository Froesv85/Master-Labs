'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type FeedCategory = '3D_Printing' | 'Robotics' | 'IoT' | 'Woodworking';

type ProjectItem = {
  id: number;
  title: string;
  description: string | null;
  category: 'Printing3D' | 'Robotics' | 'IoT' | 'Woodworking';
  votes: number;
  creatorId: number;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
};

type FeedResponse = {
  data: ProjectItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    category: string | null;
    q: string | null;
    sort: 'newest' | 'oldest';
  };
};

type FeedSort = 'newest' | 'oldest';

const CATEGORY_OPTIONS: Array<{ label: string; value: FeedCategory }> = [
  { label: '3D Printing', value: '3D_Printing' },
  { label: 'Robotics', value: 'Robotics' },
  { label: 'IoT', value: 'IoT' },
  { label: 'Woodworking', value: 'Woodworking' },
];

const PAGE_SIZE = 6;

function displayCategory(category: ProjectItem['category']) {
  if (category === 'Printing3D') {
    return '3D_Printing';
  }
  return category;
}

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<FeedSort>('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forkingProjectId, setForkingProjectId] = useState<number | null>(null);
  const [votingProjectId, setVotingProjectId] = useState<number | null>(null);
  const [response, setResponse] = useState<FeedResponse | null>(null);

  const categoryQuery = useMemo(() => {
    return selectedCategory === 'ALL' ? null : selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
      });

      if (categoryQuery) {
        params.set('category', categoryQuery);
      }

      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }

      try {
        const res = await fetch(`/api/projects?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          const payload = (await res.json()) as { error?: string };
          throw new Error(payload.error ?? 'Falha ao carregar feed.');
        }

        const payload = (await res.json()) as FeedResponse;
        setResponse(payload);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err.message : 'Erro inesperado.');
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
    return () => controller.abort();
  }, [categoryQuery, page, searchQuery, sort]);

  async function handleFork(projectId: number) {
    setForkingProjectId(projectId);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/fork`, {
        method: 'POST',
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Falha ao criar fork.');
      }

      setPage(1);
      setSearchQuery('');
      setSearchInput('');
      setSelectedCategory('ALL');
      setSort('newest');
      setLoading(true);

      const refresh = await fetch(`/api/projects?page=1&pageSize=${PAGE_SIZE}&sort=newest`, {
        cache: 'no-store',
      });

      if (!refresh.ok) {
        throw new Error('Fork criado, mas nao foi possivel atualizar o feed.');
      }

      const payload = (await refresh.json()) as FeedResponse;
      setResponse(payload);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao criar fork.');
      setLoading(false);
    } finally {
      setForkingProjectId(null);
    }
  }

  async function handleVote(projectId: number) {
    setVotingProjectId(projectId);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Falha ao votar no projeto.');
      }

      const payload = (await res.json()) as {
        data: { projectId: number; votes: number; alreadyVoted: boolean };
      };

      setResponse((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          data: prev.data.map((project) =>
            project.id === payload.data.projectId
              ? { ...project, votes: payload.data.votes }
              : project
          ),
        };
      });

      if (payload.data.alreadyVoted) {
        setError('Voce ja votou neste projeto.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao votar.');
    } finally {
      setVotingProjectId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <header className="mb-8 flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Feed de Inovacoes</h1>
          <p className="text-sm text-zinc-600">Filtre por categoria e navegue pelos projetos publicados.</p>
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-2">
          <form
            className="mb-2 flex w-full flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearchQuery(searchInput);
            }}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por titulo ou descricao"
              className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none ring-zinc-200 placeholder:text-zinc-400 focus:ring-2"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm text-white transition hover:bg-zinc-700"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setPage(1);
              }}
              className="h-10 rounded-lg bg-white px-4 text-sm text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-100"
            >
              Limpar
            </button>

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as FeedSort);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none ring-zinc-200 focus:ring-2"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
            </select>
          </form>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm transition ${
              selectedCategory === 'ALL'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100'
            }`}
          >
            Todas
          </button>

          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSelectedCategory(option.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm transition ${
                selectedCategory === option.value
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-xl bg-zinc-200" />
            ))}
          </div>
        ) : null}

        {!loading && response && response.data.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Nenhum projeto encontrado para os filtros atuais.
          </div>
        ) : null}

        {!loading && response && response.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {response.data.map((project) => (
              <article key={project.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                    {displayCategory(project.category)}
                  </span>
                  <span className="text-xs text-zinc-500">#{project.id} • {project.votes} votos</span>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-zinc-900">{project.title}</h2>
                <p className="text-sm text-zinc-600">
                  {project.description ?? 'Projeto sem descricao no momento.'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={votingProjectId === project.id}
                    onClick={() => handleVote(project.id)}
                    className="rounded-lg bg-zinc-200 px-3 py-2 text-sm text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {votingProjectId === project.id ? 'Votando...' : 'Upvote'}
                  </button>
                  <Link
                    href={`/projects/${project.id}`}
                    className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200"
                  >
                    Ver
                  </Link>
                  <button
                    type="button"
                    disabled={forkingProjectId === project.id}
                    onClick={() => handleFork(project.id)}
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forkingProjectId === project.id ? 'Forkando...' : 'Fork'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && response ? (
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              Pagina {response.pagination.page} de {response.pagination.totalPages} • {response.pagination.total}{' '}
              projetos
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={response.pagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={response.pagination.page >= response.pagination.totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(response.pagination.totalPages, prev + 1))
                }
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proxima
              </button>
            </div>
          </footer>
        ) : null}
      </main>
    </div>
  );
}
