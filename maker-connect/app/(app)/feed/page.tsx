'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Robotics');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao criar'); }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      setSaving(false);
    }
  }

  return (
    <Modal title="Criar Projeto" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do projeto" className={inputCls} />
        </Field>
        <Field label="Descrição" hint="(opcional)">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que você está construindo?" className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Categoria">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="Robotics">Robótica</option>
            <option value="Printing3D">3D Printing</option>
            <option value="IoT">IoT</option>
            <option value="Woodworking">Woodworking</option>
          </select>
        </Field>
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Criar Projeto" />
      </form>
    </Modal>
  );
}
import { fetchProjectsFeed, forkProject, voteProject } from '@/features/social/projects/api';
import type { FeedCategory, FeedSort, ProjectItem, ProjectsFeedResponse } from '@/features/social/projects/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: Array<{
  label: string; value: FeedCategory; emoji: string;
  badge: string; filterActive: string; filterHover: string;
}> = [
  { label: '3D Printing', value: '3D_Printing', emoji: '🖨️', badge: 'bg-violet-900/60 text-violet-300 border border-violet-500/30', filterActive: 'border-violet-400 bg-violet-600 text-white', filterHover: 'border-white/10 text-zinc-400 hover:border-violet-500/40 hover:text-violet-300' },
  { label: 'Robotics', value: 'Robotics', emoji: '🤖', badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/30', filterActive: 'border-blue-400 bg-blue-600 text-white', filterHover: 'border-white/10 text-zinc-400 hover:border-blue-500/40 hover:text-blue-300' },
  { label: 'IoT', value: 'IoT', emoji: '📡', badge: 'bg-teal-900/60 text-teal-300 border border-teal-500/30', filterActive: 'border-teal-400 bg-teal-600 text-white', filterHover: 'border-white/10 text-zinc-400 hover:border-teal-500/40 hover:text-teal-300' },
  { label: 'Woodworking', value: 'Woodworking', emoji: '🪵', badge: 'bg-amber-900/60 text-amber-300 border border-amber-500/30', filterActive: 'border-amber-400 bg-amber-600 text-white', filterHover: 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-amber-300' },
];

const PAGE_SIZE = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayCategory(cat: ProjectItem['category']) {
  return cat === 'Printing3D' ? '3D_Printing' : cat;
}

function getCategoryOption(cat: ProjectItem['category']) {
  return CATEGORY_OPTIONS.find((o) => o.value === displayCategory(cat));
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function IconArrowUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function IconFork() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M6 9v2c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V9" />
      <line x1="12" y1="15" x2="12" y2="9" />
    </svg>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onVote, onFork, isVoting, isForking }: {
  project: ProjectItem;
  onVote: (id: number) => void;
  onFork: (id: number) => void;
  isVoting: boolean;
  isForking: boolean;
}) {
  const opt = getCategoryOption(project.category);
  const initials = project.creatorName
    ? project.creatorName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <article className="group flex flex-col rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-amber-500/20 hover:bg-slate-800/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]">
      {/* Top row: category + time */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${opt?.badge ?? 'bg-slate-800 text-zinc-300 border border-white/10'}`}>
          <span aria-hidden="true">{opt?.emoji}</span>
          {opt?.label ?? displayCategory(project.category)}
        </span>
        <time className="text-xs text-zinc-500" dateTime={project.createdAt}>
          {relativeTime(project.createdAt)}
        </time>
      </div>

      {/* Title */}
      <h2 className="mb-1.5 line-clamp-2 text-base font-bold leading-snug text-zinc-100 group-hover:text-amber-300">
        {project.title}
      </h2>

      {/* Description */}
      <p className="flex-1 line-clamp-3 text-sm leading-relaxed text-zinc-400">
        {project.description ?? 'Projeto sem descrição.'}
      </p>

      {/* Fork badge */}
      {project.parentId && (
        <div className="mt-3">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
            Fork de #{project.parentId}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        {/* Creator */}
        <Link
          href={`/profile/${project.creatorId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 group/creator"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-black text-black">
            {initials}
          </div>
          <span className="text-xs text-zinc-500 group-hover/creator:text-amber-400 transition-colors">
            {project.creatorName ?? 'Maker'}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isVoting}
            onClick={() => onVote(project.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition-all hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconArrowUp />
            {isVoting ? '…' : project.votes}
          </button>
          <Link
            href={`/projects/${project.id}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-white/20 hover:text-zinc-200"
          >
            Ver
          </Link>
          <button
            type="button"
            disabled={isForking}
            onClick={() => onFork(project.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconFork />
            {isForking ? '…' : 'Fork'}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [response, setResponse] = useState<ProjectsFeedResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const categoryQuery = useMemo(() => selectedCategory === 'ALL' ? null : selectedCategory, [selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchProjectsFeed({ page, pageSize: PAGE_SIZE, sort, category: categoryQuery, q: searchQuery, signal: controller.signal });
        setResponse(payload);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erro inesperado.');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [categoryQuery, page, searchQuery, sort]);

  async function handleFork(projectId: number) {
    setForkingProjectId(projectId);
    setError(null);
    try {
      await forkProject(projectId);
      setPage(1); setSearchQuery(''); setSearchInput(''); setSelectedCategory('ALL'); setSort('newest');
      setLoading(true);
      const payload = await fetchProjectsFeed({ page: 1, pageSize: PAGE_SIZE, sort: 'newest' });
      setResponse(payload);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fork.');
      setLoading(false);
    } finally {
      setForkingProjectId(null);
    }
  }

  async function handleVote(projectId: number) {
    setVotingProjectId(projectId);
    setError(null);
    try {
      const payload = await voteProject(projectId);
      setResponse((prev) => {
        if (!prev) return prev;
        return { ...prev, data: prev.data.map((p) => p.id === payload.data.projectId ? { ...p, votes: payload.data.votes } : p) };
      });
      if (payload.data.alreadyVoted) setError('Você já votou neste projeto.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao votar.');
    } finally {
      setVotingProjectId(null);
    }
  }

  const hasActiveSearch = searchQuery.trim().length > 0;

  async function handleCreated() {
    setShowCreate(false);
    setPage(1); setSearchQuery(''); setSearchInput(''); setSelectedCategory('ALL'); setSort('newest');
    setLoading(true);
    const payload = await fetchProjectsFeed({ page: 1, pageSize: PAGE_SIZE, sort: 'newest' });
    setResponse(payload);
    setLoading(false);
  }

  return (
    <>
    {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            FEED DE <span className="text-amber-400">INOVAÇÕES</span>
          </h1>
          <p className="text-sm text-zinc-400">Explore, vote e faça fork dos melhores projetos maker.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
        >
          + Criar Projeto
        </button>
      </div>

      {/* Search + Sort bar */}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); setPage(1); setSearchQuery(searchInput); }}
      >
        <div className="relative min-w-[180px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="h-10 w-full rounded-lg border border-white/10 bg-slate-800 pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-amber-500 px-4 text-sm font-bold text-black transition hover:bg-amber-400">
          Buscar
        </button>
        {hasActiveSearch && (
          <button type="button" onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }} className="h-10 rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-400 transition hover:text-zinc-200">
            ✕
          </button>
        )}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as FeedSort); setPage(1); }}
          className="ml-auto h-10 rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-300 outline-none focus:border-amber-500/50"
        >
          <option value="newest">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="top">Mais votados</option>
        </select>
      </form>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setSelectedCategory('ALL'); setPage(1); }}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${selectedCategory === 'ALL' ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'}`}
        >
          Todas
        </button>
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setSelectedCategory(opt.value); setPage(1); }}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              selectedCategory === opt.value ? opt.filterActive : opt.filterHover
            }`}
          >
            <span>{opt.emoji}</span> {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && response && response.data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-base font-semibold text-zinc-400">Nenhum projeto encontrado</p>
          <p className="text-sm text-zinc-500">Tente ajustar os filtros ou a busca.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && response && response.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {response.data.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onVote={handleVote}
              onFork={handleFork}
              isVoting={votingProjectId === project.id}
              isForking={forkingProjectId === project.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && response && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            <span className="font-bold text-zinc-300">{response.pagination.total}</span> projetos · página {response.pagination.page} de {response.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={response.pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={response.pagination.page >= response.pagination.totalPages}
              onClick={() => setPage((p) => Math.min(response.pagination.totalPages, p + 1))}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
