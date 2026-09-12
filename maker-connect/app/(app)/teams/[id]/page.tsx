'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Modal, Field, FormActions, inputCls } from '@/components/modal';

type Member = {
  id: number; role: string; status: string; joinedAt: string;
  user: { id: number; name: string | null; profile?: { makerLevel: string; reputation: number } | null };
};
type RobotSummary = {
  id: number; name: string; category: string; status: string; eloScore: number;
  imageUrl: string | null;
  images: { imageUrl: string }[];
  _count: { matches: number };
};
type Team = {
  id: number; name: string; description: string | null; isPublic: boolean;
  ownerId: number; owner: { id: number; name: string | null };
  avatarUrl: string | null; coverUrl: string | null;
  members: Member[]; robots: RobotSummary[]; createdAt: string;
};
type Competition = {
  id: number; name: string; description: string | null; location: string | null;
  eventDate: string; result: string | null; placement: number | null; publishedAt: string | null;
  createdBy: { id: number; name: string | null };
  robots: { id: number; name: string; imageUrl: string | null }[];
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'Fundador', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  admin: { label: 'Admin', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  member: { label: 'Membro', color: 'bg-slate-700 text-zinc-300 border-white/10' },
};

const LEVEL_LABEL: Record<string, string> = {
  apprentice: 'Aprendiz', journeyman: 'Artesão', master: 'Master', grandmaster: 'Grandmaster',
};

const ROBOT_CATEGORY_LABEL: Record<string, string> = {
  sumo: 'Sumo', combat: 'Combate', line_follower: 'Seguidor de Linha',
  autonomous: 'Autônomo', educational: 'Educacional', competition: 'Competição',
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

type JoinStatus = 'none' | 'pending' | 'member' | 'admin' | 'owner';

function JoinButton({
  teamId,
  status,
  isPublic,
  onJoined,
}: {
  teamId: number;
  status: JoinStatus;
  isPublic: boolean;
  onJoined: (newStatus: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'owner' || status === 'admin') return null;

  if (status === 'member') {
    return (
      <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-400">
        Membro
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="rounded-lg border border-zinc-600 bg-slate-800 px-4 py-2 text-sm font-bold text-zinc-400">
        Solicitação enviada
      </span>
    );
  }

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Erro ao afiliar-se à equipe');
        return;
      }
      const body = await res.json();
      onJoined(body.data.status);
    } catch {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? '...' : isPublic ? 'Entrar' : 'Solicitar afiliação'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function AddMemberBox({ teamId, onAdded }: { teamId: number; onAdded: (member: Member) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: number; name: string | null; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    setSearching(true);
    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((body) => setResults(body.data ?? []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query]);

  async function handleAdd(userId: number) {
    setAddingUserId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Erro ao adicionar membro');
        return;
      }
      const body = await res.json();
      onAdded(body.data);
      setResults((prev) => prev.filter((u) => u.id !== userId));
      setQuery('');
    } finally {
      setAddingUserId(null);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Adicionar Membro</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome ou e-mail..."
        className="h-10 w-full rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {searching && <p className="mt-2 text-xs text-zinc-500">Buscando...</p>}
      {!searching && results.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {results.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-xs">
              <span className="min-w-0 truncate text-zinc-300">{u.name ?? u.email}</span>
              <button
                onClick={() => handleAdd(u.id)}
                disabled={addingUserId === u.id}
                className="shrink-0 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
              >
                {addingUserId === u.id ? '...' : 'Adicionar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateCompetitionModal({ teamId, robots, onClose, onCreated }: {
  teamId: number;
  robots: RobotSummary[];
  onClose: () => void;
  onCreated: (c: Competition) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [robotIds, setRobotIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRobot(id: number) {
    setRobotIds((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    if (!eventDate) { setError('Data obrigatória'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/competitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, location, eventDate, robotIds }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao criar'); }
      const body = await res.json();
      onCreated(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar competição');
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova Competição" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: RobôChallenge 2026" className={inputCls} />
        </Field>
        <Field label="Descrição" hint="(opcional)">
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Local" hint="(opcional)">
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Data">
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
          </Field>
        </div>
        {robots.length > 0 && (
          <Field label="Robôs participantes" hint="(opcional)">
            <div className="flex flex-wrap gap-2">
              {robots.map((r) => {
                const active = robotIds.includes(r.id);
                return (
                  <button key={r.id} type="button" onClick={() => toggleRobot(r.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${active ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'}`}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Criar Competição" />
      </form>
    </Modal>
  );
}

function PublishResultForm({ teamId, competition, onPublished }: {
  teamId: number;
  competition: Competition;
  onPublished: (c: Competition) => void;
}) {
  const [result, setResult] = useState('');
  const [placement, setPlacement] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result.trim()) { setError('Descreva o resultado'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/competitions/${competition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, ...(placement ? { placement: Number(placement) } : {}) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao publicar'); }
      const body = await res.json();
      onPublished(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar resultado');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/5 pt-3">
      <input value={result} onChange={(e) => setResult(e.target.value)} placeholder="Resultado (ex: 3º lugar geral)"
        className="min-w-[180px] flex-1 h-9 rounded-lg border border-white/10 bg-slate-800 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-amber-500/50" />
      <input type="number" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Posição"
        className="h-9 w-20 rounded-lg border border-white/10 bg-slate-800 px-2 text-center text-xs text-zinc-200 outline-none focus:border-amber-500/50" />
      <button type="submit" disabled={saving}
        className="h-9 rounded-lg bg-amber-500 px-3 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50">
        {saving ? '...' : 'Publicar'}
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<'members' | 'robots' | 'pending' | 'competitions'>('members');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingFetched, setPendingFetched] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionsLoading, setCompetitionsLoading] = useState(false);
  const [competitionsFetched, setCompetitionsFetched] = useState(false);
  const [showCreateCompetition, setShowCreateCompetition] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/teams/${id}`).then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
    ]).then(([teamData, sessionData]) => {
      setTeam(teamData);
      if (sessionData?.userId) {
        setCurrentUserId(sessionData.userId);
        setCurrentUserName(sessionData.name ?? null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  if (!team) return <div className="py-16 text-center text-zinc-500">Equipe não encontrada.</div>;

  const approvedMembers = team.members.filter((m) => m.status === 'approved');

  const myMembership = currentUserId
    ? team.members.find((m) => m.user.id === currentUserId)
    : null;

  const joinStatus: JoinStatus = (() => {
    if (!myMembership) return 'none';
    if (myMembership.status === 'pending') return 'pending';
    return myMembership.role as JoinStatus;
  })();

  const isManager = joinStatus === 'owner' || joinStatus === 'admin';

  async function handleDeleteTeam() {
    if (!team) return;
    if (!window.confirm(`Excluir a equipe "${team.name}"? Essa ação não pode ser desfeita. Robôs e projetos vinculados ficarão sem equipe.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? 'Falha ao excluir equipe.');
      }
      router.push('/teams');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro inesperado ao excluir equipe.');
      setDeleting(false);
    }
  }

  function handleJoined(newStatus: string) {
    if (!currentUserId || !team) return;
    setTeam((prev) => {
      if (!prev) return prev;
      const fakeMember: Member = {
        id: Date.now(),
        role: 'member',
        status: newStatus,
        joinedAt: new Date().toISOString(),
        user: { id: currentUserId!, name: currentUserName },
      };
      return { ...prev, members: [...prev.members, fakeMember] };
    });
  }

  function handleMemberAdded(member: Member) {
    setTeam((prev) => prev ? { ...prev, members: [...prev.members, member] } : prev);
  }

  function openPendingTab() {
    setTab('pending');
    if (pendingFetched) return;
    setPendingLoading(true);
    fetch(`/api/teams/${id}/members?status=pending`)
      .then((r) => r.json())
      .then((body) => { setPendingMembers(body.data ?? []); setPendingFetched(true); })
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }

  function openCompetitionsTab() {
    setTab('competitions');
    if (competitionsFetched) return;
    setCompetitionsLoading(true);
    fetch(`/api/teams/${id}/competitions`)
      .then((r) => r.json())
      .then((body) => { setCompetitions(body.data ?? []); setCompetitionsFetched(true); })
      .catch(() => {})
      .finally(() => setCompetitionsLoading(false));
  }

  function handleCompetitionCreated(c: Competition) {
    setCompetitions((prev) => [c, ...prev]);
    setShowCreateCompetition(false);
  }

  function handleCompetitionPublished(updated: Competition) {
    setCompetitions((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }

  async function handleMemberAction(userId: number, action: 'approve' | 'reject') {
    setProcessingUserId(userId);
    try {
      const res = await fetch(`/api/teams/${id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setPendingMembers((prev) => prev.filter((m) => m.user.id !== userId));
        if (action === 'approve') {
          setTeam((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              members: prev.members.map((m) => m.user.id === userId ? { ...m, status: 'approved' } : m),
            };
          });
        }
      }
    } finally {
      setProcessingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/teams" className="hover:text-amber-400">Equipes</Link>
        <span>/</span>
        <span className="text-zinc-300">{team.name}</span>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
        {team.coverUrl ? (
          <img src={team.coverUrl} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 text-4xl">
              {team.avatarUrl ? <img src={team.avatarUrl} alt="" className="h-full w-full object-cover" /> : '👥'}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-white sm:text-3xl">{team.name}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  team.isPublic
                    ? 'border-teal-500/30 bg-teal-900/30 text-teal-400'
                    : 'border-violet-500/30 bg-violet-900/30 text-violet-400'
                }`}>
                  {team.isPublic ? 'Pública' : 'Privada'}
                </span>
              </div>
              <p className="text-sm text-zinc-400">Fundada por {team.owner.name} · {new Date(team.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
              {team.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{team.description}</p>
              )}
            </div>
            <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
              <div className="flex gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <div className="text-2xl font-black text-amber-400">{approvedMembers.length}</div>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">Membros</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <div className="text-2xl font-black text-cyan-400">{team.robots.length}</div>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">Robôs</div>
                </div>
              </div>
              {currentUserId && (
                <JoinButton
                  teamId={team.id}
                  status={joinStatus}
                  isPublic={team.isPublic}
                  onJoined={handleJoined}
                />
              )}
              {joinStatus === 'owner' && (
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={deleting}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
                >
                  {deleting ? 'Excluindo…' : 'Excluir equipe'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1">
        <button
          onClick={() => setTab('members')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'members' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Membros ({approvedMembers.length})
        </button>
        <button
          onClick={() => setTab('robots')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'robots' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Robôs ({team.robots.length})
        </button>
        <button
          onClick={openCompetitionsTab}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'competitions' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Competições {competitionsFetched ? `(${competitions.length})` : ''}
        </button>
        {isManager && (
          <button
            onClick={openPendingTab}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'pending' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Pendentes {pendingFetched && pendingMembers.length > 0 ? `(${pendingMembers.length})` : ''}
          </button>
        )}
      </div>

      {showCreateCompetition && (
        <CreateCompetitionModal
          teamId={team.id}
          robots={team.robots}
          onClose={() => setShowCreateCompetition(false)}
          onCreated={handleCompetitionCreated}
        />
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="space-y-4">
          {isManager && <AddMemberBox teamId={team.id} onAdded={handleMemberAdded} />}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {approvedMembers.length === 0 && (
              <p className="col-span-full py-8 text-center text-zinc-500">Nenhum membro ainda.</p>
            )}
            {approvedMembers.map((m) => {
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
      )}

      {/* Robots */}
      {tab === 'robots' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link href="/robots" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
              Ver ranking geral de robôs →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.robots.length === 0 && (
              <p className="col-span-full py-8 text-center text-zinc-500">Nenhum robô cadastrado nesta equipe.</p>
            )}
            {team.robots.map((r) => (
              <Link
                key={r.id}
                href={`/robots/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-800">
                  {(r.images[0]?.imageUrl ?? r.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.images[0]?.imageUrl ?? r.imageUrl ?? ''} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg opacity-40">🤖</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-100 truncate">{r.name}</p>
                  <p className="text-xs text-zinc-500">{ROBOT_CATEGORY_LABEL[r.category] ?? r.category} · {r._count.matches} partidas</p>
                </div>
                <span className="shrink-0 text-sm font-black text-amber-400">{r.eloScore}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pendingLoading && (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          )}
          {!pendingLoading && pendingMembers.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhuma solicitação pendente.</p>
          )}
          {pendingMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <Avatar name={m.user.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-100 truncate">{m.user.name ?? `Usuário #${m.user.id}`}</p>
                <p className="text-[11px] text-zinc-500">
                  Solicitou em {new Date(m.joinedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleMemberAction(m.user.id, 'approve')}
                  disabled={processingUserId === m.user.id}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-500 disabled:opacity-50"
                >
                  {processingUserId === m.user.id ? '...' : 'Aprovar'}
                </button>
                <button
                  onClick={() => handleMemberAction(m.user.id, 'reject')}
                  disabled={processingUserId === m.user.id}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Competitions */}
      {tab === 'competitions' && (
        <div className="space-y-3">
          {isManager && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateCompetition(true)}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
              >
                + Nova Competição
              </button>
            </div>
          )}
          {competitionsLoading && (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )}
          {!competitionsLoading && competitions.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhuma competição registrada ainda.</p>
          )}
          {competitions.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-zinc-100">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(c.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {c.location ? ` · ${c.location}` : ''}
                  </p>
                </div>
                {c.publishedAt ? (
                  <span className="shrink-0 rounded-full border border-teal-500/30 bg-teal-900/30 px-2.5 py-0.5 text-[11px] font-bold text-teal-400">
                    {c.placement ? `${c.placement}º lugar` : 'Resultado publicado'}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-zinc-600 bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-zinc-400">
                    Aguardando resultado
                  </span>
                )}
              </div>
              {c.description && <p className="mt-2 text-xs leading-relaxed text-zinc-400">{c.description}</p>}
              {c.robots.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.robots.map((r) => (
                    <Link key={r.id} href={`/robots/${r.id}`}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-300 hover:border-amber-500/40 hover:text-amber-300">
                      🤖 {r.name}
                    </Link>
                  ))}
                </div>
              )}
              {c.publishedAt && c.result && (
                <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300">{c.result}</p>
              )}
              {isManager && !c.publishedAt && (
                <PublishResultForm teamId={team.id} competition={c} onPublished={handleCompetitionPublished} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
