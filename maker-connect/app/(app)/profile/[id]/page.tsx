'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { use } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type MakerLevel = 'apprentice' | 'journeyman' | 'master' | 'grandmaster';

type Badge = { id: number; type: string; title: string; earnedAt: string };
type Robot = { id: number; name: string; category: string; wins: number; losses: number; draws: number; eloScore: number; awards: { title: string }[] };
type Project = { id: number; title: string; category: string; createdAt: string };
type Team = { team: { id: number; name: string; members: unknown[] } };
type Community = { community: { id: number; name: string; category: string } };

type UserData = {
  id: number;
  name: string | null;
  email: string;
  profile: {
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    website: string | null;
    githubUrl: string | null;
    makerLevel: MakerLevel;
    reputation: number;
    expertise: string | null;
  } | null;
  badges: Badge[];
  robots: Robot[];
  projects: Project[];
  teamMemberships: Team[];
  communities: Community[];
  following: { followingId: number }[];
  followers: { followerId: number }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<MakerLevel, { label: string; color: string; bg: string }> = {
  apprentice: { label: 'Aprendiz', color: 'text-zinc-300', bg: 'bg-zinc-700' },
  journeyman: { label: 'Artesão', color: 'text-blue-400', bg: 'bg-blue-900/40' },
  master: { label: 'Master', color: 'text-amber-400', bg: 'bg-amber-900/40' },
  grandmaster: { label: 'Grandmaster', color: 'text-yellow-300', bg: 'bg-yellow-900/40' },
};

const BADGE_CONFIG: Record<string, { icon: string; color: string }> = {
  first_project: { icon: '🚀', color: 'bg-blue-900/50 border-blue-500/40' },
  first_fork: { icon: '🍴', color: 'bg-teal-900/50 border-teal-500/40' },
  robot_master: { icon: '🤖', color: 'bg-amber-900/50 border-amber-500/40' },
  team_player: { icon: '👥', color: 'bg-violet-900/50 border-violet-500/40' },
  documentation_hero: { icon: '📚', color: 'bg-emerald-900/50 border-emerald-500/40' },
  champion: { icon: '🏆', color: 'bg-yellow-900/50 border-yellow-500/40' },
  arena_legend: { icon: '⚡', color: 'bg-orange-900/50 border-orange-500/40' },
  grandmaster: { icon: '👑', color: 'bg-yellow-900/50 border-yellow-400/50' },
  rag_pioneer: { icon: '🧠', color: 'bg-cyan-900/50 border-cyan-500/40' },
  iot_expert: { icon: '📡', color: 'bg-teal-900/50 border-teal-500/40' },
};

const CATEGORY_BADGE: Record<string, string> = {
  Printing3D: 'bg-violet-900/60 text-violet-300 border border-violet-500/30',
  Robotics: 'bg-blue-900/60 text-blue-300 border border-blue-500/30',
  IoT: 'bg-teal-900/60 text-teal-300 border border-teal-500/30',
  Woodworking: 'bg-amber-900/60 text-amber-300 border border-amber-500/30',
};

const CATEGORY_LABEL: Record<string, string> = {
  Printing3D: '3D Printing', Robotics: 'Robotics', IoT: 'IoT', Woodworking: 'Woodworking',
  sumo: 'Sumo', line_follower: 'Line Follower', combat: 'Combate',
  autonomous: 'Autônomo', educational: 'Educacional', competition: 'Competição',
};

function Avatar({ name, size = 'lg' }: { name: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = name ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : '?';
  const cls = { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' }[size];
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-black shadow-[0_0_16px_rgba(245,158,11,0.4)]`}>
      {initials}
    </div>
  );
}

function WinRateBadge({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = rate >= 70 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-sm font-bold ${color}`}>{rate}%</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'projects' | 'robots' | 'teams' | 'communities'>('projects');

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <div className="py-16 text-center text-zinc-500">Perfil não encontrado.</div>;
  }

  const level = user.profile?.makerLevel ?? 'apprentice';
  const levelCfg = LEVEL_CONFIG[level];
  const expertise: string[] = user.profile?.expertise ? JSON.parse(user.profile.expertise) : [];

  return (
    <div className="space-y-6">
      {/* ── Profile Hero Card ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
        {/* Banner strip */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar + level */}
            <div className="flex flex-col items-center gap-2">
              <Avatar name={user.name} size="xl" />
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${levelCfg.bg} ${levelCfg.color}`}>
                {levelCfg.label}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-black text-white sm:text-3xl">{user.name ?? 'Maker Anônimo'}</h1>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>

              {user.profile?.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{user.profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                {user.profile?.location && <span>📍 {user.profile.location}</span>}
                {user.profile?.website && (
                  <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    🌐 Website
                  </a>
                )}
                {user.profile?.githubUrl && (
                  <a href={user.profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                    ⌥ GitHub
                  </a>
                )}
              </div>

              {/* Expertise tags */}
              {expertise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {expertise.map((tag) => (
                    <span key={tag} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats panel — RoboCore style */}
            <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
              {[
                { label: 'Reputação', value: user.profile?.reputation ?? 0, color: 'text-amber-400' },
                { label: 'Seguidores', value: user.followers.length, color: 'text-cyan-400' },
                { label: 'Seguindo', value: user.following.length, color: 'text-violet-400' },
                { label: 'Projetos', value: user.projects.length, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="min-w-[72px] rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <div className={`text-xl font-black ${color}`}>{value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Badges ───────────────────────────────────────────────────── */}
      {user.badges.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-amber-400">Conquistas</h2>
          <div className="flex flex-wrap gap-3">
            {user.badges.map((badge) => {
              const cfg = BADGE_CONFIG[badge.type] ?? { icon: '🎖️', color: 'bg-slate-800 border-white/10' };
              return (
                <div key={badge.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${cfg.color}`}>
                  <span className="text-lg">{cfg.icon}</span>
                  <span className="text-xs font-semibold text-zinc-200">{badge.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab Nav ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1">
        {([
          { key: 'projects', label: 'Projetos', count: user.projects.length },
          { key: 'robots', label: 'Robôs', count: user.robots.length },
          { key: 'teams', label: 'Equipes', count: user.teamMemberships.length },
          { key: 'communities', label: 'Comunidades', count: user.communities.length },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${
              tab === key
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {label} <span className="opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* ── Projects Tab ─────────────────────────────────────────────── */}
      {tab === 'projects' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.projects.length === 0 && (
            <p className="col-span-full py-8 text-center text-zinc-500">Nenhum projeto ainda.</p>
          )}
          {user.projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{p.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE[p.category] ?? 'bg-slate-700 text-zinc-300'}`}>
                  {CATEGORY_LABEL[p.category] ?? p.category}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Robots Tab ───────────────────────────────────────────────── */}
      {tab === 'robots' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {user.robots.length === 0 && (
            <p className="col-span-full py-8 text-center text-zinc-500">Nenhum robô cadastrado.</p>
          )}
          {user.robots.map((robot) => (
            <Link
              key={robot.id}
              href={`/robots/${robot.id}`}
              className="group flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-2xl">
                🤖
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{robot.name}</h3>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                    {CATEGORY_LABEL[robot.category] ?? robot.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="text-emerald-400 font-semibold">{robot.wins}V</span>
                  <span className="text-red-400 font-semibold">{robot.losses}D</span>
                  <span className="text-zinc-500">{robot.draws}E</span>
                  <span className="ml-auto font-mono text-amber-400">ELO {robot.eloScore}</span>
                </div>
                {robot.awards.length > 0 && (
                  <p className="text-[11px] text-yellow-400">🏆 {robot.awards[0].title}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Teams Tab ────────────────────────────────────────────────── */}
      {tab === 'teams' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.teamMemberships.length === 0 && (
            <p className="col-span-full py-8 text-center text-zinc-500">Nenhuma equipe.</p>
          )}
          {user.teamMemberships.map(({ team }) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">👥</span>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{team.name}</h3>
              </div>
              <p className="text-xs text-zinc-500">{team.members.length} membros</p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Communities Tab ──────────────────────────────────────────── */}
      {tab === 'communities' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.communities.length === 0 && (
            <p className="col-span-full py-8 text-center text-zinc-500">Nenhuma comunidade.</p>
          )}
          {user.communities.map(({ community: c }) => (
            <Link
              key={c.id}
              href={`/communities/${c.id}`}
              className="group rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{c.name}</h3>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE[c.category] ?? 'bg-slate-700 text-zinc-300'}`}>
                {CATEGORY_LABEL[c.category] ?? c.category}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
