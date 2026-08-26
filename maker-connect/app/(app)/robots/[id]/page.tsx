'use client';

import Link from 'next/link';
import Image from 'next/image';
import { use, useEffect, useRef, useState } from 'react';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';

type RobotImage = { id: number; imageUrl: string; position: number };
type RobotComponent = { id: number; name: string; quantity: number; description: string | null; createdAt: string };
type Match = { id: number; opponentName: string; result: string; myScore: number | null; opponentScore: number | null; eventName: string | null; matchDate: string; notes: string | null };
type Award = { id: number; title: string; placement: number | null; year: number; event: { name: string; location: string | null } | null };
type Participation = { id: number; placement: number | null; event: { id: number; name: string; location: string | null; eventDate: string; category: string | null } };

type Robot = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  status: string;
  wins: number;
  losses: number;
  draws: number;
  eloScore: number;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  owner: { id: number; name: string | null };
  team: { id: number; name: string } | null;
  images: RobotImage[];
  components: RobotComponent[];
  matches: Match[];
  awards: Award[];
  participations: Participation[];
};

const RESULT_CONFIG = {
  win:  { label: 'VITÓRIA', color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-500/30' },
  loss: { label: 'DERROTA', color: 'text-red-400',     bg: 'bg-red-900/30 border-red-500/30' },
  draw: { label: 'EMPATE',  color: 'text-zinc-400',    bg: 'bg-zinc-800/60 border-white/10' },
  dnf:  { label: 'DNF',     color: 'text-orange-400',  bg: 'bg-orange-900/30 border-orange-500/30' },
};

const PLACEMENT_LABEL: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º' };

const CATEGORY_LABELS: Record<string, string> = {
  sumo: 'Sumô',
  line_follower: 'Seguidor de Linha',
  combat: 'Combate',
  autonomous: 'Autônomo',
  educational: 'Educacional',
  competition: 'Competição',
};

function IconRobot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <rect x="8" y="8" width="8" height="5" rx="1" />
      <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
      <line x1="12" y1="8" x2="12" y2="5" />
      <circle cx="12" cy="4" r="1.5" />
      <line x1="5" y1="14" x2="2" y2="14" />
      <line x1="19" y1="14" x2="22" y2="14" />
    </svg>
  );
}

function IconTeam({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="7" r="3" />
      <path d="M3 21c0-4 2.7-7 6-7" />
      <path d="M21 21c0-4-2.7-7-6-7" />
      <path d="M9 14c1 0 2 .2 3 .6 1-.4 2-.6 3-.6" />
    </svg>
  );
}

function IconRuler({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 17L17 2l5 5L7 22z" />
      <line x1="7" y1="11" x2="9" y2="13" />
      <line x1="11" y1="7" x2="13" y2="9" />
      <line x1="4" y1="14" x2="6" y2="16" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 5H2v3a4 4 0 0 0 4 4h0" />
      <path d="M18 5h4v3a4 4 0 0 1-4 4h0" />
      <path d="M12 19v3" />
      <line x1="8" y1="22" x2="16" y2="22" />
      <path d="M6 12a6 6 0 0 0 12 0V2H6v10z" />
    </svg>
  );
}

// ─── EditRobotModal ───────────────────────────────────────────────────────────

const EDIT_CATEGORY_OPTIONS = [
  { value: 'sumo', label: 'Sumô' },
  { value: 'combat', label: 'Combate' },
  { value: 'line_follower', label: 'Seguidor de Linha' },
  { value: 'autonomous', label: 'Autônomo' },
  { value: 'educational', label: 'Educacional' },
  { value: 'competition', label: 'Competição' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'retired', label: 'Aposentado' },
];

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_MAX_COUNT = 10;

