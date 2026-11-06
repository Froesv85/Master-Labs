'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Modo convidado: quem chega sem conta navega por projetos, equipes e comunidades
// em modo leitura. Acoes que gravam algo (criar, votar, comentar, entrar) passam
// por requireAccount(), que leva para o cadastro e volta para a mesma pagina.

const GuestContext = createContext(false);

export function GuestProvider({ isGuest, children }: { isGuest: boolean; children: ReactNode }) {
  return <GuestContext.Provider value={isGuest}>{children}</GuestContext.Provider>;
}

export function useAuthGate() {
  const isGuest = useContext(GuestContext);
  const router = useRouter();
  const pathname = usePathname();

  // true = pode seguir com a acao; false = convidado foi levado ao cadastro
  const requireAccount = useCallback((): boolean => {
    if (!isGuest) return true;
    router.push(`/signup?next=${encodeURIComponent(pathname)}`);
    return false;
  }, [isGuest, pathname, router]);

  return { isGuest, requireAccount };
}
