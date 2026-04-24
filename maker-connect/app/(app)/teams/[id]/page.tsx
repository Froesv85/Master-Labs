'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

type Member = { id: number; role: string; joinedAt: string; user: { id: number; name: string | null; profile?: { makerLevel: string; reputation: number } | null } };
type Team = { id: number; name: string; description: string | null; ownerId: number; owner: { id: number; name: string | null }; members: Member[]; createdAt: string };

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'Fundador', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  admin: { label: 'Admin', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  member: { label: 'Membro', color: 'bg-slate-700 text-zinc-300 border-white/10' },
};

const LEVEL_LABEL: Record<string, string> = {
  apprentice: 'Aprendiz', journeyman: 'Artesão', master: 'Master', grandmaster: 'Grandmaster',
};

function Avatar({ name, size = 'md' }: { name: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : '?';
  const cls = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-base', lg: 'h-16 w-16 text-xl' }[size];
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-black`}>
      {initials}
    </div>
  );
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teams/${id}`)
      .then((r) => r.json())
      .then((data) => { setTeam(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  if (!team) return <div className="py-16 text-center text-zinc-500">Equipe não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/teams" className="hover:text-amber-400">Equipes</Link>
        <span>/</span>
        <span className="text-zinc-300">{team.name}</span>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-4xl">
              👥
            </div>
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-black text-white sm:text-3xl">{team.name}</h1>
              <p className="text-sm text-zinc-400">Fundada por {team.owner.name} · {new Date(team.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
              {team.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{team.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-amber-400">{team.members.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Membros</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-amber-400">Membros da Equipe</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((m) => {
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
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${roleCfg.color}`}>
                      {roleCfg.label}
                    </span>
                  </div>
                  {m.user.profile && (
                    <p className="text-xs text-zinc-500">
                      {LEVEL_LABEL[m.user.profile.makerLevel] ?? m.user.profile.makerLevel} · {m.user.profile.reputation} rep
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-600">
                    Desde {new Date(m.joinedAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
