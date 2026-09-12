'use client';

import { useEffect, useState } from 'react';

type CodeFile = {
  id: number;
  filename: string;
  content: string;
};

export default function CodeFilesPanel({ projectId }: { projectId: number }) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/code-files`, { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        setFiles(payload.data);
      }
    } catch {
      setError('Não foi possível carregar os arquivos de código.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleAddFile() {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/code-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: `arquivo${files.length + 1}.ino`, content: '' }),
      });
      if (!res.ok) throw new Error('Falha ao criar arquivo.');
      const payload = await res.json();
      setFiles([...files, payload.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao criar arquivo.');
    }
  }

  async function handleSaveFile(file: CodeFile) {
    setSavingId(file.id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/code-files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.filename, content: file.content }),
      });
      if (!res.ok) throw new Error('Falha ao salvar arquivo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao salvar arquivo.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteFile(fileId: number) {
    if (!window.confirm('Excluir este arquivo?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/code-files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir arquivo.');
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao excluir arquivo.');
    }
  }

  function updateLocalFile(fileId: number, patch: Partial<CodeFile>) {
    setFiles(files.map((f) => (f.id === fileId ? { ...f, ...patch } : f)));
  }

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Carregando código do projeto...</p>;
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold">Código do Projeto</h3>
      <p className="mb-4 text-sm text-zinc-600">
        Cole aqui o código que roda no seu projeto (ex.: sketch da IDE Arduino). Pode adicionar quantos arquivos precisar.
      </p>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={file.filename}
                onChange={(e) => updateLocalFile(file.id, { filename: e.target.value })}
                className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm font-mono outline-none ring-zinc-200 focus:ring-2"
              />
              <button
                type="button"
                disabled={savingId === file.id}
                onClick={() => handleSaveFile(file)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white disabled:opacity-60 hover:bg-zinc-800"
              >
                {savingId === file.id ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFile(file.id)}
                className="rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
            <textarea
              value={file.content}
              onChange={(e) => updateLocalFile(file.id, { content: e.target.value })}
              placeholder="// cole seu codigo aqui"
              spellCheck={false}
              className="min-h-48 w-full rounded-md border border-zinc-200 bg-zinc-950 px-3 py-2 font-mono text-xs text-emerald-300 outline-none ring-zinc-200 focus:ring-2"
            />
          </div>
        ))}
      </div>

      {files.length === 0 && <p className="text-sm text-zinc-500">Nenhum arquivo de código ainda.</p>}

      <button
        type="button"
        onClick={handleAddFile}
        className="mt-4 text-sm font-medium text-zinc-700 hover:underline"
      >
        + novo arquivo
      </button>
    </section>
  );
}
