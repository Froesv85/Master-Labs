'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { Modal, Field, FormActions, inputCls } from '@/components/modal';

type Post = {
  id: number; title: string; content: string; mediaUrl: string | null;
  replies: number; views: number;
  createdAt: string; author: { id: number; name: string | null };
};
type Member = {
  id: number; role: string; status: string; joinedAt: string;
  user: { id: number; name: string | null };
};
type Community = {
  id: number; name: string; description: string | null; category: string;
  isPublic: boolean;
  creator: { id: number; name: string | null };
  members: Member[];
  posts: Post[];
  createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  Robotics:   { emoji: '🤖', color: 'from-blue-900/40 to-[#0f1829]' },
  Printing3D: { emoji: '🖨️', color: 'from-violet-900/40 to-[#0f1829]' },
  IoT:        { emoji: '📡', color: 'from-teal-900/40 to-[#0f1829]' },
  Woodworking:{ emoji: '🪵', color: 'from-amber-900/40 to-[#0f1829]' },
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  founder:   { label: 'Fundador', color: 'text-amber-400' },
  moderator: { label: 'Mod',      color: 'text-blue-400' },
  member:    { label: 'Membro',   color: 'text-zinc-500' },
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

type JoinStatus = 'none' | 'pending' | 'member' | 'moderator' | 'founder';

function JoinButton({
  communityId,
  status,
  isPublic,
  onJoined,
}: {
  communityId: number;
  status: JoinStatus;
  isPublic: boolean;
  onJoined: (newStatus: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (status === 'founder' || status === 'moderator') return null;

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
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, { method: 'POST' });
      if (res.ok) {
        const body = await res.json();
        onJoined(body.data.status);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400 disabled:opacity-50"
    >
      {loading ? '...' : isPublic ? 'Entrar' : 'Solicitar adesão'}
    </button>
  );
}

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

function CreatePostModal({
  communityId,
  onClose,
  onCreated,
}: {
  communityId: number;
  onClose: () => void;
  onCreated: (post: Post) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaB64, setMediaB64] = useState<string | null>(null);
  const [mediaContentType, setMediaContentType] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MEDIA.includes(file.type)) {
      setError('Formato não suportado. Use jpeg, png, gif ou webp.');
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setError('Imagem muito grande. Máximo 5 MB.');
      return;
    }
    setError(null);
    setMediaContentType(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // dataUrl = "data:image/png;base64,<b64>"
      const b64 = dataUrl.split(',')[1];
      setMediaB64(b64);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removeMedia() {
    setMediaB64(null);
    setMediaContentType(null);
    setPreviewUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) { setError('Título deve ter ao menos 3 caracteres.'); return; }
    if (content.trim().length < 10) { setError('Conteúdo deve ter ao menos 10 caracteres.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          ...(mediaB64 ? { mediaB64, mediaContentType } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erro ao publicar post.');
      }
      const { data } = await res.json();
      onCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar post.');
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo Post" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assunto da discussão"
            maxLength={200}
            className={inputCls}
          />
        </Field>
        <Field label="Conteúdo">
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compartilhe sua ideia, dúvida ou descoberta..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Imagem" hint="(opcional · jpeg/png/gif/webp · max 5 MB)">
          {previewUrl ? (
            <div className="relative w-full overflow-hidden rounded-lg border border-white/10">
              <img src={previewUrl} alt="preview" className="max-h-48 w-full object-cover" />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-black"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-zinc-400 transition hover:border-amber-500/40 hover:text-zinc-200">
              <span className="text-lg">🖼</span>
              <span>Clique para selecionar imagem</span>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </Field>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>
        )}
        <FormActions onClose={onClose} saving={saving} label="Publicar" />
      </form>
    </Modal>
  );
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'members' | 'pending'>('posts');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingFetched, setPendingFetched] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/communities/${id}`).then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
    ]).then(([communityData, sessionData]) => {
      setCommunity(communityData);
      if (sessionData?.userId) setCurrentUserId(sessionData.userId);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  if (!community) return <div className="py-16 text-center text-zinc-500">Comunidade não encontrada.</div>;

  const catCfg = CATEGORY_CONFIG[community.category] ?? { emoji: '🌐', color: 'from-slate-900 to-[#0f1829]' };
  const approvedMembers = community.members.filter((m) => m.status === 'approved');

  const myMembership = currentUserId
    ? community.members.find((m) => m.user.id === currentUserId)
    : null;

  const joinStatus: JoinStatus = (() => {
    if (!myMembership) return 'none';
    if (myMembership.status === 'pending') return 'pending';
    return myMembership.role as JoinStatus;
  })();

  function handleJoined(newStatus: string) {
    if (!currentUserId || !community) return;
    setCommunity((prev) => {
      if (!prev) return prev;
      const fakeMember: Member = {
        id: Date.now(),
        role: 'member',
        status: newStatus,
        joinedAt: new Date().toISOString(),
        user: { id: currentUserId!, name: null },
      };
      return { ...prev, members: [...prev.members, fakeMember] };
    });
  }

  const canPost = joinStatus === 'member' || joinStatus === 'moderator' || joinStatus === 'founder';

  function handlePostCreated(post: Post) {
    setCommunity((prev) => prev ? { ...prev, posts: [post, ...prev.posts] } : prev);
    setShowCreatePost(false);
  }

  function openPendingTab() {
    setTab('pending');
    if (pendingFetched) return;
    setPendingLoading(true);
    fetch(`/api/communities/${id}/members?status=pending`)
      .then((r) => r.json())
      .then((body) => { setPendingMembers(body.data ?? []); setPendingFetched(true); })
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }

  async function handleMemberAction(userId: number, action: 'approve' | 'reject') {
    await fetch(`/api/communities/${id}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setPendingMembers((prev) => prev.filter((m) => m.user.id !== userId));
  }

  return (
    <>
    {showCreatePost && (
      <CreatePostModal
        communityId={community.id}
        onClose={() => setShowCreatePost(false)}
        onCreated={handlePostCreated}
      />
    )}
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
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-white sm:text-3xl">{community.name}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  community.isPublic
                    ? 'border-teal-500/30 bg-teal-900/30 text-teal-400'
                    : 'border-violet-500/30 bg-violet-900/30 text-violet-400'
                }`}>
                  {community.isPublic ? 'Pública' : 'Privada'}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Criada por {community.creator.name} · {new Date(community.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
              {community.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{community.description}</p>
              )}
            </div>
            <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
              <div className="flex gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <div className="text-2xl font-black text-amber-400">{approvedMembers.length}</div>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">Membros</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <div className="text-2xl font-black text-cyan-400">{community.posts.length}</div>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">Posts</div>
                </div>
              </div>
              {currentUserId && (
                <JoinButton
                  communityId={community.id}
                  status={joinStatus}
                  isPublic={community.isPublic}
                  onJoined={handleJoined}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1">
        <button
          onClick={() => setTab('posts')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'posts' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Discussões ({community.posts.length})
        </button>
        <button
          onClick={() => setTab('members')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'members' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Membros ({approvedMembers.length})
        </button>
        {(joinStatus === 'founder' || joinStatus === 'moderator') && (
          <button
            onClick={openPendingTab}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-all ${tab === 'pending' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Pendentes {pendingFetched && pendingMembers.length > 0 ? `(${pendingMembers.length})` : ''}
          </button>
        )}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {canPost && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
              >
                + Novo Post
              </button>
            </div>
          )}
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
                  {post.mediaUrl && (
                    <img
                      src={post.mediaUrl}
                      alt="media"
                      className="mb-3 max-h-48 w-full rounded-lg object-cover"
                    />
                  )}
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
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-500"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => handleMemberAction(m.user.id, 'reject')}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
