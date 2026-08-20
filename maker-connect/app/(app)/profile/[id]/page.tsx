'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { use } from 'react';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type MakerLevel = 'apprentice' | 'journeyman' | 'master' | 'grandmaster';

type Badge = { id: number; type: string; title: string; earnedAt: string };
type Robot = { id: number; name: string; category: string; wins: number; losses: number; draws: number; eloScore: number; awards: { title: string }[] };
type Project = { id: number; title: string; category: string; createdAt: string };
type SharedProject = {
  id: number;
  createdAt: string;
  project: { id: number; title: string; category: string; createdAt: string; creator: { id: number; name: string | null } };
};
type Team = { team: { id: number; name: string; members: unknown[] } };
type Community = { community: { id: number; name: string; category: string } };

type UserData = {
  id: number;
  name: string | null;
  email: string;
  profile: {
    bio: string | null;
    avatarUrl: string | null;
    videoUrl: string | null;
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
  sharedProjects: SharedProject[];
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

const BADGE_CONFIG: Record<string, { color: string }> = {
  first_project:      { color: 'bg-blue-900/50 border-blue-500/40' },
  first_fork:         { color: 'bg-teal-900/50 border-teal-500/40' },
  robot_master:       { color: 'bg-amber-900/50 border-amber-500/40' },
  team_player:        { color: 'bg-violet-900/50 border-violet-500/40' },
  documentation_hero: { color: 'bg-emerald-900/50 border-emerald-500/40' },
  champion:           { color: 'bg-yellow-900/50 border-yellow-500/40' },
  arena_legend:       { color: 'bg-orange-900/50 border-orange-500/40' },
  grandmaster:        { color: 'bg-yellow-900/50 border-yellow-400/50' },
  rag_pioneer:        { color: 'bg-cyan-900/50 border-cyan-500/40' },
  iot_expert:         { color: 'bg-teal-900/50 border-teal-500/40' },
};

const CATEGORY_BADGE: Record<string, string> = {
  Printing3D: 'bg-violet-900/60 text-violet-300 border border-violet-500/30',
  Robotics: 'bg-blue-900/60 text-blue-300 border border-blue-500/30',
  IoT: 'bg-teal-900/60 text-teal-300 border border-teal-500/30',
  Woodworking: 'bg-amber-900/60 text-amber-300 border border-amber-500/30',
};

const CATEGORY_LABEL: Record<string, string> = {
  Printing3D: 'Impressão 3D', Robotics: 'Robótica', IoT: 'IoT', Woodworking: 'Marcenaria',
  sumo: 'Sumo', line_follower: 'Seguidor de Linha', combat: 'Combate',
  autonomous: 'Autônomo', educational: 'Educacional', competition: 'Competição',
};

function Avatar({ name, avatarUrl, size = 'lg', onClick }: { name: string | null; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl'; onClick?: () => void }) {
  const cls = { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' }[size];
  if (avatarUrl) {
    return (
      <div className={`${cls} relative shrink-0 overflow-hidden rounded-full shadow-[0_0_16px_rgba(245,158,11,0.4)]`} onClick={onClick}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name ?? 'Avatar'} className="h-full w-full object-cover" />
        {onClick && (
          <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition hover:opacity-100">
            <span className="text-xs font-bold text-white">Alterar</span>
          </div>
        )}
      </div>
    );
  }
  const initials = name ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : '?';
  return (
    <div
      className={`${cls} relative flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-black shadow-[0_0_16px_rgba(245,158,11,0.4)]`}
      onClick={onClick}
    >
      {initials}
      {onClick && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition hover:opacity-100">
          <span className="text-[10px] font-bold text-white">Alterar</span>
        </div>
      )}
    </div>
  );
}

function WinRateBadge({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = rate >= 70 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-sm font-bold ${color}`}>{rate}%</span>;
}

// ─── EditProfileModal ─────────────────────────────────────────────────────────

type EditForm = {
  name: string;
  bio: string;
  location: string;
  website: string;
  githubUrl: string;
  expertiseRaw: string;
  videoUrl: string;
};

function EditProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserData;
  onClose: () => void;
  onSaved: (updated: UserData) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    name: user.name ?? '',
    bio: user.profile?.bio ?? '',
    location: user.profile?.location ?? '',
    website: user.profile?.website ?? '',
    githubUrl: user.profile?.githubUrl ?? '',
    expertiseRaw: (() => {
      try { return (JSON.parse(user.profile?.expertise ?? '[]') as string[]).join(', '); }
      catch { return ''; }
    })(),
    videoUrl: user.profile?.videoUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof EditForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const expertise = form.expertiseRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          location: form.location,
          website: form.website,
          githubUrl: form.githubUrl,
          expertise,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');

      const currentVideoUrl = user.profile?.videoUrl ?? '';
      if (form.videoUrl !== currentVideoUrl) {
        const vRes = await fetch('/api/profile/video', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: form.videoUrl || null }),
        });
        if (!vRes.ok) {
          const d = await vRes.json().catch(() => ({}));
          throw new Error(d.error ?? 'URL de vídeo inválida');
        }
      }

      const fresh = await fetch(`/api/users/${user.id}`).then((r) => r.json());
      onSaved(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-500/20 bg-[#0d1424] shadow-[0_0_60px_rgba(0,0,0,0.8)]" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-black text-white">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Nome</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Seu nome completo"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Conte um pouco sobre você e seus projetos..."
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Localização</label>
              <input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="São Paulo, SP"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Website</label>
              <input
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">GitHub URL</label>
            <input
              value={form.githubUrl}
              onChange={(e) => set('githubUrl', e.target.value)}
              placeholder="https://github.com/seu-usuario"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Expertise <span className="font-normal normal-case text-zinc-600">(separadas por vírgula)</span>
            </label>
            <input
              value={form.expertiseRaw}
              onChange={(e) => set('expertiseRaw', e.target.value)}
              placeholder="Arduino, ESP32, Robótica, Impressão 3D"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Vídeo do YouTube <span className="font-normal normal-case text-zinc-600">(opcional)</span>
            </label>
            <input
              value={form.videoUrl}
              onChange={(e) => set('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_16px_rgba(245,158,11,0.3)] transition hover:bg-amber-400 disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EditProjectModal ─────────────────────────────────────────────────────────

const EDIT_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'Robotics', label: 'Robótica' },
  { value: 'Printing3D', label: 'Impressão 3D' },
  { value: 'IoT', label: 'IoT' },
  { value: 'Woodworking', label: 'Marcenaria' },
];
const EDIT_PRINTER_MATERIALS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'Resina', 'Fibra de Carbono', 'Madeira Preenchida', 'Outro'];
const EDIT_NOZZLE_SIZES = ['0.2mm', '0.4mm', '0.6mm', '0.8mm', '1.0mm'];
const EDIT_LAYER_HEIGHTS = ['0.05mm', '0.1mm', '0.15mm', '0.2mm', '0.25mm', '0.3mm', '0.4mm'];

type EditableProject = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  coverImageUrl: string | null;
  printerBrand: string | null;
  printerModel: string | null;
  printerNozzle: string | null;
  printerMaterial: string | null;
  printerLayerHeight: string | null;
};

function EditProjectModal({ projectId, onClose, onSaved }: {
  projectId: number;
  onClose: () => void;
  onSaved: (project: { id: number; title: string; category: string }) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<EditableProject | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Robotics');
  const [printerBrand, setPrinterBrand] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [printerNozzle, setPrinterNozzle] = useState('');
  const [printerMaterial, setPrinterMaterial] = useState('');
  const [printerLayerHeight, setPrinterLayerHeight] = useState('');

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverB64, setCoverB64] = useState<string | null>(null);
  const [coverContentType, setCoverContentType] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const is3D = category === 'Printing3D';

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Falha ao carregar projeto')))
      .then((data: EditableProject) => {
        setProject(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setCategory(data.category);
        setPrinterBrand(data.printerBrand ?? '');
        setPrinterModel(data.printerModel ?? '');
        setPrinterNozzle(data.printerNozzle ?? '');
        setPrinterMaterial(data.printerMaterial ?? '');
        setPrinterLayerHeight(data.printerLayerHeight ?? '');
        setCoverPreview(data.coverImageUrl);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar projeto'))
      .finally(() => setLoading(false));
  }, [projectId]);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError('Imagem maior que 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const [header, b64] = result.split(',');
      const ct = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
      setCoverB64(b64);
      setCoverContentType(ct);
      setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) { setError('Título obrigatório'); return; }
    setSaving(true); setError(null);
    try {
      const body: Record<string, unknown> = { title, description, category };
      if (is3D) {
        body.printerBrand = printerBrand;
        body.printerModel = printerModel;
        body.printerNozzle = printerNozzle;
        body.printerMaterial = printerMaterial;
        body.printerLayerHeight = printerLayerHeight;
      }
      if (coverB64 && coverContentType) { body.coverImageB64 = coverB64; body.coverImageContentType = coverContentType; }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao salvar'); }
      const updated = await res.json();
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto');
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar Projeto" onClose={onClose}>
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Carregando…</p>
      ) : !project ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error ?? 'Projeto não encontrado'}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Imagem de capa</label>
            {coverPreview ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Capa" className="h-full w-full object-cover" />
                <button type="button" onClick={() => { setCoverPreview(null); setCoverB64(null); setCoverContentType(null); if (coverRef.current) coverRef.current.value = ''; }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm hover:bg-black/80">
                  Remover
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-slate-800/50 py-8 text-sm text-zinc-500 transition hover:border-amber-500/30 hover:text-zinc-300">
                Adicionar foto do modelo
                <span className="text-xs text-zinc-600">jpeg, png, webp — máx 8 MB</span>
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCoverChange} />
          </div>

          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Descrição" hint="(opcional)">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Categoria">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              {EDIT_CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          {is3D && (
            <div className="space-y-4 rounded-xl border border-violet-500/20 bg-violet-900/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">Configuração da Impressora</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca">
                  <input value={printerBrand} onChange={(e) => setPrinterBrand(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Modelo">
                  <input value={printerModel} onChange={(e) => setPrinterModel(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Bico">
                  <select value={printerNozzle} onChange={(e) => setPrinterNozzle(e.target.value)} className={selectCls}>
                    <option value="">—</option>
                    {EDIT_NOZZLE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Material">
                  <select value={printerMaterial} onChange={(e) => setPrinterMaterial(e.target.value)} className={selectCls}>
                    <option value="">—</option>
                    {EDIT_PRINTER_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Altura de camada">
                  <select value={printerLayerHeight} onChange={(e) => setPrinterLayerHeight(e.target.value)} className={selectCls}>
                    <option value="">—</option>
                    {EDIT_LAYER_HEIGHTS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
          <FormActions onClose={onClose} saving={saving} label="Salvar" />
        </form>
      )}
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'projects' | 'shared' | 'robots' | 'teams' | 'communities'>('projects');
  const [editing, setEditing] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  const isOwner = sessionUserId !== null && user !== null && sessionUserId === user.id;

  function handleProjectSaved(updated: { id: number; title: string; category: string }) {
    setEditingProjectId(null);
    setUser((prev) => prev ? {
      ...prev,
      projects: prev.projects.map((p) => p.id === updated.id ? { ...p, title: updated.title, category: updated.category } : p),
    } : prev);
  }

  async function handleDeleteProject(projectId: number) {
    if (!window.confirm('Excluir este projeto? Essa ação não pode ser desfeita.')) return;
    setDeletingProjectId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao excluir'); }
      setUser((prev) => prev ? { ...prev, projects: prev.projects.filter((p) => p.id !== projectId) } : prev);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir projeto');
    } finally {
      setDeletingProjectId(null);
    }
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { if (s?.userId) setSessionUserId(s.userId); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        const res = await fetch('/api/profile/avatar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarB64: base64, contentType: file.type }),
        });
        if (res.ok) {
          const fresh = await fetch(`/api/users/${id}`).then((r) => r.json());
          setUser(fresh);
        }
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setAvatarUploading(false);
    }
  }

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
    <>
    {editing && (
      <EditProfileModal
        user={user}
        onClose={() => setEditing(false)}
        onSaved={(updated) => { setUser(updated); setEditing(false); }}
      />
    )}
    {/* Hidden avatar file input */}
    <input
      ref={avatarInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={handleAvatarChange}
    />
    <div className="space-y-6">
      {/* ── Profile Hero Card ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar + level */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar
                  name={user.name}
                  avatarUrl={user.profile?.avatarUrl}
                  size="xl"
                  onClick={isOwner ? () => avatarInputRef.current?.click() : undefined}
                />
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-[10px] text-zinc-500 hover:text-amber-400 transition"
                >
                  Alterar foto
                </button>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${levelCfg.bg} ${levelCfg.color}`}>
                {levelCfg.label}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-white sm:text-3xl">{user.name ?? 'Maker Anônimo'}</h1>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>

              {user.profile?.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{user.profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                {user.profile?.location && <span>{user.profile.location}</span>}
                {user.profile?.website && (
                  <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    Website
                  </a>
                )}
                {user.profile?.githubUrl && (
                  <a href={user.profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                    GitHub
                  </a>
                )}
              </div>

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

            {/* Stats panel */}
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

      {/* ── YouTube video ─────────────────────────────────────────────── */}
      {user.profile?.videoUrl && (
        <YoutubeEmbed url={user.profile.videoUrl} title={`Vídeo de ${user.name ?? 'Maker'}`} />
      )}

      {/* ── Badges ───────────────────────────────────────────────────── */}
      {user.badges.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-amber-400">Conquistas</h2>
          <div className="flex flex-wrap gap-3">
            {user.badges.map((badge) => {
              const cfg = BADGE_CONFIG[badge.type] ?? { color: 'bg-slate-800 border-white/10' };
              return (
                <div key={badge.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${cfg.color}`}>
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
          { key: 'shared', label: 'Compartilhados', count: user.sharedProjects.length },
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
              {isOwner && (
                <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProjectId(p.id); }}
                    className="rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-300"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={deletingProjectId === p.id}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(p.id); }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {deletingProjectId === p.id ? 'Excluindo…' : 'Excluir'}
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
      {editingProjectId !== null && (
        <EditProjectModal
          projectId={editingProjectId}
          onClose={() => setEditingProjectId(null)}
          onSaved={handleProjectSaved}
        />
      )}

      {/* ── Shared Projects Tab ──────────────────────────────────────── */}
      {tab === 'shared' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.sharedProjects.length === 0 && (
            <p className="col-span-full py-8 text-center text-zinc-500">Nenhum projeto compartilhado ainda.</p>
          )}
          {user.sharedProjects.map((share) => (
            <Link
              key={share.id}
              href={`/projects/${share.project.id}`}
              className="group rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-800"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{share.project.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE[share.project.category] ?? 'bg-slate-700 text-zinc-300'}`}>
                  {CATEGORY_LABEL[share.project.category] ?? share.project.category}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                por {share.project.creator.name ?? 'Maker Anônimo'} · compartilhado em{' '}
                {new Date(share.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-black text-amber-400 uppercase tracking-wider">
                ROB
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
                  <p className="text-[11px] text-yellow-400">{robot.awards[0].title}</p>
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
    </>
  );
}
