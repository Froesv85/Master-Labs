'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';

type Community = {
  id: number; name: string; description: string | null; category: string;
  creator: { id: number; name: string | null };
  _count: { members: number; posts: number };
  createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; accent: string }> = {
  Robotics:   { label: 'Robótica',    emoji: '🤖', color: 'border-blue-500/30 hover:border-blue-500/50',   accent: 'bg-blue-900/40 text-blue-300' },
  Printing3D: { label: '3D Printing', emoji: '🖨️', color: 'border-violet-500/30 hover:border-violet-500/50', accent: 'bg-violet-900/40 text-violet-300' },
  IoT:        { label: 'IoT',         emoji: '📡', color: 'border-teal-500/30 hover:border-teal-500/50',    accent: 'bg-teal-900/40 text-teal-300' },
  Woodworking:{ label: 'Woodworking', emoji: '🪵', color: 'border-amber-500/30 hover:border-amber-500/50',  accent: 'bg-amber-900/40 text-amber-300' },
};

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Community) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Robotics');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, isPublic }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao criar'); }
      const community = await res.json();
      onCreated(community);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comunidade');
      setSaving(false);
    }
  }

  return (
    <Modal title="Criar Comunidade" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome da Comunidade">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Robótica de Competição Brasil" className={inputCls} />
        </Field>
        <Field label="Descrição" hint="(opcional)">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sobre o que é esta comunidade?" className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Categoria">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="Robotics">🤖 Robótica</option>
            <option value="Printing3D">🖨️ 3D Printing</option>
            <option value="IoT">📡 IoT</option>
            <option value="Woodworking">🪵 Woodworking</option>
          </select>
        </Field>
        <Field label="Visibilidade">
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setIsPublic((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${isPublic ? 'bg-amber-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-zinc-300">{isPublic ? 'Pública — qualquer um pode entrar' : 'Privada — só por aprovação'}</span>
          </label>
        </Field>
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Criar Comunidade" />
      </form>
    </Modal>
  );
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch('/api/communities')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setCommunities(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const filtered = filter ? communities.filter((c) => c.category === filter) : communities;

  return (
    <>
    {showCreate && (
      <CreateCommunityModal
        onClose={() => setShowCreate(false)}
        onCreated={(c) => { setCommunities((prev) => [c, ...prev]); setShowCreate(false); }}
      />
    )}
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            COMUNIDADES <span className="text-amber-400">MAKER</span>
          </h1>
          <p className="text-sm text-zinc-400">Grupos temáticos, discussões e base de conhecimento</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
        >
          + Criar Comunidade
        </button>
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
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Não foi possível carregar as comunidades.</p>
          <button
            onClick={() => { setError(false); setLoading(true); fetch('/api/communities').then((r) => r.json()).then((data) => { setCommunities(data); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
            className="rounded-lg border border-red-500/30 px-4 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </>
  );
}
