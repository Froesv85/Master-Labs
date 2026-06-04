'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import CodeViewer from './code-viewer';

type ExtractResponse = {
  data: {
    projectId: number;
    embeddingId: string;
      status: string;
      source: 'manual' | 'webhook';
      piiRedactions: number;
      keywords: string[];
      processedContent: string;
      processedAt: string;
      output?: {
        schemaVersion?: string;
        technicalRequirements?: Array<{
          id: string;
          name: string;
          detail: string;
          priority: 'high' | 'medium' | 'low';
        }>;
        suggestedBOM?: Array<{ item: string; quantity: number | string; notes: string }>;
        suggestedCode?: string;
        confidenceScore?: number;
      };
    };
  };

export default function ExtractPanel({
  projectId,
  initialInput,
  currentEmbeddingId,
}: {
  projectId: number;
  initialInput: string;
  currentEmbeddingId: string | null;
}) {
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [input, setInput] = useState(initialInput);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse['data'] | null>(null);

  const inputLength = useMemo(() => input.trim().length, [input]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageB64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function pollStatus(webhookId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/extract`);
      if (res.ok) {
        const payload = await res.json();
        const logs = payload.data as any[];
        const currentLog = logs.find((l) => l.webhookId === webhookId);
        if (currentLog && currentLog.status === 'done') {
          setResult((prev) => (prev ? { ...prev, status: 'done', output: typeof currentLog.output === 'string' ? JSON.parse(currentLog.output) : currentLog.output } : null));
          return true; // Stop polling
        }
        if (currentLog && currentLog.status === 'failed') {
          setError('Ocorreu um erro no pipeline do n8n.');
          setResult((prev) => (prev ? { ...prev, status: 'failed' } : null));
          return true; // Stop polling
        }
      }
    } catch (e) {
      console.error('Polling error', e);
    }
    return false; // Continue polling
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          source: 'manual',
          imageB64,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Falha ao executar extracao.');
      }

      const payload = (await response.json()) as any;
      const initialData = {
        ...payload.data,
        processedContent: input,
        processedAt: new Date().toISOString()
      };
      setResult(initialData);

      // Iniciar polling
      const webhookId = payload.data.webhookId;
      if (webhookId) {
        let attempts = 0;
        pollIntervalRef.current = setInterval(async () => {
          attempts++;
          const done = await pollStatus(webhookId);
          if (done || attempts > 20) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
          }
        }, 3000) as unknown as NodeJS.Timeout;
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Erro inesperado ao executar extracao.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold">Extracao tecnica (S1.1)</h3>
      <p className="mb-4 text-sm text-zinc-600">
        Envie um bloco de contexto tecnico para registrar conteudo anonimizavel e gerar um
        identificador de embedding para o pipeline IA.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Descreva stack de hardware/software, requisitos e observacoes do projeto"
          className="min-h-32 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-zinc-200 placeholder:text-zinc-400 focus:ring-2"
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>Minimo de 20 caracteres.</span>
          <span>Texto atual: {inputLength}</span>
          {currentEmbeddingId ? <span>Embedding atual: {currentEmbeddingId}</span> : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">Opcional: Enviar imagem (Esquema/Circuito)</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-xs text-zinc-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-zinc-100 file:text-zinc-700
                hover:file:bg-zinc-200"
            />
            {imageB64 && (
              <div className="relative h-12 w-12 shrink-0">
                <img src={imageB64} alt="Preview" className="h-full w-full rounded-md object-cover ring-1 ring-zinc-200" />
                <button 
                  type="button" 
                  onClick={() => setImageB64(null)} 
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 transition-all hover:bg-zinc-800"
          >
            {loading ? 'Processando...' : 'Executar extracao com Vision'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">Extracao registrada ({result.status}).</p>
          <p className="mt-1">Embedding: {result.embeddingId}</p>
          <p className="mt-1">Palavras-chave: {result.keywords?.join(', ') || 'nenhuma'}</p>
          
          {result.status === 'queued' && (
            <div className="mt-4 animate-pulse text-emerald-600 font-medium">
              ⏳ Processando Inteligência Artificial no n8n (RAG)...
            </div>
          )}

          {result.status === 'done' && result.output && (
            <div className="mt-4 border-t border-emerald-200 pt-4">
              <h4 className="font-bold mb-2">Requisitos Técnicos Gerados:</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {result.output.technicalRequirements?.map((req: any, i: number) => (
                  <li key={i}>
                    <strong>{req?.name || `Requisito ${i + 1}`}</strong>
                    {': '}
                    {req?.detail || 'Sem detalhes.'}
                    {req?.priority ? ` [${req.priority}]` : ''}
                  </li>
                ))}
              </ul>

              <h4 className="font-bold mb-2">Lista de Materiais (BOM):</h4>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {result.output.suggestedBOM?.map((bom: any, i: number) => (
                  <li key={i}>
                    <strong>{typeof bom?.quantity === 'object' ? JSON.stringify(bom?.quantity) : bom?.quantity}x {typeof bom?.item === 'object' ? JSON.stringify(bom?.item) : bom?.item}</strong>: <span className="text-emerald-700">{typeof bom?.notes === 'object' ? JSON.stringify(bom?.notes) : bom?.notes}</span>
                  </li>
                ))}
              </ul>

              {result.output.suggestedCode && (
                <>
                  <h4 className="font-bold mb-2 mt-4 text-zinc-900 leading-none">Firmware Sugerido:</h4>
                  <CodeViewer code={result.output.suggestedCode} />
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}