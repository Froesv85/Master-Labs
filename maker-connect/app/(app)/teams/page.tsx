'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Member = { id: number; role: string; user: { id: number; name: string | null } };
type Team = { id: number; name: string; description: string | null; ownerId: number; owner: { id: number; name: string | null }; members: Member[]; createdAt: string };

function Avatar({ name, size = 'sm' }: { name: string | null; size?: 'sm' | 'md' }) {
  const initials = name ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : '?';
  const cls = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-black`}>
      {initials}
    </div>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data) => { setTeams(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            EQUIPES <span className="text-amber-400">MAKER</span>
          </h1>
          <p className="text-sm text-zinc-400">Times de criação, competição e inovação</p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 sm:flex">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
            {teams.length} equipes ativas
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:border-amber-500/30 hover:bg-slate-800/80 hover:shadow-[0_0_16px_rgba(245,158,11,0.1)]"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-xl">
                  👥
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-zinc-100 group-hover:text-amber-300 truncate">{team.name}</h3>
                  <p className="text-xs text-zinc-500">por {team.owner.name}</p>
                </div>
              </div>

              {/* Description */}
              {team.description && (
                <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">{team.description}</p>
              )}

              {/* Members */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 5).map((m) => (
                    <Avatar key={m.id} name={m.user.name} size="sm" />
                  ))}
                  {team.members.length > 5 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-zinc-300">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{team.members.length} membros</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-zinc-500">
                <span>Criada em {new Date(team.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                <span className="font-semibold text-amber-400 group-hover:text-amber-300">Ver equipe →</span>
              </div>
            </Link>
          ))}
          {teams.length === 0 && (
            <p className="col-span-full py-12 text-center text-zinc-500">Nenhuma equipe cadastrada.</p>
          )}
        </div>
      )}
    </div>
  );
}
