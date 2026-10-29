'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Nodo } from '@/components/nodo/nodo';

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <Nodo size={132} mood="error" title="Nodo com a tela em curto-circuito" />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">Curto-circuito</p>
        <h2 className="mt-2 text-2xl font-black text-white">Algo queimou um fusível aqui.</h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-400">
          O Nodo já está com o multímetro na mão. Tente religar a tela ou volte para os projetos.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
        >
          Religar
        </button>
        <Link
          href="/projects"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/20"
        >
          Ir para Projetos
        </Link>
      </div>
    </div>
  );
}
