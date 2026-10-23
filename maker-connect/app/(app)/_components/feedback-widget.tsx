'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePolling } from './use-polling';
import FeedbackConversation, {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDateTime,
  type FeedbackCategory,
  type FeedbackStatus,
} from './feedback-conversation';

type ThreadSummary = {
  id: number;
  category: FeedbackCategory;
  subject: string;
  status: FeedbackStatus;
  userUnread: boolean;
  lastMessageAt: string;
};

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'thread'; id: number };

const LIST_POLL_MS = 60000;

// Botao flutuante "Sugestões" em todas as paginas logadas: o usuario abre uma conversa
// com a equipe (sugestao, problema, comentario ou duvida) e acompanha as respostas.
export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    const res = await fetch('/api/feedback', { cache: 'no-store' });
    if (!res.ok) return;
    const body = await res.json();
    setThreads(body.data);
  }, []);

  usePolling(loadThreads, LIST_POLL_MS);

  const unread = threads?.filter((t) => t.userUnread).length ?? 0;

  async function createThread() {
    if (!content.trim() || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, subject, content, pagePath: pathname }),
    });
    const body = await res.json().catch(() => null);
    setSending(false);
    if (!res.ok) {
      setError(body?.error ?? 'Não foi possível enviar.');
      return;
    }
    setSubject('');
    setContent('');
    setCategory('suggestion');
    await loadThreads();
    setView({ kind: 'thread', id: body.data.id });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-amber-400/40 bg-[#111827] px-4 py-3 text-sm font-semibold text-amber-300 shadow-lg shadow-black/40 transition hover:bg-[#1a2234]"
        aria-expanded={open}
        aria-label="Comentários e sugestões"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.83L3 20l1.4-3.72A7.6 7.6 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="hidden sm:inline">Sugestões</span>
        {unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-20 z-50 flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1424] shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-5 sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              {view.kind !== 'list' && (
                <button
                  type="button"
                  onClick={() => {
                    setView({ kind: 'list' });
                    void loadThreads();
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  ← Voltar
                </button>
              )}
              <p className="text-sm font-bold text-white">Comentários e sugestões</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300" aria-label="Fechar">
              ✕
            </button>
          </div>

          {view.kind === 'list' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="p-4">
                <p className="text-xs text-zinc-400">
                  Encontrou um problema ou tem uma ideia para melhorar a MakerConnect? Escreva para a equipe: a resposta
                  aparece aqui.
                </p>
                <button
                  type="button"
                  onClick={() => setView({ kind: 'new' })}
                  className="mt-3 w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
                >
                  Nova mensagem
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10">
                {threads === null && <p className="p-4 text-xs text-zinc-500">Carregando...</p>}
                {threads?.length === 0 && <p className="p-4 text-xs text-zinc-500">Você ainda não enviou nenhuma mensagem.</p>}
                {threads?.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setView({ kind: 'thread', id: t.id });
                      setThreads((prev) => prev?.map((x) => (x.id === t.id ? { ...x, userUnread: false } : x)) ?? null);
                    }}
                    className="block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${t.userUnread ? 'font-bold text-white' : 'text-zinc-300'}`}>
                        {t.subject}
                      </span>
                      {t.userUnread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-label="Nova resposta" />}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLES[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                      <span>{formatDateTime(t.lastMessageAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view.kind === 'new' && (
            <form
              className="space-y-3 overflow-y-auto p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void createThread();
              }}
            >
              <label className="block text-xs text-zinc-400">
                Tipo
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none"
                >
                  {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-zinc-400">
                Assunto (opcional)
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={160}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Mensagem
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  maxLength={4000}
                  required
                  placeholder="Conte o que aconteceu ou o que poderia ser melhor..."
                  className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
                />
              </label>
              <p className="text-[11px] text-zinc-500">
                A página em que você está ({pathname}) vai junto, para ajudar a equipe a entender o contexto.
              </p>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-40"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          )}

          {view.kind === 'thread' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <FeedbackConversation threadId={view.id} onChanged={loadThreads} compact />
            </div>
          )}
        </div>
      )}
    </>
  );
}
