'use client';

import { useState, useEffect } from 'react';

type ProjectExport = {
  id: number;
  status: string;
  fileUrl: string | null;
  error: string | null;
  createdAt: string;
};

export default function ExportPanel({ projectId, canGenerate = true }: { projectId: number; canGenerate?: boolean }) {
  const [exportsList, setExportsList] = useState<ProjectExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  async function fetchExports() {
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (res.ok) {
        const payload = await res.json();
        setExportsList(payload.data);
        
        // Verifica se ainda há algum export processando para continuar o polling
        const hasProcessing = payload.data.some((e: ProjectExport) => e.status === 'processing' || e.status === 'queued');
        setIsPolling(hasProcessing);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchExports();
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(() => {
        fetchExports();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, projectId]);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Falha ao solicitar exportação');
      }
      setIsPolling(true);
      await fetchExports();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro genérico ao exportar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-blue-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Exportação Técnica (PDF)</h3>
          <p className="max-w-md text-sm text-zinc-600">
            Gera um dossiê técnico PDF auditável utilizando as evidências do log de dificuldades e os requisitos calculados pela IA (MakerBrain RAG).
          </p>
        </div>
        {canGenerate && (
          <button
            onClick={handleExport}
            disabled={loading || isPolling}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-blue-700 transition-colors"
          >
            {loading || isPolling ? 'Montando PDF...' : 'Gerar Novo PDF'}
          </button>
        )}
      </div>

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {exportsList.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-zinc-700 mb-3 border-b pb-2">Histórico de Arquivos</h4>
          <ul className="space-y-3">
            {exportsList.map((exp) => (
              <li key={exp.id} className="flex items-center justify-between bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                <div className="text-sm">
                  <p className="font-medium">Exportação #{exp.id}</p>
                  <p className="text-xs text-zinc-500">{new Date(exp.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  {exp.status === 'processing' || exp.status === 'queued' ? (
                    <span className="text-sm text-blue-600 animate-pulse font-medium">Buscando inteligência e vetorizando...</span>
                  ) : exp.status === 'done' ? (
                    <a
                      href={exp.fileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Acessar PDF
                    </a>
                  ) : (
                    <span className="text-sm text-red-600">Falhou: {exp.error}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
