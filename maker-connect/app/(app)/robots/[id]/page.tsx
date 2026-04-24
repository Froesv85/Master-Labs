'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

type Match = { id: number; opponentName: string; result: string; myScore: number | null; opponentScore: number | null; eventName: string | null; matchDate: string; notes: string | null };
type Award = { id: number; title: string; placement: number | null; year: number; event: { name: string; location: string | null } | null };
type Participation = { id: number; placement: number | null; event: { id: number; name: string; location: string | null; eventDate: string; category: string | null } };
type Robot = {
  id: number; name: string; description: string | null; category: string; status: string;
  wins: number; losses: number; draws: number; eloScore: number;
  owner: { id: number; name: string | null };
  matches: Match[];
  awards: Award[];
  participations: Participation[];
};

const RESULT_CONFIG = {
  win: { label: 'VITÓRIA', color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-500/30' },
  loss: { label: 'DERROTA', color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/30' },
  draw: { label: 'EMPATE', color: 'text-zinc-400', bg: 'bg-zinc-800/60 border-white/10' },
  dnf: { label: 'DNF', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-500/30' },
};

const PLACEMENT_ICON: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RobotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'matches' | 'events' | 'awards'>('matches');

  useEffect(() => {
    fetch(`/api/robots/${id}`)
      .then((r) => r.json())
      .then((data) => { setRobot(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  }
  if (!robot) return <div className="py-16 text-center text-zinc-500">Robô não encontrado.</div>;

  const total = robot.wins + robot.losses + robot.draws;
  const winRate = total > 0 ? Math.round((robot.wins / total) * 100) : 0;
  const eloColor = robot.eloScore >= 1400 ? 'text-yellow-300' : robot.eloScore >= 1200 ? 'text-amber-400' : robot.eloScore >= 1100 ? 'text-cyan-400' : 'text-zinc-400';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/robots" className="hover:text-amber-400">Robôs</Link>
        <span>/</span>
        <span className="text-zinc-300">{robot.name}</span>
      </div>

      {/* Hero Card */}
      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Icon */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-5xl shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              🤖
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-white sm:text-3xl">{robot.name}</h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    robot.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {robot.status === 'active' ? '● ATIVO' : robot.status.toUpperCase()}
                  </span>
                </div>
                <Link href={`/profile/${robot.owner.id}`} className="text-sm text-zinc-400 hover:text-amber-400">
                  Dono: {robot.owner.name}
                </Link>
              </div>
              {robot.description && (
                <p className="max-w-xl text-sm leading-relaxed text-zinc-300">{robot.description}</p>
              )}
              <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-400">
                {robot.category.replace('_', ' ')}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className={`text-2xl font-black ${eloColor}`}>{robot.eloScore}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">ELO</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-amber-400">{winRate}%</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Win Rate</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-emerald-400">{robot.wins}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Vitórias</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-yellow-400">{robot.awards.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Prêmios</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Awards shelf */}
      {robot.awards.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-yellow-400">Premiações</h2>
          <div className="flex flex-wrap gap-3">
            {robot.awards.map((award) => (
              <div key={award.id} className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-900/20 px-4 py-2">
                <span className="text-xl">{award.placement ? PLACEMENT_ICON[award.placement] ?? '🏅' : '🏅'}</span>
                <div>
                  <p className="text-xs font-bold text-yellow-200">{award.title}</p>
                  {award.event && <p className="text-[11px] text-zinc-400">{award.event.name} · {award.year}</p>}
                  {!award.event && <p className="text-[11px] text-zinc-400">{award.year}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1">
        {([
          { key: 'matches', label: 'Partidas', count: robot.matches.length },
          { key: 'events', label: 'Eventos', count: robot.participations.length },
          { key: 'awards', label: 'Prêmios', count: robot.awards.length },
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

      {/* Matches */}
      {tab === 'matches' && (
        <div className="space-y-3">
          {robot.matches.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhuma partida registrada.</p>
          )}
          {robot.matches.map((match) => {
            const cfg = RESULT_CONFIG[match.result as keyof typeof RESULT_CONFIG] ?? RESULT_CONFIG.draw;
            return (
              <div key={match.id} className={`flex items-center gap-4 rounded-xl border p-4 ${cfg.bg}`}>
                {/* Result badge */}
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-xs font-black ${cfg.color} border ${cfg.bg}`}>
                  {cfg.label}
                </div>
                {/* Match info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100">{robot.name}</span>
                    {match.myScore !== null && match.opponentScore !== null && (
                      <span className="font-mono text-sm font-black text-white">{match.myScore} × {match.opponentScore}</span>
                    )}
                    <span className="font-bold text-zinc-100">vs {match.opponentName}</span>
                  </div>
                  {match.eventName && <p className="text-xs text-zinc-400">{match.eventName}</p>}
                  {match.notes && <p className="mt-1 text-xs italic text-zinc-500">{match.notes}</p>}
                </div>
                <div className="shrink-0 text-right text-xs text-zinc-500">
                  {new Date(match.matchDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (
        <div className="space-y-3">
          {robot.participations.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhuma participação registrada.</p>
          )}
          {robot.participations.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                {p.placement ? PLACEMENT_ICON[p.placement] ?? '🏁' : '🏁'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-100">{p.event.name}</h3>
                <p className="text-xs text-zinc-400">
                  {p.event.location ?? '—'} ·{' '}
                  {new Date(p.event.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {p.placement && (
                <div className="shrink-0 text-right">
                  <span className="text-lg">{PLACEMENT_ICON[p.placement] ?? '🏅'}</span>
                  <p className="text-xs text-zinc-400">{p.placement}º lugar</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Awards detail */}
      {tab === 'awards' && (
        <div className="space-y-3">
          {robot.awards.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhum prêmio registrado.</p>
          )}
          {robot.awards.map((award) => (
            <div key={award.id} className="flex items-center gap-4 rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-4">
              <span className="text-3xl">{award.placement ? PLACEMENT_ICON[award.placement] ?? '🏅' : '🏅'}</span>
              <div>
                <h3 className="font-bold text-yellow-200">{award.title}</h3>
                {award.event && (
                  <p className="text-xs text-zinc-400">{award.event.name} {award.event.location ? `· ${award.event.location}` : ''}</p>
                )}
                <p className="text-xs text-zinc-500">{award.year}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
