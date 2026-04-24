'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Community = {
  id: number; name: string; description: string | null; category: string;
  creator: { id: number; name: string | null };
  _count: { members: number; posts: number };
  createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; accent: string }> = {
  Robotics: { label: 'Robótica', emoji: '🤖', color: 'border-blue-500/30 hover:border-blue-500/50', accent: 'bg-blue-900/40 text-blue-300' },
  Printing3D: { label: '3D Printing', emoji: '🖨️', color: 'border-violet-500/30 hover:border-violet-500/50', accent: 'bg-violet-900/40 text-violet-300' },
  IoT: { label: 'IoT', emoji: '📡', color: 'border-teal-500/30 hover:border-teal-500/50', accent: 'bg-teal-900/40 text-teal-300' },
  Woodworking: { label: 'Woodworking', emoji: '🪵', color: 'border-amber-500/30 hover:border-amber-500/50', accent: 'bg-amber-900/40 text-amber-300' },
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/communities')
      .then((r) => r.json())
      .then((data) => { setCommunities(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter ? communities.filter((c) => c.category === filter) : communities;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            COMUNIDADES <span className="text-amber-400">MAKER</span>
          </h1>
          <p className="text-sm text-zinc-400">Grupos temáticos, discussões e base de conhecimento</p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 sm:flex">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
            {communities.length} comunidades
          </span>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
            !filter ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'
          }`}
        >
          Todas
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              filter === key
                ? 'border-amber-500 bg-amber-500 text-black'
                : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'
            }`}
          >
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filtered.map((c) => {
            const cfg = CATEGORY_CONFIG[c.category] ?? { label: c.category, emoji: '🌐', color: 'border-white/10 hover:border-amber-500/30', accent: 'bg-slate-800 text-zinc-300' };
            return (
              <Link
                key={c.id}
                href={`/communities/${c.id}`}
                className={`group flex flex-col gap-4 rounded-xl border bg-slate-900/60 p-5 transition-all hover:bg-slate-800/80 hover:shadow-[0_0_16px_rgba(245,158,11,0.08)] ${cfg.color}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-800 text-3xl">
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-black text-zinc-100 group-hover:text-amber-300 truncate">{c.name}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.accent}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">por {c.creator.name}</p>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">{c.description}</p>
                )}

                <div className="flex items-center gap-4 border-t border-white/5 pt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400 font-bold">{c._count.members}</span> membros
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-cyan-400 font-bold">{c._count.posts}</span> posts
                  </span>
                  <span className="ml-auto font-semibold text-amber-400 group-hover:text-amber-300">Entrar →</span>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-zinc-500">Nenhuma comunidade encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
}
