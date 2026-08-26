'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ProjectImage = { id: number; imageUrl: string; position: number };
type ProjectFile = { id: number; fileName: string; fileUrl: string; fileType: string; fileSizeKb: number };

type ProjectHeroData = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  creatorId: number;
  creatorName: string | null;
  creatorEmail: string;
  parentId: number | null;
  parentTitle: string | null;
  coverImageUrl: string | null;
  printerBrand: string | null;
  printerModel: string | null;
  printerNozzle: string | null;
  printerMaterial: string | null;
  printerLayerHeight: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProjectImage[];
  files: ProjectFile[];
  votes: number;
  shares: number;
  forkCount: number;
};

const CATEGORY_META: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  Printing3D: {
    label: 'Impressão 3D',
    badge: 'bg-violet-900/60 text-violet-300 border border-violet-500/30',
    icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  },
  Robotics: {
    label: 'Robótica',
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/30',
    icon: <><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11V7" /><circle cx="12" cy="5" r="2" /></>,
  },
  IoT: {
    label: 'IoT',
    badge: 'bg-teal-900/60 text-teal-300 border border-teal-500/30',
    icon: <><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" /></>,
  },
  Woodworking: {
    label: 'Marcenaria',
    badge: 'bg-amber-900/60 text-amber-300 border border-amber-500/30',
    icon: <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />,
  },
};

function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconFork({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" />
      <path d="M6 8.5V12a4 4 0 0 0 4 4M18 8.5V12a4 4 0 0 1-4 4" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconPrinter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function formatFileSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export default function ProjectHero({ project }: { project: ProjectHeroData }) {
  const router = useRouter();
  const gallery = project.images.length > 0
    ? project.images.map((img) => img.imageUrl)
    : project.coverImageUrl
      ? [project.coverImageUrl]
      : [];

  const [activeImg, setActiveImg] = useState(0);
  const [votes, setVotes] = useState(project.votes);
  const [shares, setShares] = useState(project.shares);
  const [voting, setVoting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [forking, setForking] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = CATEGORY_META[project.category] ?? CATEGORY_META.Robotics;
  const creatorProfileHref = `/profile/${project.creatorId}`;
  const initials = project.creatorName
    ? project.creatorName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  const hasPrinterInfo = project.category === 'Printing3D' && (
    project.printerBrand || project.printerModel || project.printerNozzle || project.printerMaterial || project.printerLayerHeight
  );

  async function handleVote() {
    setVoting(true); setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/vote`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao votar.');
      const payload = await res.json() as { data: { votes: number; alreadyVoted: boolean } };
      setVotes(payload.data.votes);
      if (payload.data.alreadyVoted) setError('Você já votou neste projeto.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao votar.');
    } finally {
      setVoting(false);
    }
  }

  async function handleShare() {
    setSharing(true); setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao compartilhar.');
      const payload = await res.json() as { data: { shares: number } };
      setShares(payload.data.shares);
      setShared(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao compartilhar.');
    } finally {
      setSharing(false);
    }
  }

  async function handleFork() {
    setForking(true); setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/fork`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao criar fork.');
      const payload = await res.json() as { data: { id: number } };
      router.push(`/projects/${payload.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fork.');
      setForking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/feed" className="hover:text-amber-400">Feed</Link>
        <span>/</span>
        <span className="line-clamp-1 text-zinc-300">{project.title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: gallery + description */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <div className="relative aspect-square w-full bg-slate-950 sm:aspect-[4/3]">
              {gallery.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gallery[activeImg] ?? gallery[0]} alt={project.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
                    {meta.label}
                  </span>
                </div>
              )}
              {project.parentId && (
                <Link
                  href={`/projects/${project.parentId}`}
                  className="absolute right-3 top-3 rounded-full border border-amber-500/40 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-amber-300 backdrop-blur-sm hover:bg-black/80"
                >
                  Fork de &ldquo;{project.parentTitle}&rdquo;
                </Link>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {gallery.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      activeImg === i ? 'border-amber-500' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Descrição</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
              {project.description ?? 'Este projeto ainda não possui descrição detalhada.'}
            </p>
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
            <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
              {meta.label}
            </span>
            <h1 className="text-xl font-black leading-snug text-white sm:text-2xl">{project.title}</h1>

            <Link href={creatorProfileHref} className="mt-3 flex items-center gap-2 group/c">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[11px] font-black text-black">
                {initials}
              </div>
              <span className="text-sm text-zinc-400 transition-colors group-hover/c:text-amber-400">
                {project.creatorName ?? project.creatorEmail}
              </span>
            </Link>

            {/* Stats row */}
            <div className="mt-4 flex items-center gap-4 border-y border-white/5 py-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><IconArrowUp className="h-3.5 w-3.5" />{votes} votos</span>
              <span className="flex items-center gap-1.5"><IconShare className="h-3.5 w-3.5" />{shares}</span>
              <span className="flex items-center gap-1.5"><IconFork className="h-3.5 w-3.5" />{project.forkCount}</span>
              {project.files.length > 0 && (
                <span className="flex items-center gap-1.5"><IconDownload className="h-3.5 w-3.5" />{project.files.length}</span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={voting}
                onClick={handleVote}
                className="flex flex-col items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-60"
              >
                <IconArrowUp className="h-4 w-4" />
                <span className="text-[11px] font-bold">Votar</span>
              </button>
              <button
                type="button"
                disabled={sharing || shared}
                onClick={handleShare}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 transition disabled:opacity-60 ${
                  shared ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                }`}
              >
                <IconShare className="h-4 w-4" />
                <span className="text-[11px] font-bold">{shared ? 'Enviado' : 'Compartilhar'}</span>
              </button>
              <button
                type="button"
                disabled={forking}
                onClick={handleFork}
                className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-zinc-300 transition hover:border-white/20 disabled:opacity-60"
              >
                <IconFork className="h-4 w-4" />
                <span className="text-[11px] font-bold">{forking ? '...' : 'Fork'}</span>
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Printer specs */}
          {hasPrinterInfo && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-900/10 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                <IconPrinter className="h-4 w-4" />
                Configuração da Impressora
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                {project.printerBrand && (
                  <div><dt className="text-zinc-500">Marca</dt><dd className="font-semibold text-zinc-200">{project.printerBrand}</dd></div>
                )}
                {project.printerModel && (
                  <div><dt className="text-zinc-500">Modelo</dt><dd className="font-semibold text-zinc-200">{project.printerModel}</dd></div>
                )}
                {project.printerNozzle && (
                  <div><dt className="text-zinc-500">Bico</dt><dd className="font-semibold text-zinc-200">{project.printerNozzle}</dd></div>
                )}
                {project.printerMaterial && (
                  <div><dt className="text-zinc-500">Material</dt><dd className="font-semibold text-zinc-200">{project.printerMaterial}</dd></div>
                )}
                {project.printerLayerHeight && (
                  <div><dt className="text-zinc-500">Altura de camada</dt><dd className="font-semibold text-zinc-200">{project.printerLayerHeight}</dd></div>
                )}
              </dl>
            </div>
          )}

          {/* Files */}
          {project.files.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Arquivos de Impressão ({project.files.length})
              </h2>
              <ul className="space-y-2">
                {project.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.fileUrl}
                      download={file.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs transition hover:border-amber-500/30 hover:bg-amber-500/5"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <IconDownload className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate text-zinc-200">{file.fileName}</span>
                      </span>
                      <span className="shrink-0 text-zinc-500">{formatFileSize(file.fileSizeKb)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 text-xs text-zinc-500">
            <p>Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p>Atualizado em {new Date(project.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
