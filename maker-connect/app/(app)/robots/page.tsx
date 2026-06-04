'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Team = { id: number; name: string };
type Award = { id: number; title: string; placement: number | null; year: number };
type Robot = {
  id: number; name: string; category: string; status: string;
  wins: number; losses: number; draws: number; eloScore: number;
  owner: { id: number; name: string | null };
  team: { id: number; name: string } | null;
  awards: Award[];
  images: { imageUrl: string }[];
  _count: { matches: number };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'sumo',         label: 'Sumo',         color: 'bg-red-900/40 text-red-300 border-red-500/30',       filterActive: 'border-red-400 bg-red-600 text-white' },
  { value: 'combat',       label: 'Combate',       color: 'bg-orange-900/40 text-orange-300 border-orange-500/30', filterActive: 'border-orange-400 bg-orange-600 text-white' },
  { value: 'line_follower',label: 'Seguidor de Linha', color: 'bg-blue-900/40 text-blue-300 border-blue-500/30',    filterActive: 'border-blue-400 bg-blue-600 text-white' },
  { value: 'autonomous',   label: 'Autônomo',          color: 'bg-violet-900/40 text-violet-300 border-violet-500/30', filterActive: 'border-violet-400 bg-violet-600 text-white' },
  { value: 'educational',  label: 'Educacional',       color: 'bg-teal-900/40 text-teal-300 border-teal-500/30',    filterActive: 'border-teal-400 bg-teal-600 text-white' },
  { value: 'competition',  label: 'Competição',        color: 'bg-amber-900/40 text-amber-300 border-amber-500/30', filterActive: 'border-amber-400 bg-amber-600 text-white' },
];

function catConfig(cat: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === cat) ?? { label: cat, color: 'bg-slate-800 text-zinc-300 border-white/10', filterActive: '' };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconTrash() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconRobot() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 15h0M17 15h0"/></svg>; }

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{label}</p>;
}

// ─── CreateRobotModal ─────────────────────────────────────────────────────────

function CreateRobotModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: Robot) => void }) {
  // Basic
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sumo');
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  // Photos
  const [photos, setPhotos] = useState<{ preview: string; b64: string; ct: string }[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);

  // Dimensions
  const [weightKg, setWeightKg] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Components
  const [components, setComponents] = useState<{ name: string; quantity: string; description: string }[]>([]);

  // Competitions
  const [competitions, setCompetitions] = useState<{ eventName: string; location: string; date: string; placement: string }[]>([]);

  // Awards
  const [awards, setAwards] = useState<{ title: string; year: string; placement: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teams').then((r) => r.ok ? r.json() : null).then((d) => { if (d?.teams) setTeams(d.teams); }).catch(() => {});
  }, []);

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      if (photos.length >= 10) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const [header, b64] = result.split(',');
        const ct = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
        setPhotos((p) => [...p, { preview: result, b64, ct }]);
      };
      reader.readAsDataURL(f);
    });
    if (photoRef.current) photoRef.current.value = '';
  }

  function addComponent() { setComponents((p) => [...p, { name: '', quantity: '1', description: '' }]); }
  function addCompetition() { setCompetitions((p) => [...p, { eventName: '', location: '', date: '', placement: '' }]); }
  function addAward() { setAwards((p) => [...p, { title: '', year: String(new Date().getFullYear()), placement: '' }]); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true); setError(null);

    try {
      const body: Record<string, unknown> = {
        name, description, category,
        teamId: teamId ?? undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        lengthCm: lengthCm ? parseFloat(lengthCm) : undefined,
        widthCm: widthCm ? parseFloat(widthCm) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
      };

      if (photos.length > 0) {
        body.coverImageB64 = photos[0].b64;
        body.coverImageContentType = photos[0].ct;
      }

      if (components.filter((c) => c.name.trim()).length > 0) {
        body.components = components.filter((c) => c.name.trim()).map((c) => ({
          name: c.name.trim(), quantity: parseInt(c.quantity) || 1, description: c.description.trim() || undefined,
        }));
      }

      if (awards.filter((a) => a.title.trim()).length > 0) {
        body.awards = awards.filter((a) => a.title.trim()).map((a) => ({
          title: a.title.trim(), year: parseInt(a.year) || new Date().getFullYear(), placement: a.placement ? parseInt(a.placement) : undefined,
        }));
      }

      if (competitions.filter((c) => c.eventName.trim()).length > 0) {
        body.competitions = competitions.filter((c) => c.eventName.trim()).map((c) => ({
          eventName: c.eventName.trim(), location: c.location.trim() || undefined,
          date: c.date || undefined, placement: c.placement ? parseInt(c.placement) : undefined,
        }));
      }

      const res = await fetch('/api/robots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao cadastrar'); }
      const robot = await res.json();

      // Upload remaining photos (2+)
      if (photos.length > 1) {
        await Promise.allSettled(photos.slice(1).map((p, i) =>
          fetch(`/api/robots/${robot.id}/images`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageB64: p.b64, contentType: p.ct, position: i + 1 }),
          })
        ));
      }

      onCreated(robot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar robo');
      setSaving(false);
    }
  }

  return (
    <Modal title="Cadastrar Robo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Identificacao ── */}
        <div className="space-y-4">
          <SectionHeader label="Identificacao" />
          <Field label="Nome do Robo">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: ThunderBot MK4" className={inputCls} />
          </Field>
          <Field label="Descricao" hint="(opcional)">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Especificacoes, construcao, diferenciais..." className={`${inputCls} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Equipe" hint="(opcional)">
              <select value={teamId ?? ''} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                <option value="">— Sem equipe —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="border-t border-white/8" />

        {/* ── Fotos ── */}
        <div className="space-y-3">
          <SectionHeader label={`Fotos (${photos.length}/10)`} />
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-amber-500 px-1 text-[10px] font-bold text-black">CAPA</span>}
                  <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-white group-hover:flex">
                    <IconTrash />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <button type="button" onClick={() => photoRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-white/20 text-zinc-600 hover:border-amber-500/40 hover:text-zinc-400">
                  <IconPlus />
                </button>
              )}
            </div>
          )}
          {photos.length === 0 && (
            <button type="button" onClick={() => photoRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-slate-800/50 py-8 text-sm text-zinc-500 transition hover:border-amber-500/30 hover:text-zinc-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Adicionar fotos do robo
              <span className="text-xs text-zinc-600">jpeg, png, webp — ate 8 MB cada — ate 10 fotos</span>
            </button>
          )}
          <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoAdd} />
        </div>

        <div className="border-t border-white/8" />

        {/* ── Dimensoes e Peso ── */}
        <div className="space-y-3">
          <SectionHeader label="Dimensoes e Peso" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Peso (kg)">
              <input type="number" step="0.01" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="0.500" className={inputCls} />
            </Field>
            <Field label="Comp. (cm)">
              <input type="number" step="0.1" min="0" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} placeholder="20" className={inputCls} />
            </Field>
            <Field label="Larg. (cm)">
              <input type="number" step="0.1" min="0" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="20" className={inputCls} />
            </Field>
            <Field label="Alt. (cm)">
              <input type="number" step="0.1" min="0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="10" className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="border-t border-white/8" />

        {/* ── Componentes ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader label="Componentes" />
            <button type="button" onClick={addComponent}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
              <IconPlus /> Adicionar
            </button>
          </div>
          {components.length === 0 && (
            <p className="text-xs text-zinc-600">Motores, controladores, sensores, chassi...</p>
          )}
          {components.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input value={c.name} onChange={(e) => setComponents((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                placeholder="Nome do componente" className={`${inputCls} flex-1`} />
              <input type="number" min="1" value={c.quantity} onChange={(e) => setComponents((p) => p.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))}
                placeholder="Qtd" className={`${inputCls} w-16 text-center`} />
              <input value={c.description} onChange={(e) => setComponents((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                placeholder="Obs." className={`${inputCls} flex-1`} />
              <button type="button" onClick={() => setComponents((p) => p.filter((_, j) => j !== i))}
                className="flex items-center rounded-lg border border-white/10 bg-slate-800 px-2 text-zinc-600 hover:text-red-400">
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8" />

        {/* ── Competicoes ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader label="Competicoes" />
            <button type="button" onClick={addCompetition}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
              <IconPlus /> Adicionar
            </button>
          </div>
          {competitions.map((c, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-white/8 bg-slate-800/50 p-3">
              <div className="flex gap-2">
                <input value={c.eventName} onChange={(e) => setCompetitions((p) => p.map((x, j) => j === i ? { ...x, eventName: e.target.value } : x))}
                  placeholder="Nome da competicao" className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => setCompetitions((p) => p.filter((_, j) => j !== i))}
                  className="flex items-center rounded-lg border border-white/10 px-2 text-zinc-600 hover:text-red-400">
                  <IconTrash />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={c.location} onChange={(e) => setCompetitions((p) => p.map((x, j) => j === i ? { ...x, location: e.target.value } : x))}
                  placeholder="Local" className={inputCls} />
                <input type="date" value={c.date} onChange={(e) => setCompetitions((p) => p.map((x, j) => j === i ? { ...x, date: e.target.value } : x))}
                  className={inputCls} />
                <input type="number" min="1" value={c.placement} onChange={(e) => setCompetitions((p) => p.map((x, j) => j === i ? { ...x, placement: e.target.value } : x))}
                  placeholder="Colocacao" className={inputCls} />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8" />

        {/* ── Premiacoes ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader label="Premiacoes" />
            <button type="button" onClick={addAward}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
              <IconPlus /> Adicionar
            </button>
          </div>
          {awards.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input value={a.title} onChange={(e) => setAwards((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                placeholder="Ex: 1o lugar — Winter Cup" className={`${inputCls} flex-1`} />
              <input type="number" min="2000" max="2100" value={a.year} onChange={(e) => setAwards((p) => p.map((x, j) => j === i ? { ...x, year: e.target.value } : x))}
                placeholder="Ano" className={`${inputCls} w-20`} />
              <input type="number" min="1" max="99" value={a.placement} onChange={(e) => setAwards((p) => p.map((x, j) => j === i ? { ...x, placement: e.target.value } : x))}
                placeholder="Pos." className={`${inputCls} w-16`} />
              <button type="button" onClick={() => setAwards((p) => p.filter((_, j) => j !== i))}
                className="flex items-center rounded-lg border border-white/10 px-2 text-zinc-600 hover:text-red-400">
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Cadastrar Robo" />
      </form>
    </Modal>
  );
}

// ─── WinRate ──────────────────────────────────────────────────────────────────

function WinRate({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = rate >= 70 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{wins}V · {losses}D · {draws}E</span>
        <span style={{ color }} className="font-bold">{rate}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, rate)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RobotsPage() {
  const router = useRouter();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = category ? `/api/robots?category=${category}` : '/api/robots';
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setRobots(data.robots ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  const top3 = [...robots].sort((a, b) => b.eloScore - a.eloScore).slice(0, 3);

  return (
    <>
      {showCreate && (
        <CreateRobotModal
          onClose={() => setShowCreate(false)}
          onCreated={(robot) => { setRobots((prev) => [robot, ...prev]); setShowCreate(false); }}
        />
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              ARENA DE <span className="text-amber-400">ROBOS</span>
            </h1>
            <p className="text-sm text-zinc-400">Ranking, historico de partidas e premiacoes</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400">
            + Cadastrar Robo
          </button>
        </div>

        {/* Podium */}
        {!category && top3.length >= 3 && (
          <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-[#0f1829]">
            <div className="border-b border-amber-500/20 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">TOP RANKING ELO</span>
            </div>
            <div className="flex items-end justify-center gap-4 p-6 pb-8">
              <div className="flex flex-col items-center gap-2 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-400 bg-zinc-700 text-2xl font-black text-zinc-200">2</div>
                <Link href={`/robots/${top3[1].id}`} className="text-center text-xs font-bold text-zinc-200 hover:text-amber-300">{top3[1].name}</Link>
                <span className="font-mono text-xs text-zinc-400">ELO {top3[1].eloScore}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M12 2l2.09 6.26H20l-5 3.64 1.91 5.86L12 14.14 7.09 17.76 9 11.9 4 8.26h5.91z"/></svg>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-900/40 text-2xl font-black text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">1</div>
                <Link href={`/robots/${top3[0].id}`} className="text-center text-sm font-black text-amber-300 hover:text-amber-200">{top3[0].name}</Link>
                <span className="font-mono text-xs text-amber-400">ELO {top3[0].eloScore}</span>
              </div>
              <div className="flex flex-col items-center gap-2 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-900/30 text-2xl font-black text-amber-600">3</div>
                <Link href={`/robots/${top3[2].id}`} className="text-center text-xs font-bold text-zinc-200 hover:text-amber-300">{top3[2].name}</Link>
                <span className="font-mono text-xs text-zinc-400">ELO {top3[2].eloScore}</span>
              </div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory(null)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${!category ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'}`}>
            Todos
          </button>
          {CATEGORY_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setCategory(opt.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${category === opt.value ? opt.filterActive : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-white/8 bg-slate-900">
                <div className="aspect-[4/3] animate-pulse bg-slate-800" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {robots.map((robot, idx) => {
              const cat = catConfig(robot.category);
              const coverUrl = robot.images?.[0]?.imageUrl ?? null;
              return (
                <div key={robot.id} role="button" tabIndex={0}
                  onClick={() => router.push(`/robots/${robot.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/robots/${robot.id}`)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/8 bg-slate-900 transition-all hover:border-amber-500/25 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">

                  {/* Cover */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt={robot.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <IconRobot />
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase backdrop-blur-sm ${cat.color}`}>
                      {cat.label}
                    </span>
                    {!category && idx < 3 && (
                      <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="font-bold text-zinc-100 transition-colors group-hover:text-amber-300">{robot.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <Link href={`/profile/${robot.owner.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-amber-400">
                          {robot.owner.name}
                        </Link>
                        {robot.team && (
                          <>
                            <span>·</span>
                            <span className="text-violet-400">{robot.team.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <WinRate wins={robot.wins} losses={robot.losses} draws={robot.draws} />

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                      <span className="font-mono text-amber-400">ELO {robot.eloScore}</span>
                      <span className="text-zinc-500">{robot._count.matches} partidas</span>
                      {robot.awards.length > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26H20l-5 3.64 1.91 5.86L12 14.14 7.09 17.76 9 11.9 4 8.26h5.91z"/></svg>
                          {robot.awards.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {robots.length === 0 && (
              <p className="col-span-full py-12 text-center text-zinc-500">Nenhum robo encontrado.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
