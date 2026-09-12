'use client';

import { useEffect, useRef, useState } from 'react';

type ProjectImage = { id: number; imageUrl: string; position: number };

const MAX_BYTES = 5 * 1024 * 1024;

export default function ImagesPanel({ projectId }: { projectId: number }) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/images`, { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        setImages(payload.data);
      }
    } catch {
      setError('Não foi possível carregar as imagens.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function readAsBase64(file: File): Promise<{ imageB64: string; contentType: string }> {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_BYTES) {
        reject(new Error(`${file.name} excede 5 MB.`));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        resolve({ imageB64: result.split(',')[1], contentType: file.type });
      };
      reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const { imageB64, contentType } = await readAsBase64(file);
        const res = await fetch(`/api/projects/${projectId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageB64, contentType }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? `Falha ao enviar ${file.name}.`);
        }
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: number) {
    if (!window.confirm('Remover esta imagem?')) return;
    setDeletingId(imageId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover imagem.');
      setImages(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao remover imagem.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Carregando imagens...</p>;
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold">Imagens do Projeto</h3>
      <p className="mb-4 text-sm text-zinc-600">Fotos, esquemas e capturas do seu projeto (até 5 MB cada).</p>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200">
              <img src={image.imageUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={deletingId === image.id}
                onClick={() => handleDelete(image.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-60"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && <p className="mb-4 text-sm text-zinc-500">Nenhuma imagem ainda.</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={handleFilesSelected}
        className="block w-full text-xs text-zinc-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-xs file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
      />
      {uploading && <p className="mt-2 text-xs text-zinc-500">Enviando...</p>}
    </section>
  );
}
