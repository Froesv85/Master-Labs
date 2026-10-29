'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Modal, Field, FormActions, inputCls, selectCls } from '@/components/modal';
import { fetchProjectsFeed, voteProject } from '@/features/social/projects/api';
import type { FeedCategory, FeedSort, ProjectItem, ProjectsFeedResponse } from '@/features/social/projects/types';
import { isValidYoutubeUrl } from '@/lib/youtube';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: Array<{
  label: string; value: FeedCategory;
  badge: string; filterActive: string; filterHover: string;
  icon: React.ReactNode;
}> = [
  {
    label: 'Impressão 3D', value: '3D_Printing',
    badge: 'bg-violet-900/60 text-violet-300 border border-violet-500/30',
    filterActive: 'border-violet-400 bg-violet-600 text-white',
    filterHover: 'border-white/10 text-zinc-400 hover:border-violet-500/40 hover:text-violet-300',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  },
  {
    label: 'Robótica', value: 'Robotics',
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/30',
    filterActive: 'border-blue-400 bg-blue-600 text-white',
    filterHover: 'border-white/10 text-zinc-400 hover:border-blue-500/40 hover:text-blue-300',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 15h0M17 15h0"/></svg>,
  },
  {
    label: 'IoT', value: 'IoT',
    badge: 'bg-teal-900/60 text-teal-300 border border-teal-500/30',
    filterActive: 'border-teal-400 bg-teal-600 text-white',
    filterHover: 'border-white/10 text-zinc-400 hover:border-teal-500/40 hover:text-teal-300',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  },
  {
    label: 'Marcenaria', value: 'Woodworking',
    badge: 'bg-amber-900/60 text-amber-300 border border-amber-500/30',
    filterActive: 'border-amber-400 bg-amber-600 text-white',
    filterHover: 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-amber-300',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14.5c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.83 8 21v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5c0 .83-.67 1.5-1.5 1.5h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>,
  },
];

const PRINTER_MATERIALS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'Resina', 'Fibra de Carbono', 'Madeira Preenchida', 'Outro'];
const NOZZLE_SIZES = ['0.2mm', '0.4mm', '0.6mm', '0.8mm', '1.0mm'];
const LAYER_HEIGHTS = ['0.05mm', '0.1mm', '0.15mm', '0.2mm', '0.25mm', '0.3mm', '0.4mm'];
const PAGE_SIZE = 9;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayCategory(cat: ProjectItem['tags'][number]): FeedCategory {
  return cat === 'Printing3D' ? '3D_Printing' : cat as FeedCategory;
}

function getCategoryOption(cat: ProjectItem['tags'][number]) {
  return CATEGORY_OPTIONS.find((o) => o.value === displayCategory(cat));
}

const VISIBILITY_LABEL: Record<string, string> = {
  public: 'Pública',
  private_owner: 'Privada · só eu',
  private_team: 'Privada · equipe',
};

