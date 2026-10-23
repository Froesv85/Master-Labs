'use client';

import { useEffect, useRef } from 'react';

// Chama `callback` ao montar (e sempre que ele mudar, ex.: filtro novo) e depois a cada
// `intervalMs`, pulando os ticks com a aba em segundo plano. O callback fica num ref
// para o intervalo sempre usar a versao mais recente sem reiniciar a cada render.
export function usePolling(callback: () => Promise<void> | void, intervalMs: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    void savedCallback.current();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void savedCallback.current();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [callback, intervalMs]);
}
