'use client';

import { useCallback, useState } from 'react';
import { usePolling } from '../../_components/use-polling';
import FeedbackConversation, {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDateTime,
  type FeedbackCategory,
  type FeedbackStatus,
} from '../../_components/feedback-conversation';
import { NodoLoader } from '@/components/nodo/nodo-loader';

type AdminThread = {
  id: number;
  category: FeedbackCategory;
  subject: string;
  status: FeedbackStatus;
  pagePath: string | null;
  adminUnread: boolean;
  lastMessageAt: string;
  user: { id: number; name: string | null; email: string };
  _count: { messages: number };
};

type Meta = { page: number; pageSize: number; total: number; unread: number };

const LIST_POLL_MS = 30000;

// Caixa de entrada da administracao: todas as conversas de comentarios e sugestoes de
// todos os usuarios. O acesso e garantido pelo layout de /admin (role admin).
export default function AdminFeedbackPage() {
  const [threads, setThreads] = useState<AdminThread[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [status, setStatus] = useState<FeedbackStatus | ''>('');
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (unreadOnly) params.set('unread', '1');
    const res = await fetch(`/api/admin/feedback?${params}`, { cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? 'Não foi possível carregar as conversas.');
      return;
    }
    setError(null);
    setThreads(body.data);
    setMeta(body.meta);
  }, [page, status, category, unreadOnly]);

  usePolling(load, LIST_POLL_MS);

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;
  const selectClass =
    'rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 focus:border-amber-400/60 focus:outline-none';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-white">Comentários e sugestões</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Todas as conversas enviadas pelos usuários pelo botão &quot;Sugestões&quot;.
          {meta && (
            <>
              {' '}
              {meta.total} {meta.total === 1 ? 'conversa' : 'conversas'} no filtro atual ·{' '}
              <span className="font-semibold text-amber-400">{meta.unread} não lidas</span>
            </>
          )}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FeedbackStatus | '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as FeedbackCategory | '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Todos os tipos</option>
          {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
            className="accent-amber-500"
          />
          Só não lidas
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {threads === null && <NodoLoader layout="inline" label="Abrindo a caixa de feedbacks…" className="p-4 text-zinc-400" />}
          {threads?.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhuma conversa neste filtro.</p>}
          {threads?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelected(t.id);
                // abrir a conversa marca como lida no servidor; reflete na lista sem esperar o polling
                setThreads((prev) => prev?.map((x) => (x.id === t.id ? { ...x, adminUnread: false } : x)) ?? null);
              }}
              className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                selected === t.id ? 'bg-amber-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${t.adminUnread ? 'font-bold text-white' : 'text-zinc-300'}`}>{t.subject}</span>
                {t.adminUnread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-label="Não lida" />}
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {t.user.name ?? 'Maker'} · {t.user.email}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLES[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                <span>{CATEGORY_LABELS[t.category]}</span>
                <span>
                  {t._count.messages} {t._count.messages === 1 ? 'mensagem' : 'mensagens'}
                </span>
                <span>{formatDateTime(t.lastMessageAt)}</span>
              </div>
            </button>
          ))}
          {meta && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-400">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">
                ← Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-30"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>

        <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:h-[70vh]">
          {selected ? (
            <FeedbackConversation key={selected} threadId={selected} adminView onChanged={load} />
          ) : (
            <p className="m-auto p-6 text-sm text-zinc-500">Selecione uma conversa para ler e responder.</p>
          )}
        </div>
      </div>
    </div>
  );
}
