'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

type Post = { id: number; title: string; content: string; replies: number; views: number; createdAt: string; author: { id: number; name: string | null } };
type Member = { id: number; role: string; joinedAt: string; user: { id: number; name: string | null } };
type Community = {
  id: number; name: string; description: string | null; category: string;
  creator: { id: number; name: string | null };
  members: Member[];
  posts: Post[];
  createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  Robotics: { emoji: '🤖', color: 'from-blue-900/40 to-[#0f1829]' },
  Printing3D: { emoji: '🖨️', color: 'from-violet-900/40 to-[#0f1829]' },
  IoT: { emoji: '📡', color: 'from-teal-900/40 to-[#0f1829]' },
  Woodworking: { emoji: '🪵', color: 'from-amber-900/40 to-[#0f1829]' },
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  founder: { label: 'Fundador', color: 'text-amber-400' },
  moderator: { label: 'Mod', color: 'text-blue-400' },
  member: { label: 'Membro', color: 'text-zinc-500' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Avatar({ name, size = 'sm' }: { name: string | null; size?: 'sm' | 'md' }) {
  const initials = name ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : '?';
  const cls = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-black`}>
      {initials}
    </div>
  );
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'members'>('posts');

  useEffect(() => {
    fetch(`/api/communities/${id}`)
      .then((r) => r.json())
      .then((data) => { setCommunity(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  if (!community) return <div className="py-16 text-center text-zinc-500">Comunidade não encontrada.</div>;

  const catCfg = CATEGORY_CONFIG[community.category] ?? { emoji: '🌐', color: 'from-slate-900 to-[#0f1829]' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/communities" className="hover:text-amber-400">Comunidades</Link>
        <span>/</span>
        <span className="text-zinc-300">{community.name}</span>
      </div>

      {/* Hero */}
      <div className={`overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br ${catCfg.color}`}>
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-5xl">
              {catCfg.emoji}
            </div>
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-black text-white sm:text-3xl">{community.name}</h1>
              <p className="text-sm text-zinc-400">Criada por {community.creator.name} · {new Date(community.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
              {community.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{community.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-amber-400">{community.members.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Membros</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-cyan-400">{community.posts.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Posts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1">
        {([
          { key: 'posts', label: 'Discussões', count: community.posts.length },
          { key: 'members', label: 'Membros', count: community.members.length },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${
              tab === key ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {community.posts.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhum post ainda.</p>
          )}
          {community.posts.map((post) => (
            <div key={post.id} className="group rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-amber-500/20 hover:bg-slate-800/60">
              <div className="flex items-start gap-3">
                <Avatar name={post.author.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-bold text-zinc-100 group-hover:text-amber-300">{post.title}</h3>
                    <span className="shrink-0 text-xs text-zinc-500">{relativeTime(post.createdAt)}</span>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-zinc-400 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-600">
                    <Link href={`/profile/${post.author.id}`} className="font-medium text-amber-400/70 hover:text-amber-400">
                      {post.author.name}
                    </Link>
                    <span className="flex items-center gap-1">
                      💬 <span className="text-zinc-400">{post.replies} respostas</span>
                    </span>
                    <span className="flex items-center gap-1">
                      👁 <span className="text-zinc-400">{post.views} views</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {community.members.map((m) => {
            const roleCfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member;
            return (
              <Link
                key={m.id}
                href={`/profile/${m.user.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
              >
                <Avatar name={m.user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 truncate">{m.user.name}</span>
                    <span className={`text-[10px] font-bold uppercase ${roleCfg.color}`}>{roleCfg.label}</span>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Membro desde {new Date(m.joinedAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
