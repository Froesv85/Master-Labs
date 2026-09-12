'use client';

import { useEffect, useState } from 'react';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { isValidYoutubeUrl } from '@/lib/youtube';

type TechnicalRequirement = { id: string; name: string; detail: string; priority: string };
type BomItem = { item: string; quantity: string; notes: string };
type AssemblyStep = { step: number; title: string; detail: string };

type DossierData = {
  technicalRequirements: TechnicalRequirement[];
  suggestedBOM: BomItem[];
  assemblySteps: AssemblyStep[];
  videoUrl: string | null;
  sourceExtractionLogId: number | null;
} | null;

type LatestPrediction = {
  predictedCategory: string | null;
  predictedDifficulty: string | null;
  predictedDomains: string[];
  auditScore: number | null;
  auditFlags: string[];
} | null;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h4 className="mb-3 text-base font-semibold text-zinc-900">{title}</h4>
      {children}
    </div>
  );
}

function IconButton({ onClick, label, tone = 'zinc' }: { onClick: () => void; label: string; tone?: 'zinc' | 'red' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-medium ${
        tone === 'red' ? 'text-red-600 hover:bg-red-50' : 'text-zinc-500 hover:bg-zinc-100'
      }`}
    >
      {label}
    </button>
  );
}

const inputClass =
  'w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none ring-zinc-200 focus:ring-2';

export default function DossierPanel({ projectId, refreshSignal }: { projectId: number; refreshSignal: number }) {
  const [dossier, setDossier] = useState<DossierData>(null);
  const [prediction, setPrediction] = useState<LatestPrediction>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [dossierRes, extractRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/dossier`, { cache: 'no-store' }),
        fetch(`/api/projects/${projectId}/extract`, { cache: 'no-store' }),
      ]);

      if (dossierRes.ok) {
        const payload = await dossierRes.json();
        setDossier(payload.data);
      }
      if (extractRes.ok) {
        const payload = await extractRes.json();
        const latest = payload.data?.find((l: { status: string }) => l.status === 'done') ?? null;
        setPrediction(latest);
      }
    } catch {
      setError('Não foi possível carregar o dossiê.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshSignal]);

  async function handleSave() {
    if (!dossier) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/dossier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dossier),
      });
      if (!res.ok) throw new Error('Falha ao salvar o dossiê.');
      setNotice('Alterações salvas.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResync() {
    if (!window.confirm('Isso substitui suas edições atuais pelo resultado mais recente da IA. Continuar?')) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/dossier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resync: true }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Falha ao ressincronizar.');
      }
      const payload = await res.json();
      setDossier(payload.data);
      setNotice('Dossiê atualizado a partir da última extração.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao ressincronizar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Carregando dossiê...</p>;
  }

  if (!dossier) {
    return (
      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-900">
        <h3 className="font-semibold text-lg">Dossiê ainda não gerado</h3>
        <p className="mt-2 text-sm opacity-90">
          Execute uma extração na aba &ldquo;Engenharia IA&rdquo; para gerar o primeiro dossiê editável deste projeto.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {prediction && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">Classificação automática (Fase 5)</p>
          <p className="mt-1">
            Categoria: <strong>{prediction.predictedCategory ?? '—'}</strong> · Dificuldade:{' '}
            <strong>{prediction.predictedDifficulty ?? '—'}</strong>
            {prediction.predictedDomains?.length ? ` · Domínios: ${prediction.predictedDomains.join(', ')}` : ''}
          </p>
          {prediction.auditScore !== null && (
            <p className="mt-1">
              Score de auditoria: <strong>{prediction.auditScore}/100</strong>
              {prediction.auditFlags?.length ? ` — ${prediction.auditFlags.join('; ')}` : ''}
            </p>
          )}
        </div>
      )}

      <SectionCard title="Requisitos Técnicos">
        <div className="space-y-3">
          {dossier.technicalRequirements.map((req, i) => (
            <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={req.name}
                  placeholder="Nome do requisito"
                  onChange={(e) => {
                    const next = [...dossier.technicalRequirements];
                    next[i] = { ...next[i], name: e.target.value };
                    setDossier({ ...dossier, technicalRequirements: next });
                  }}
                />
                <select
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs"
                  value={req.priority}
                  onChange={(e) => {
                    const next = [...dossier.technicalRequirements];
                    next[i] = { ...next[i], priority: e.target.value };
                    setDossier({ ...dossier, technicalRequirements: next });
                  }}
                >
                  <option value="high">alta</option>
                  <option value="medium">média</option>
                  <option value="low">baixa</option>
                </select>
                <IconButton
                  tone="red"
                  label="remover"
                  onClick={() =>
                    setDossier({
                      ...dossier,
                      technicalRequirements: dossier.technicalRequirements.filter((_, idx) => idx !== i),
                    })
                  }
                />
              </div>
              <textarea
                className={`${inputClass} mt-2 min-h-16`}
                value={req.detail}
                placeholder="Detalhe"
                onChange={(e) => {
                  const next = [...dossier.technicalRequirements];
                  next[i] = { ...next[i], detail: e.target.value };
                  setDossier({ ...dossier, technicalRequirements: next });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-zinc-700 hover:underline"
          onClick={() =>
            setDossier({
              ...dossier,
              technicalRequirements: [
                ...dossier.technicalRequirements,
                { id: `TR-${dossier.technicalRequirements.length + 1}`, name: '', detail: '', priority: 'medium' },
              ],
            })
          }
        >
          + adicionar requisito
        </button>
      </SectionCard>

      <SectionCard title="Lista de Materiais (BOM)">
        <div className="space-y-3">
          {dossier.suggestedBOM.map((bom, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <input
                className={`${inputClass} w-16`}
                value={bom.quantity}
                placeholder="Qtd"
                onChange={(e) => {
                  const next = [...dossier.suggestedBOM];
                  next[i] = { ...next[i], quantity: e.target.value };
                  setDossier({ ...dossier, suggestedBOM: next });
                }}
              />
              <input
                className={inputClass}
                value={bom.item}
                placeholder="Item"
                onChange={(e) => {
                  const next = [...dossier.suggestedBOM];
                  next[i] = { ...next[i], item: e.target.value };
                  setDossier({ ...dossier, suggestedBOM: next });
                }}
              />
              <input
                className={inputClass}
                value={bom.notes}
                placeholder="Notas"
                onChange={(e) => {
                  const next = [...dossier.suggestedBOM];
                  next[i] = { ...next[i], notes: e.target.value };
                  setDossier({ ...dossier, suggestedBOM: next });
                }}
              />
              <IconButton
                tone="red"
                label="remover"
                onClick={() => setDossier({ ...dossier, suggestedBOM: dossier.suggestedBOM.filter((_, idx) => idx !== i) })}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-zinc-700 hover:underline"
          onClick={() =>
            setDossier({ ...dossier, suggestedBOM: [...dossier.suggestedBOM, { item: '', quantity: '1', notes: '' }] })
          }
        >
          + adicionar item
        </button>
      </SectionCard>

      <SectionCard title="Etapas de Montagem">
        <div className="space-y-3">
          {dossier.assemblySteps.map((step, i) => (
            <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <input
                  className={inputClass}
                  value={step.title}
                  placeholder="Título da etapa"
                  onChange={(e) => {
                    const next = [...dossier.assemblySteps];
                    next[i] = { ...next[i], title: e.target.value };
                    setDossier({ ...dossier, assemblySteps: next });
                  }}
                />
                <IconButton
                  tone="red"
                  label="remover"
                  onClick={() =>
                    setDossier({ ...dossier, assemblySteps: dossier.assemblySteps.filter((_, idx) => idx !== i) })
                  }
                />
              </div>
              <textarea
                className={`${inputClass} mt-2 min-h-16`}
                value={step.detail}
                placeholder="Detalhe da etapa"
                onChange={(e) => {
                  const next = [...dossier.assemblySteps];
                  next[i] = { ...next[i], detail: e.target.value };
                  setDossier({ ...dossier, assemblySteps: next });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-zinc-700 hover:underline"
          onClick={() =>
            setDossier({
              ...dossier,
              assemblySteps: [...dossier.assemblySteps, { step: dossier.assemblySteps.length + 1, title: '', detail: '' }],
            })
          }
        >
          + adicionar etapa
        </button>
      </SectionCard>

      <SectionCard title="Vídeo do Projeto">
        <input
          className={inputClass}
          value={dossier.videoUrl ?? ''}
          placeholder="https://youtube.com/watch?v=..."
          onChange={(e) => setDossier({ ...dossier, videoUrl: e.target.value || null })}
        />
        {dossier.videoUrl && isValidYoutubeUrl(dossier.videoUrl) && (
          <div className="mt-3 max-w-md">
            <YoutubeEmbed url={dossier.videoUrl} title="Vídeo do projeto" />
          </div>
        )}
        {dossier.videoUrl && !isValidYoutubeUrl(dossier.videoUrl) && (
          <p className="mt-2 text-xs text-red-600">Link inválido — use um link do YouTube.</p>
        )}
      </SectionCard>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-zinc-800"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleResync}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-zinc-50"
        >
          Atualizar da IA
        </button>
      </div>
    </div>
  );
}
