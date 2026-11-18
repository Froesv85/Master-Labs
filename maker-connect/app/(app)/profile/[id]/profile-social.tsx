'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// ─── Tipos compartilhados com a página de perfil ─────────────────────────────

export type ReputationKey = 'publicProject' | 'voteReceived' | 'forkReceived' | 'follower' | 'robotAward';
export type ReputationData = {
  total: number;
  level: string;
  nextLevel: { level: string; min: number } | null;
  breakdown: { key: ReputationKey; count: number; each: number; points: number }[];
};

type Connection = {
  since: string;
  followedByMe: boolean;
  isMe: boolean;
  user: {
    id: number;
    name: string | null;
    profile: { avatarUrl: string | null; makerLevel: string; reputation: number } | null;
  };
};

const LEVEL_LABEL: Record<string, string> = {
  apprentice: 'Aprendiz',
  journeyman: 'Artesão',
  master: 'Master',
  grandmaster: 'Grandmaster',
};

const REPUTATION_LABEL: Record<ReputationKey, { label: string }> = {
  publicProject: { label: 'Projetos públicos' },
  voteReceived: { label: 'Votos recebidos' },
  forkReceived: { label: 'Forks dos seus projetos' },
  follower: { label: 'Seguidores' },
  robotAward: { label: 'Premiações de robôs' },
};

// ─── Chamada de seguir / deixar de seguir ────────────────────────────────────

export type FollowResult = { following: boolean; followers: number; reputation: number; makerLevel: string };

export async function toggleFollow(userId: number, follow: boolean): Promise<FollowResult> {
  const res = await fetch(`/api/users/${userId}/follow`, { method: follow ? 'POST' : 'DELETE' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível atualizar.');
  return data as FollowResult;
}

export function FollowButton({
  userId, following, onChange, size = 'md',
}: {
  userId: number;
  following: boolean;
  onChange: (r: FollowResult) => void;
  size?: 'sm' | 'md';
}) {
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  async function click() {
    setBusy(true);
    try {
      onChange(await toggleFollow(userId, !following));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao seguir.');
    } finally {
      setBusy(false);
    }
  }

  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-1.5 text-xs';
  const cls = following
    ? 'border border-white/15 bg-white/5 text-zinc-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300'
    : 'bg-amber-500 text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] hover:bg-amber-400';

  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`shrink-0 rounded-lg font-bold transition disabled:opacity-50 ${pad} ${cls}`}
    >
      {busy ? '...' : following ? (hover ? 'Deixar de seguir' : 'Seguindo') : 'Seguir'}
    </button>
  );
}

// ─── Modal base ──────────────────────────────────────────────────────────────

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1829] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-black text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-xl leading-none text-zinc-500 hover:text-zinc-200">×</button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Lista de seguidores / seguindo ──────────────────────────────────────────

export function ConnectionsModal({
  userId, type, onClose, onMyFollowChange,
}: {
  userId: number;
  type: 'followers' | 'following';
  onClose: () => void;
  // avisa a página quando quem está vendo segue/deixa de seguir alguém da lista
  onMyFollowChange?: (targetId: number, r: FollowResult) => void;
}) {
  const [rows, setRows] = useState<Connection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/users/${userId}/connections?type=${type}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error ?? 'Falha ao carregar.');
        return d as Connection[];
      })
      .then((d) => { if (alive) setRows(d); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Falha ao carregar.'); });
    return () => { alive = false; };
  }, [userId, type]);

  const title = type === 'followers' ? 'Seguidores' : 'Seguindo';
  const empty = type === 'followers' ? 'Ninguém segue este maker ainda.' : 'Este maker ainda não segue ninguém.';

  return (
    <Sheet title={title} onClose={onClose}>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!rows && !error && <p className="text-sm text-zinc-500">Carregando...</p>}
      {rows && rows.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">{empty}</p>}
      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r) => {
            const initials = (r.user.name ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
            return (
              <li key={r.user.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-800/50 p-3">
                <Link href={`/profile/${r.user.id}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                  {r.user.profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.user.profile.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-black">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-100 hover:text-amber-400">{r.user.name ?? 'Maker Anônimo'}</p>
                    <p className="text-xs text-zinc-500">
                      {LEVEL_LABEL[r.user.profile?.makerLevel ?? 'apprentice'] ?? 'Aprendiz'} · {r.user.profile?.reputation ?? 0} rep
                    </p>
                  </div>
                </Link>
                {!r.isMe && (
                  <FollowButton
                    size="sm"
                    userId={r.user.id}
                    following={r.followedByMe}
                    onChange={(res) => {
                      setRows((prev) => prev?.map((x) => x.user.id === r.user.id ? { ...x, followedByMe: res.following } : x) ?? prev);
                      onMyFollowChange?.(r.user.id, res);
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

// ─── Detalhe da reputação ────────────────────────────────────────────────────

export function ReputationModal({ reputation, onClose }: { reputation: ReputationData; onClose: () => void }) {
  const { total, level, nextLevel, breakdown } = reputation;
  const progress = nextLevel ? Math.min(100, Math.round((total / nextLevel.min) * 100)) : 100;

  return (
    <Sheet title="Reputação" onClose={onClose}>
      <div className="mb-5 text-center">
        <div className="text-4xl font-black text-amber-400">{total}</div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">pontos · nível {LEVEL_LABEL[level] ?? level}</div>
      </div>

      <div className="mb-6">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-center text-xs text-zinc-400">
          {nextLevel
            ? <>Faltam <b className="text-zinc-200">{nextLevel.min - total}</b> pontos para <b className="text-zinc-200">{LEVEL_LABEL[nextLevel.level] ?? nextLevel.level}</b></>
            : 'Nível máximo alcançado'}
        </p>
      </div>

      <ul className="divide-y divide-white/8 rounded-xl border border-white/8 bg-slate-800/40">
        {breakdown.map((b) => {
          const cfg = REPUTATION_LABEL[b.key];
          return (
            <li key={b.key} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-zinc-200">{cfg.label}</p>
                <p className="text-xs text-zinc-500">{b.count} × {b.each} pts</p>
              </div>
              <span className={`font-black ${b.points ? 'text-amber-400' : 'text-zinc-600'}`}>+{b.points}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
        Só contam ações de outras pessoas: votar ou fazer fork no próprio projeto não soma pontos.
      </p>
    </Sheet>
  );
}
