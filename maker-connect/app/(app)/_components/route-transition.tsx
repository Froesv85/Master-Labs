'use client';

import { usePathname } from 'next/navigation';
import { ViewTransition, type ReactNode } from 'react';

/**
 * Anima a troca de tela com a View Transitions API. O layout persiste entre
 * navegações, então a `key` por pathname é o que faz a página antiga sair e a
 * nova entrar. A direção (avançar, voltar, trocar de aba) vem de
 * `<html data-nav-dir>`, marcado pelo `NodoNavProgress`.
 */
export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
