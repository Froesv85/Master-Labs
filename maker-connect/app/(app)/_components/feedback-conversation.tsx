'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePolling } from './use-polling';

export type FeedbackCategory = 'suggestion' | 'bug' | 'comment' | 'question';
export type FeedbackStatus = 'open' | 'answered' | 'closed';

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  suggestion: 'Sugestão de melhoria',
  bug: 'Problema / erro',
  comment: 'Comentário',
  question: 'Dúvida',
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Aguardando resposta',
  answered: 'Respondida',
  closed: 'Encerrada',
};

export const STATUS_STYLES: Record<FeedbackStatus, string> = {
  open: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  answered: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  closed: 'border-zinc-600 bg-zinc-800 text-zinc-400',
};

export type FeedbackMessage = {
  id: number;
  content: string;
  fromAdmin: boolean;
  createdAt: string;
  author: { id: number; name: string | null };
};

type ThreadDetail = {
  id: number;
  category: FeedbackCategory;
  subject: string;
  status: FeedbackStatus;
  pagePath: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email?: string };
  messages: FeedbackMessage[];
};

const POLL_MS = 15000;

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

type Props = {
  threadId: number;
  // true no painel /admin/feedback: mostra quem enviou e permite mudar o status
  adminView?: boolean;
  onChanged?: () => void;
  compact?: boolean;
};

export default function FeedbackConversation({ threadId, adminView = false, onChanged, compact = false }: Props) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = thread?.messages.length ?? 0;

  const load = useCallback(async () => {
    const res = await fetch(`/api/feedback/${threadId}`, { cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? 'Não foi possível carregar a conversa.');
      return;
    }
    setError(null);
    setThread(body.data);
  }, [threadId]);

  // trocar de conversa remonta o componente (key/view), entao nao precisa limpar o estado aqui
  usePolling(load, POLL_MS);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messageCount]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const res = await fetch(`/api/feedback/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const body = await res.json().catch(() => null);
    setSending(false);
    if (!res.ok) {
      setError(body?.error ?? 'Não foi possível enviar a mensagem.');
      return;
    }
    setDraft('');
    await load();
    onChanged?.();
  }

  async function changeStatus(status: FeedbackStatus) {
    const res = await fetch(`/api/feedback/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await load();
      onChanged?.();
    }
  }

  if (!thread) {
    return <p className="p-4 text-sm text-zinc-500">{error ?? 'Carregando conversa...'}</p>;
  }

  // Do ponto de vista de quem esta vendo: no painel admin, "minhas" mensagens sao as da
  // administracao; no widget, sao as do proprio usuario.
  const isMine = (m: FeedbackMessage) => (adminView ? m.fromAdmin : !m.fromAdmin);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-100">{thread.subject}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
          <span>{CATEGORY_LABELS[thread.category]}</span>
          <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLES[thread.status]}`}>
            {STATUS_LABELS[thread.status]}
          </span>
          {adminView && (
            <span>
              {thread.user.name ?? 'Maker'}
              {thread.user.email ? ` · ${thread.user.email}` : ''}
            </span>
          )}
          {adminView && thread.pagePath && <span>enviado em {thread.pagePath}</span>}
        </div>
        {adminView && (
          <div className="mt-2 flex gap-2">
            {(['open', 'answered', 'closed'] as FeedbackStatus[])
              .filter((s) => s !== thread.status)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeStatus(s)}
                  className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-amber-400/50 hover:text-amber-300"
                >
                  Marcar como {STATUS_LABELS[s].toLowerCase()}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className={`flex-1 space-y-3 overflow-y-auto px-4 py-3 ${compact ? 'max-h-80' : ''}`}>
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                isMine(m) ? 'bg-amber-500/20 text-amber-50' : 'bg-white/5 text-zinc-200'
              }`}
            >
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {m.fromAdmin ? 'Equipe MakerConnect' : (m.author.name ?? 'Maker')} · {formatDateTime(m.createdAt)}
              </p>
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs text-red-400">{error}</p>}

      <form
        className="flex gap-2 border-t border-white/10 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder={thread.status === 'closed' ? 'Escreva para reabrir a conversa...' : 'Escreva uma mensagem...'}
          className="min-h-0 flex-1 resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="self-end rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-40"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
