'use client';

import { useRef, useState } from 'react';

type Comment = {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: { id: number; name: string | null };
};

export default function CommentsPanel({
  projectId,
  initialComments,
}: {
  projectId: number;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [imageContentType, setImageContentType] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError('Imagem maior que 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const [header, b64] = result.split(',');
      const ct = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
      setImageB64(b64);
      setImageContentType(ct);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setImageB64(null);
    setImageContentType(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError('Escreva algo antes de comentar'); return; }
    setPosting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { content };
      if (imageB64 && imageContentType) {
        body.imageB64 = imageB64;
        body.imageContentType = imageContentType;
      }
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao comentar'); }
      const payload = await res.json() as { data: Comment };
      setComments((prev) => [payload.data, ...prev]);
      setContent('');
      clearImage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
        Comentários <span className="opacity-60">({comments.length})</span>
      </h3>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Deixe um comentário sobre este projeto..."
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
        />

        {imagePreview && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="h-24 w-24 rounded-lg object-cover border border-white/10" />
            <button type="button" onClick={clearImage}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-xs text-white hover:bg-black">
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            {imagePreview ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {posting ? 'Enviando…' : 'Comentar'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageChange} />

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
        )}
      </form>

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const initials = comment.author.name
              ? comment.author.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
              : '?';
            return (
              <div key={comment.id} className="flex gap-3 border-t border-white/5 pt-4 first:border-t-0 first:pt-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[11px] font-black text-black">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-zinc-100">{comment.author.name ?? 'Maker'}</span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-300">{comment.content}</p>
                  {comment.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comment.imageUrl} alt="" className="mt-2 max-h-64 rounded-lg border border-white/10 object-cover" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
