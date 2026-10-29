'use client';

import { useEffect, useRef, useState } from 'react';
import { Nodo } from './nodo';

const LINES = [
  'Oi! Eu sou o Nodo.',
  'Cada projeto documentado acende mais um ponto na rede.',
  'Eu monto a BOM e o dossiê técnico pra você.',
  'Me clica!',
];

/**
 * Nodo da página inicial: acena, fala num balão, segue o cursor com os olhos
 * e comemora quando é clicado.
 */
export function NodoHero() {
  const ref = useRef<HTMLButtonElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [line, setLine] = useState(0);
  const [party, setParty] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    function onMove(e: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height * 0.4);
        // satura a ~400px do Nodo: perto dele o olhar já está no limite
        const clamp = (v: number) => Math.max(-1, Math.min(1, v / 400));
        setLook({ x: clamp(dx), y: clamp(dy) });
      });
    }
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLine((i) => (i + 1) % LINES.length), 3600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!party) return;
    const id = setTimeout(() => setParty(false), 1600);
    return () => clearTimeout(id);
  }, [party]);

  const text = party ? 'Uhul! Mais um nó na rede!' : LINES[line];

  return (
    <div className="relative mb-8 flex flex-col items-center">
      <div className="nodo-hero-halo pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden />
      <div className="relative mb-3 max-w-[18rem] rounded-2xl border border-amber-500/30 bg-[#0d1424]/90 px-4 py-2 text-sm font-medium text-zinc-200 shadow-[0_0_24px_rgba(245,158,11,0.12)] backdrop-blur-md">
        <span key={text} className="nodo-msg block" aria-live="polite">{text}</span>
        <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-amber-500/30 bg-[#0d1424]" aria-hidden />
      </div>
      <button
        ref={ref}
        type="button"
        onClick={() => setParty(true)}
        className="relative cursor-pointer rounded-3xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label="Nodo, o mascote da MakerConnect. Clique para ele comemorar"
      >
        <Nodo size={150} mood={party ? 'celebrate' : 'happy'} look={party ? undefined : look} className="h-auto w-[120px] sm:w-[150px]" />
      </button>
    </div>
  );
}