function VisibilityBadge({ visibility }: { visibility: string }) {
  const isPublic = visibility === 'public';
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${isPublic ? 'border-teal-500/30 bg-teal-900/30 text-teal-400' : 'border-violet-500/30 bg-violet-900/30 text-violet-400'}`}>
      {VISIBILITY_LABEL[visibility] ?? visibility}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconPrinter() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

// ─── CategoryPlaceholder ──────────────────────────────────────────────────────

function CategoryPlaceholder({ tags }: { tags: ProjectItem['tags'] }) {
  const category = tags[0];
  const opt = category ? getCategoryOption(category) : undefined;
  const gradients: Record<string, string> = {
    '3D_Printing': 'from-violet-900/80 to-violet-950',
    Robotics: 'from-blue-900/80 to-blue-950',
    IoT: 'from-teal-900/80 to-teal-950',
    Woodworking: 'from-amber-900/80 to-amber-950',
  };
  const grad = (category ? gradients[displayCategory(category)] : undefined) ?? 'from-slate-800 to-slate-900';
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad}`}>
      <span className="opacity-20 [&>svg]:h-12 [&>svg]:w-12">{opt?.icon}</span>
    </div>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onVote, isVoting }: {
  project: ProjectItem;
  onVote: (id: number) => void;
  isVoting: boolean;
}) {
  const initials = project.creatorName
    ? project.creatorName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-white/8 bg-slate-900 transition-all hover:border-amber-500/25 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(245,158,11,0.12)]">
      {/* Cover image */}
      <Link href={`/projects/${project.id}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-950">
        {project.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CategoryPlaceholder tags={project.tags} />
        )}

        {/* Tag badges overlaid */}
        <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {project.tags.map((t) => {
            const opt = getCategoryOption(t);
            return (
              <span key={t} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${opt?.badge ?? 'bg-slate-800/80 text-zinc-300 border border-white/10'}`}>
                <span className="[&>svg]:h-3 [&>svg]:w-3">{opt?.icon}</span>
                {opt?.label ?? displayCategory(t)}
              </span>
            );
          })}
        </span>

        {/* Fork badge */}
        {project.parentId && (
          <span className="absolute right-3 top-3 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur-sm">
            Fork
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/projects/${project.id}`}>
          <h2 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-zinc-100 transition-colors group-hover:text-amber-300">
            {project.title}
          </h2>
        </Link>
        {project.visibility !== 'public' && (
          <div className="mb-1.5"><VisibilityBadge visibility={project.visibility} /></div>
        )}
        <p className="flex-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {project.description ?? 'Sem descrição.'}
        </p>

        {/* Printer info (Printing3D only) */}
        {project.tags.includes('Printing3D') && (project.printerBrand || project.printerMaterial) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {project.printerBrand && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-900/30 px-2 py-0.5 text-[10px] text-violet-300">
                <IconPrinter />{project.printerBrand}{project.printerModel ? ` ${project.printerModel}` : ''}
              </span>
            )}
            {project.printerMaterial && (
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-zinc-400">
                {project.printerMaterial}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <Link href={`/profile/${project.creatorId}`} onClick={(e) => e.stopPropagation()} className="group/c flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-black text-black">
              {initials}
            </div>
            <span className="text-xs text-zinc-500 transition-colors group-hover/c:text-amber-400">
              {project.creatorName ?? 'Maker'}
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {project.fileCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                <IconFile />{project.fileCount}
              </span>
            )}
            <button
              type="button"
              disabled={isVoting}
              onClick={() => onVote(project.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-60"
            >
              <IconArrowUp />{isVoting ? '…' : project.votes}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── CreateProjectModal ───────────────────────────────────────────────────────

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [tags, setTags] = useState<string[]>(['Robotics']);
  const [componentsList, setComponentsList] = useState<{ name: string; quantity: string; description: string }[]>([]);
  const [assemblySteps, setAssemblySteps] = useState<{ title: string; detail: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private_owner' | 'private_team'>('public');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [myTeams, setMyTeams] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sugestão por IA (description + BOM + etapas, via MakerBrain/Ollama)
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Cover image
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverB64, setCoverB64] = useState<string | null>(null);
  const [coverContentType, setCoverContentType] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // 3D files
  const [files3D, setFiles3D] = useState<{ name: string; b64: string; sizeKb: number }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Printer config
  const [printerBrand, setPrinterBrand] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [printerNozzle, setPrinterNozzle] = useState('');
  const [printerMaterial, setPrinterMaterial] = useState('');
  const [printerLayerHeight, setPrinterLayerHeight] = useState('');

  const is3D = tags.includes('Printing3D');

  function toggleTag(value: string) {
    setTags((prev) => prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]);
  }

  function addComponent() {
    setComponentsList((p) => [...p, { name: '', quantity: '1', description: '' }]);
  }

  function addStep() {
    setAssemblySteps((p) => [...p, { title: '', detail: '' }]);
  }

  async function handleSuggest() {
    if (title.trim().length < 3) {
      setSuggestError('Preencha o título (mínimo 3 caracteres) antes de pedir sugestão.');
      return;
    }
    setSuggesting(true);
    setSuggestError(null);
    try {
      const categoryLabel = CATEGORY_OPTIONS.find((o) => {
        const value = o.value === '3D_Printing' ? 'Printing3D' : o.value;
        return tags.includes(value);
      })?.label;
      const res = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, objective, category: categoryLabel }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Erro ao gerar sugestão');

      const draft = payload.data as {
        description: string;
        suggestedBOM: { item: string; quantity: string; notes: string }[];
        assemblySteps: { step: number; title: string; detail: string }[];
      };

      if (draft.description) setDescription(draft.description);
      if (draft.suggestedBOM.length > 0) {
        setComponentsList(draft.suggestedBOM.map((b) => ({ name: b.item, quantity: b.quantity, description: b.notes })));
      }
      if (draft.assemblySteps.length > 0) {
        setAssemblySteps(draft.assemblySteps.map((s) => ({ title: s.title, detail: s.detail })));
      }
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Erro ao gerar sugestão');
    } finally {
      setSuggesting(false);
    }
  }

  useEffect(() => {
    if (visibility !== 'private_team') return;
    fetch('/api/teams/mine').then((r) => r.ok ? r.json() : { data: [] }).then((body) => setMyTeams(body.data ?? [])).catch(() => {});
  }, [visibility]);

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

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    setError(null);
    newFiles.forEach((file) => {
      if (file.size > 200 * 1024 * 1024) { setError(`${file.name} excede 200 MB`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const b64 = result.split(',')[1];
        setFiles3D((prev) => [...prev, { name: file.name, b64, sizeKb: Math.ceil(file.size / 1024) }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) { setError('Título obrigatório'); return; }
    if (tags.length === 0) { setError('Selecione ao menos uma tag'); return; }
    if (visibility === 'private_team' && !teamId) { setError('Selecione a equipe'); return; }
    if (videoUrl.trim() && !isValidYoutubeUrl(videoUrl.trim())) { setError('Link de vídeo inválido. Use um link do YouTube.'); return; }
    setSaving(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        title, description, objective, tags, visibility,
        ...(visibility === 'private_team' ? { teamId } : {}),
      };
      const validComponents = componentsList.filter((c) => c.name.trim());
      if (validComponents.length > 0) {
        body.components = validComponents.map((c) => ({
          name: c.name.trim(),
          quantity: Number(c.quantity) || 1,
          description: c.description.trim() || undefined,
        }));
      }
      if (coverB64 && coverContentType) { body.coverImageB64 = coverB64; body.coverImageContentType = coverContentType; }
      if (is3D) {
        if (printerBrand) body.printerBrand = printerBrand;
        if (printerModel) body.printerModel = printerModel;
        if (printerNozzle) body.printerNozzle = printerNozzle;
        if (printerMaterial) body.printerMaterial = printerMaterial;
        if (printerLayerHeight) body.printerLayerHeight = printerLayerHeight;
      }

      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao criar'); }
      const project = await res.json();

      if (is3D && files3D.length > 0) {
        await Promise.allSettled(
          files3D.map((f) =>
            fetch(`/api/projects/${project.id}/files`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileB64: f.b64, fileName: f.name }),
            })
          )
        );
      }

      // Dossiê (BOM/etapas/vídeo) alimenta o PDF exportado e a página do projeto -
      // já popula com o que foi preenchido na criação, sem esperar uma extração.
      const dossierBOM = validComponents.map((c) => ({ item: c.name.trim(), quantity: c.quantity, notes: c.description.trim() }));
      const validSteps = assemblySteps.filter((s) => s.title.trim());
      if (dossierBOM.length > 0 || validSteps.length > 0 || videoUrl.trim()) {
        await fetch(`/api/projects/${project.id}/dossier`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            suggestedBOM: dossierBOM,
            assemblySteps: validSteps.map((s, i) => ({ step: i + 1, title: s.title.trim(), detail: s.detail.trim() })),
            videoUrl: videoUrl.trim() || null,
          }),
        }).catch(() => {}); // não bloqueia a criação do projeto se isso falhar
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      setSaving(false);
    }
  }

  return (
    <Modal title="Criar Projeto" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-7">
        <p className="-mt-1 text-sm text-zinc-400">
          Preencha o essencial e publique — você pode editar BOM, etapas e vídeo depois na página do projeto.
        </p>

        {/* 1. Capa */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">1. Imagem de capa <span className="font-normal normal-case text-zinc-600">(opcional)</span></h3>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Adicionar foto do modelo
              <span className="text-xs text-zinc-600">jpeg, png, webp — máx 8 MB</span>
            </button>
          )}
          <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCoverChange} />
        </section>

        {/* 2. Sobre o projeto */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">2. Sobre o projeto</h3>

          <Field label="Título" hint="o nome do seu projeto">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Alimentador automático de ração" className={inputCls} />
          </Field>

          <Field label="Tags" hint="escolha a(s) categoria(s) — ajuda outros makers a encontrar seu projeto">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const value = opt.value === '3D_Printing' ? 'Printing3D' : opt.value;
                const active = tags.includes(value);
                return (
                  <button key={opt.value} type="button" onClick={() => toggleTag(value)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${active ? opt.filterActive : opt.filterHover}`}>
                    <span className="[&>svg]:h-3 [&>svg]:w-3">{opt.icon}</span>{opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Objetivo" hint="(opcional) — que problema esse projeto resolve?">
            <textarea rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ex.: Alimentar o pet automaticamente enquanto estou fora" className={`${inputCls} resize-none`} />
          </Field>

          {/* Sugestão por IA */}
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-teal-300">Sugestão com IA</p>
                <p className="text-xs text-zinc-500">Gera um rascunho de descrição, lista de materiais e etapas de montagem a partir do título/objetivo — você revisa e edita antes de publicar.</p>
              </div>
              <button type="button" onClick={handleSuggest} disabled={suggesting || title.trim().length < 3}
                className="shrink-0 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                {suggesting ? 'Gerando…' : 'Sugerir com IA'}
              </button>
            </div>
            {suggestError && <p className="mt-2 text-xs text-red-400">{suggestError}</p>}
          </div>

          <Field label="Descrição" hint="(opcional) — ou use a sugestão com IA acima">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que você está construindo?" className={`${inputCls} resize-none`} />
          </Field>
        </section>

        {/* 3. Lista de materiais */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">3. Lista de materiais (BOM) <span className="font-normal normal-case text-zinc-600">(opcional)</span></h3>
            <button type="button" onClick={addComponent}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
              + Adicionar
            </button>
          </div>
          {componentsList.length === 0 && (
            <p className="text-xs text-zinc-600">Peças, materiais, módulos usados no projeto — ex.: &quot;Arduino Uno&quot;, qtd 1.</p>
          )}
          {componentsList.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input value={c.name} onChange={(e) => setComponentsList((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                placeholder="Nome do componente" className={`${inputCls} flex-1`} />
              <input type="number" min="1" value={c.quantity} onChange={(e) => setComponentsList((p) => p.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))}
                placeholder="Qtd" className={`${inputCls} w-16 text-center`} />
              <input value={c.description} onChange={(e) => setComponentsList((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                placeholder="Obs." className={`${inputCls} flex-1`} />
              <button type="button" onClick={() => setComponentsList((p) => p.filter((_, j) => j !== i))}
                className="rounded-lg border border-white/10 bg-slate-800 px-2 text-zinc-600 hover:text-red-400">x</button>
            </div>
          ))}
        </section>

        {/* 4. Etapas de montagem */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">4. Etapas de montagem <span className="font-normal normal-case text-zinc-600">(opcional)</span></h3>
            <button type="button" onClick={addStep}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
              + Adicionar
            </button>
          </div>
          {assemblySteps.length === 0 && (
            <p className="text-xs text-zinc-600">O passo a passo de montagem, em ordem — ou use a sugestão com IA acima.</p>
          )}
          {assemblySteps.map((s, i) => (
            <div key={i} className="flex gap-2">
              <span className="flex h-10 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-zinc-500">{i + 1}</span>
              <div className="flex-1 space-y-1.5">
                <input value={s.title} onChange={(e) => setAssemblySteps((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  placeholder="Título da etapa" className={inputCls} />
                <input value={s.detail} onChange={(e) => setAssemblySteps((p) => p.map((x, j) => j === i ? { ...x, detail: e.target.value } : x))}
                  placeholder="Detalhes (opcional)" className={inputCls} />
              </div>
              <button type="button" onClick={() => setAssemblySteps((p) => p.filter((_, j) => j !== i))}
                className="shrink-0 rounded-lg border border-white/10 bg-slate-800 px-2 text-zinc-600 hover:text-red-400">x</button>
            </div>
          ))}
        </section>

        {/* 5. Vídeo */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">5. Vídeo <span className="font-normal normal-case text-zinc-600">(opcional)</span></h3>
          <Field label="Link do YouTube" hint="mostra o vídeo do projeto na página e no PDF exportado">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">6. Visibilidade</h3>
          <Field label="Quem pode ver">
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className={selectCls}>
              <option value="public">Pública — aparece para todos</option>
              <option value="private_owner">Privada — só eu</option>
              <option value="private_team">Privada — minha equipe</option>
            </select>
          </Field>
          {visibility === 'private_team' && (
            <Field label="Equipe">
              <select value={teamId} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')} className={selectCls}>
                <option value="">Selecione a equipe...</option>
                {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {myTeams.length === 0 && <p className="mt-1 text-xs text-zinc-600">Você não é membro aprovado de nenhuma equipe.</p>}
            </Field>
          )}
        </section>

        {/* 3D Printing section */}
        {is3D && (
          <div className="space-y-4 rounded-xl border border-violet-500/20 bg-violet-900/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">Configuracao da Impressora</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca">
                <input value={printerBrand} onChange={(e) => setPrinterBrand(e.target.value)} placeholder="Bambu Lab, Creality..." className={inputCls} />
              </Field>
              <Field label="Modelo">
                <input value={printerModel} onChange={(e) => setPrinterModel(e.target.value)} placeholder="X1C, Ender 3..." className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Bico">
                <select value={printerNozzle} onChange={(e) => setPrinterNozzle(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {NOZZLE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Material">
                <select value={printerMaterial} onChange={(e) => setPrinterMaterial(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {PRINTER_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Altura de camada">
                <select value={printerLayerHeight} onChange={(e) => setPrinterLayerHeight(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {LAYER_HEIGHTS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
            </div>

            {/* 3D file upload */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-violet-400">Arquivos de impressao</p>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-900/10 py-4 text-sm text-zinc-500 transition hover:border-violet-400/50 hover:text-zinc-300">
                <IconFile />
                Adicionar STL, GCode, 3MF...
              </button>
              <input ref={fileRef} type="file" multiple
                accept=".stl,.gcode,.3mf,.obj,.amf,.step,.stp,.f3d"
                className="hidden" onChange={handleFileAdd} />
              {files3D.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {files3D.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-xs">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <IconFile />
                        <span className="max-w-[200px] truncate">{f.name}</span>
                        <span className="text-zinc-600">{f.sizeKb} KB</span>
                      </span>
                      <button type="button" onClick={() => setFiles3D((p) => p.filter((_, j) => j !== i))}
                        className="text-zinc-600 hover:text-red-400">x</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>}
        <FormActions onClose={onClose} saving={saving} label="Criar Projeto" />
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<FeedSort>('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingProjectId, setVotingProjectId] = useState<number | null>(null);
  const [response, setResponse] = useState<ProjectsFeedResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const categoryQuery = useMemo(() => selectedCategory === 'ALL' ? null : selectedCategory, [selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const payload = await fetchProjectsFeed({ page, pageSize: PAGE_SIZE, sort, tag: categoryQuery, q: searchQuery, signal: controller.signal });
        setResponse(payload);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erro inesperado.');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [categoryQuery, page, searchQuery, sort]);

  async function handleVote(projectId: number) {
    setVotingProjectId(projectId); setError(null);
    try {
      const payload = await voteProject(projectId);
      setResponse((prev) => prev ? { ...prev, data: prev.data.map((p) => p.id === payload.data.projectId ? { ...p, votes: payload.data.votes } : p) } : prev);
      if (payload.data.alreadyVoted) setError('Você já votou neste projeto.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao votar.');
    } finally {
      setVotingProjectId(null);
    }
  }

  async function handleCreated() {
    setShowCreate(false);
    setPage(1); setSearchQuery(''); setSearchInput(''); setSelectedCategory('ALL'); setSort('newest');
    setLoading(true);
    const payload = await fetchProjectsFeed({ page: 1, pageSize: PAGE_SIZE, sort: 'newest' });
    setResponse(payload); setLoading(false);
  }

  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <>
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              <span className="text-amber-400">PROJETOS</span>
            </h1>
            <p className="text-sm text-zinc-400">Compartilhamento de projetos públicos — comente, faça fork, vote e compartilhe.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(245,158,11,0.3)] transition hover:bg-amber-400"
          >
            + Criar Projeto
          </button>
        </div>

        {/* Search + Sort */}
        <form className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setSearchQuery(searchInput); }}>
          <div className="relative min-w-[180px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
            <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar projetos..."
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-800 pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-amber-500 px-4 text-sm font-bold text-black transition hover:bg-amber-400">Buscar</button>
          {hasActiveSearch && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
              className="h-10 rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-400 transition hover:text-zinc-200">x</button>
          )}
          <select value={sort} onChange={(e) => { setSort(e.target.value as FeedSort); setPage(1); }}
            className="ml-auto h-10 rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-zinc-300 outline-none focus:border-amber-500/50">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="top">Mais votados</option>
          </select>
        </form>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setSelectedCategory('ALL'); setPage(1); }}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${selectedCategory === 'ALL' ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200'}`}>
            Todas
          </button>
          {CATEGORY_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { setSelectedCategory(opt.value); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${selectedCategory === opt.value ? opt.filterActive : opt.filterHover}`}>
              <span className="[&>svg]:h-3 [&>svg]:w-3">{opt.icon}</span>{opt.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-white/8 bg-slate-900">
                <div className="aspect-[4/3] animate-pulse bg-slate-800" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && response && response.data.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-16 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p className="text-base font-semibold text-zinc-400">Nenhum projeto encontrado</p>
            <p className="text-sm text-zinc-500">Tente ajustar os filtros ou a busca.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && response && response.data.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {response.data.map((project) => (
              <ProjectCard key={project.id} project={project}
                onVote={handleVote}
                isVoting={votingProjectId === project.id} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && response && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              <span className="font-bold text-zinc-300">{response.pagination.total}</span> projetos · página {response.pagination.page} de {response.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={response.pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40">
                Anterior
              </button>
              <button type="button" disabled={response.pagination.page >= response.pagination.totalPages} onClick={() => setPage((p) => Math.min(response.pagination.totalPages, p + 1))}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40">
                Proxima
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