function EditRobotModal({ robot, onClose, onSaved }: {
  robot: Robot;
  onClose: () => void;
  onSaved: (robot: Robot) => void;
}) {
  const [name, setName] = useState(robot.name);
  const [description, setDescription] = useState(robot.description ?? '');
  const [category, setCategory] = useState(robot.category);
  const [status, setStatus] = useState(robot.status);
  const [teamId, setTeamId] = useState<number | null>(robot.team?.id ?? null);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [weightKg, setWeightKg] = useState(robot.weightKg?.toString() ?? '');
  const [lengthCm, setLengthCm] = useState(robot.lengthCm?.toString() ?? '');
  const [widthCm, setWidthCm] = useState(robot.widthCm?.toString() ?? '');
  const [heightCm, setHeightCm] = useState(robot.heightCm?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<RobotImage[]>(robot.images);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/teams').then((r) => r.ok ? r.json() : null).then((d) => { if (d?.teams) setTeams(d.teams); }).catch(() => {});
  }, []);

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photoRef.current) photoRef.current.value = '';
    if (files.length === 0) return;
    if (photos.length + files.length > PHOTO_MAX_COUNT) {
      setError(`Limite de ${PHOTO_MAX_COUNT} fotos por robô.`);
      return;
    }
    setError(null);
    setUploadingPhoto(true);

    Promise.all(files.map((file) => new Promise<{ imageB64: string; contentType: string }>((resolve, reject) => {
      if (file.size > PHOTO_MAX_BYTES) { reject(new Error(`${file.name} excede 5 MB`)); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        resolve({ imageB64: result.split(',')[1], contentType: file.type });
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    })))
      .then((images) => fetch(`/api/robots/${robot.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      }))
      .then(async (res) => {
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao enviar foto'); }
        const payload = await res.json() as { data: RobotImage[] };
        setPhotos(payload.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao enviar foto'))
      .finally(() => setUploadingPhoto(false));
  }

  async function handlePhotoDelete(imageId: number) {
    setDeletingPhotoId(imageId);
    setError(null);
    try {
      const res = await fetch(`/api/robots/${robot.id}/images/${imageId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao remover foto'); }
      setPhotos((prev) => prev.filter((p) => p.id !== imageId).map((p, i) => ({ ...p, position: i })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover foto');
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/robots/${robot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, category, status,
          teamId,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          lengthCm: lengthCm ? parseFloat(lengthCm) : null,
          widthCm: widthCm ? parseFloat(widthCm) : null,
          heightCm: heightCm ? parseFloat(heightCm) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao salvar'); }
      const updated = await res.json();
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar robô');
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar Robô" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={`Fotos (${photos.length}/${PHOTO_MAX_COUNT})`}>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((img, i) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-amber-500 px-1 text-[10px] font-bold text-black">CAPA</span>}
                <button
                  type="button"
                  disabled={deletingPhotoId === img.id}
                  onClick={() => handlePhotoDelete(img.id)}
                  className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-white group-hover:flex disabled:opacity-50"
                >
                  {deletingPhotoId === img.id ? '…' : '✕'}
                </button>
              </div>
            ))}
            {photos.length < PHOTO_MAX_COUNT && (
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => photoRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-white/20 text-zinc-600 transition hover:border-amber-500/40 hover:text-zinc-400 disabled:opacity-50"
              >
                {uploadingPhoto ? '…' : '+'}
              </button>
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoAdd} />
        </Field>

        <Field label="Nome do Robô">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Descrição" hint="(opcional)">
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              {EDIT_CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Equipe" hint="(opcional)">
          <select value={teamId ?? ''} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)} className={selectCls}>
            <option value="">— Sem equipe —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Peso (kg)">
            <input type="number" step="0.01" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Comp. (cm)">
            <input type="number" step="0.1" min="0" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Larg. (cm)">
            <input type="number" step="0.1" min="0" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Alt. (cm)">
            <input type="number" step="0.1" min="0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputCls} />
          </Field>
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Salvar" />
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RobotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'matches' | 'events' | 'awards' | 'components'>('matches');
  const [activeImg, setActiveImg] = useState(0);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { if (s?.userId) setSessionUserId(s.userId); })
      .catch(() => {});
  }, []);

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
  const coverImage = robot.images[activeImg] ?? robot.images[0] ?? null;

  const hasDimensions = robot.weightKg != null || robot.lengthCm != null || robot.widthCm != null || robot.heightCm != null;
  const isOwner = sessionUserId !== null && sessionUserId === robot.owner.id;

  return (
    <div className="space-y-6">
      {editing && (
        <EditRobotModal
          robot={robot}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setRobot(updated); setEditing(false); }}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/robots" className="hover:text-amber-400">Robôs</Link>
        <span>/</span>
        <span className="text-zinc-300">{robot.name}</span>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* Photo gallery */}
            <div className="flex-shrink-0 space-y-2 lg:w-72">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                {coverImage ? (
                  <Image src={coverImage.imageUrl} alt={robot.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <IconRobot className="h-16 w-16 text-amber-500/30" />
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  <span className="rounded-full border border-amber-500/30 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400 backdrop-blur-sm">
                    {CATEGORY_LABELS[robot.category] ?? robot.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {robot.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {robot.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImg(i)}
                      className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImg === i ? 'border-amber-500' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image src={img.imageUrl} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info + Stats */}
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-black text-white sm:text-3xl">{robot.name}</h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    robot.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {robot.status === 'active' ? 'ATIVO' : robot.status.toUpperCase()}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20"
                    >
                      Editar Robô
                    </button>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <Link href={`/profile/${robot.owner.id}`} className="hover:text-amber-400">
                    {robot.owner.name ?? 'Sem dono'}
                  </Link>
                  {robot.team && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <Link href={`/teams/${robot.team.id}`} className="flex items-center gap-1 hover:text-amber-400">
                        <IconTeam className="h-3.5 w-3.5" />
                        {robot.team.name}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {robot.description && (
                <p className="max-w-xl text-sm leading-relaxed text-zinc-300">{robot.description}</p>
              )}

              {/* Dimensions / Weight row */}
              {hasDimensions && (
                <div className="flex flex-wrap gap-2">
                  {robot.weightKg != null && (
                    <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      <IconRuler className="h-3 w-3 text-zinc-500" />
                      {robot.weightKg} kg
                    </span>
                  )}
                  {robot.lengthCm != null && (
                    <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      C: {robot.lengthCm} cm
                    </span>
                  )}
                  {robot.widthCm != null && (
                    <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      L: {robot.widthCm} cm
                    </span>
                  )}
                  {robot.heightCm != null && (
                    <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      A: {robot.heightCm} cm
                    </span>
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
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
      </div>

      {/* Awards shelf */}
      {robot.awards.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
            <IconTrophy className="h-4 w-4" />
            Premiações
          </h2>
          <div className="flex flex-wrap gap-3">
            {robot.awards.map((award) => (
              <div key={award.id} className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-900/20 px-4 py-2">
                <span className="text-sm font-black text-yellow-400">{award.placement ? PLACEMENT_LABEL[award.placement] ?? `${award.placement}º` : '#'}</span>
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

      {/* Dimensions detail card (shown separately below hero when present) */}
      {hasDimensions && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <IconRuler className="h-4 w-4" />
            Dimensões e Peso
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {robot.weightKg != null && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-xl font-black text-zinc-100">{robot.weightKg}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Peso (kg)</div>
              </div>
            )}
            {robot.lengthCm != null && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-xl font-black text-zinc-100">{robot.lengthCm}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Comprimento (cm)</div>
              </div>
            )}
            {robot.widthCm != null && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-xl font-black text-zinc-100">{robot.widthCm}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Largura (cm)</div>
              </div>
            )}
            {robot.heightCm != null && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-xl font-black text-zinc-100">{robot.heightCm}</div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Altura (cm)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1">
        {([
          { key: 'matches',    label: 'Partidas',    count: robot.matches.length },
          { key: 'events',     label: 'Eventos',     count: robot.participations.length },
          { key: 'awards',     label: 'Prêmios',     count: robot.awards.length },
          { key: 'components', label: 'Componentes', count: robot.components.length },
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
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-xs font-black ${cfg.color} border ${cfg.bg}`}>
                  {cfg.label}
                </div>
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
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <span className="text-sm font-black text-amber-400">
                  {p.placement ? PLACEMENT_LABEL[p.placement] ?? `${p.placement}º` : '-'}
                </span>
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
                  <p className="text-xs font-bold text-amber-400">{p.placement}º lugar</p>
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-900/20">
                <span className="text-sm font-black text-yellow-400">
                  {award.placement ? PLACEMENT_LABEL[award.placement] ?? `${award.placement}º` : '#'}
                </span>
              </div>
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

      {/* Components */}
      {tab === 'components' && (
        <div className="space-y-3">
          {robot.components.length === 0 && (
            <p className="py-8 text-center text-zinc-500">Nenhum componente registrado.</p>
          )}
          {robot.components.map((comp) => (
            <div key={comp.id} className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <IconBox className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-100">{comp.name}</h3>
                  {comp.quantity > 1 && (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      ×{comp.quantity}
                    </span>
                  )}
                </div>
                {comp.description && (
                  <p className="mt-1 text-xs text-zinc-400">{comp.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
