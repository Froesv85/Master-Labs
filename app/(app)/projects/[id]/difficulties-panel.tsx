'use client';

import { FormEvent, useState } from 'react';

import { useRouter } from 'next/navigation';

type DifficultyItem = {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export default function DifficultiesPanel({
  projectId,
  initialDifficulties,
}: {
  projectId: number;
  initialDifficulties: DifficultyItem[];
}) {
  const router = useRouter();
  const [difficulties, setDifficulties] = useState(initialDifficulties);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshDifficulties() {
    const res = await fetch(`/api/projects/${projectId}/difficulties`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Nao foi possivel atualizar o log de dificuldades.');
    }

    const payload = (await res.json()) as { data: DifficultyItem[] };
    setDifficulties(payload.data);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/difficulties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Falha ao salvar dificuldade.');
      }

      setDescription('');
      await refreshDifficulties();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao salvar dificuldade.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold">Log de dificuldades</h3>
      <p className="mb-4 text-sm text-zinc-600">
        Registre bloqueios, descobertas e tradeoffs para manter a rastreabilidade do projeto.
      </p>

      <form onSubmit={handleSubmit} className="mb-5 flex flex-col gap-3">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descreva a dificuldade encontrada"
          className="min-h-28 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-zinc-200 placeholder:text-zinc-400 focus:ring-2"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Adicionar dificuldade'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {difficulties.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma dificuldade registrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {difficulties.map((difficulty) => (
            <article key={difficulty.id} className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-700">{difficulty.description}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {new Date(difficulty.createdAt).toLocaleString('pt-BR')}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
