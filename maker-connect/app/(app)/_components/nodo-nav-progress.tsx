'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Nodo } from '@/components/nodo/nodo';

// ordem das seções no menu: define se a troca de aba desliza para a esquerda ou direita
const SECTION_ORDER = ['feed', 'projects', 'robots', 'teams', 'communities', 'profile', 'admin'];

export type NavDirection = 'forward' | 'back' | 'swap';

export function navDirection(from: string, to: string): NavDirection {
  const a = from.split('/').filter(Boolean);
  const b = to.split('/').filter(Boolean);
  if (a[0] === b[0] || a.length !== b.length) {
    if (b.length === a.length) return 'swap';
    return b.length > a.length ? 'forward' : 'back';
  }
  const ia = SECTION_ORDER.indexOf(a[0]);
  const ib = SECTION_ORDER.indexOf(b[0]);
  if (ia < 0 || ib < 0) return 'swap';
  return ib > ia ? 'forward' : 'back';
}

function setDirection(dir: NavDirection | null) {
  if (dir) document.documentElement.dataset.navDir = dir;
  else delete document.documentElement.dataset.navDir;
}

type Phase = 'idle' | 'loading' | 'done';

/**
 * Barra de progresso da navegação: o Nodo desce pendurado na trilha do circuito
 * na borda do header. Também marca `<html data-nav-dir>` para as view transitions
 * de rota (ver `RouteTransition` e globals.css).
 */
export default function NodoNavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const pathRef = useRef(pathname);
  const timers = useRef<{ trickle?: ReturnType<typeof setInterval>; safety?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    function start(dir: NavDirection) {
      setDirection(dir);
      clearInterval(timers.current.trickle);
      clearTimeout(timers.current.safety);
      setPhase('loading');
      setProgress(12);
      // avança rápido no começo e desacelera perto do fim, sem nunca chegar sozinho a 100%
      timers.current.trickle = setInterval(() => setProgress((p) => p + (88 - p) * 0.1), 180);
      timers.current.safety = setTimeout(() => setPhase('done'), 10000);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
      if (url.pathname === location.pathname) return; // só query/hash: sem troca de tela
      start(navDirection(location.pathname, url.pathname));
    }

    // voltar/avançar do navegador: tratamos como "voltando"
    function onPopState() {
      if (location.pathname !== pathRef.current) start('back');
    }

    // captura: o <Link> chama preventDefault antes de o evento borbulhar até o document
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    const t = timers.current;
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      clearInterval(t.trickle);
      clearTimeout(t.safety);
    };
  }, []);

  // a rota mudou: completa a trilha, o Nodo comemora e sai de cena
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    setPhase((p) => (p === 'loading' ? 'done' : p));
  }, [pathname]);

  useEffect(() => {
    if (phase !== 'done') return;
    clearInterval(timers.current.trickle);
    clearTimeout(timers.current.safety);
    const hide = setTimeout(() => {
      setPhase('idle');
      setProgress(0);
      setDirection(null);
    }, 650);
    return () => clearTimeout(hide);
  }, [phase]);

  if (phase === 'idle') return null;
  const width = phase === 'done' ? 100 : progress;

  return (
    <div aria-hidden className={`nodo-zip pointer-events-none absolute inset-x-0 bottom-0 z-[60] ${phase === 'done' ? 'nodo-zip-done' : ''}`}>
      <div className="nodo-zip-line absolute bottom-0 left-0 h-[2px]" style={{ width: `${width}%` }} />
      <div className="nodo-zip-rider absolute top-0" style={{ left: `${width}%` }}>
        <Nodo size={34}mood={phase === 'done' ? 'celebrate' : 'happy'} pose="up" />
      </div>
    </div>
  );
}
