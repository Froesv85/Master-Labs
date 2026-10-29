'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { Nodo } from '@/components/nodo/nodo';
import { takeNodoWelcome, type NodoWelcomeKind } from '@/components/nodo/welcome-flag';

// useLayoutEffect evita um frame do app sem a saudação numa navegação client-side
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Saudação depois do login: a tela do Nodo "liga" (flicker de CRT), a antena
 * acende e ele acena com o nome do maker. Some sozinha ou com um clique.
 */
export default function NodoWelcome({ userName }: { userName: string | null }) {
  const [kind, setKind] = useState<NodoWelcomeKind | null>(null);
  const [leaving, setLeaving] = useState(false);

  useIsoLayoutEffect(() => {
    const k = takeNodoWelcome();
    if (k && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setKind(k);
  }, []);

  useEffect(() => {
    if (!kind) return;
    const out = setTimeout(() => setLeaving(true), 2100);
    return () => clearTimeout(out);
  }, [kind]);

  useEffect(() => {
    if (!leaving) return;
    const done = setTimeout(() => setKind(null), 450);
    return () => clearTimeout(done);
  }, [leaving]);

  if (!kind) return null;

  const firstName = userName?.split(' ')[0] ?? 'Maker';
  const isNew = kind === 'signup';

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setLeaving(true)}
      className={`nodo-welcome fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-6 bg-[#0a0f1e]/95 backdrop-blur-sm ${leaving ? 'nodo-welcome-out' : ''}`}
    >
      <div className="nodo-welcome-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="nodo-welcome-boot relative">
        <div className="nodo-welcome-ring absolute left-1/2 top-[8%] h-24 w-24 -translate-x-1/2 rounded-full" aria-hidden />
        <Nodo size={160} mood={isNew ? 'celebrate' : 'happy'} />
      </div>
      <div className="nodo-welcome-text relative text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
          {isNew ? 'Novo nó na rede' : 'Conexão estabelecida'}
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          {isNew ? `Boas-vindas, ${firstName}!` : `Oi de novo, ${firstName}!`}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {isNew ? 'Cada projeto documentado acende mais um ponto na rede.' : 'Sua bancada está do jeito que você deixou.'}
        </p>
      </div>
    </div>
  );
}
