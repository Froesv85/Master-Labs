'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Uma visita = uma sessao de aba (sessionStorage). Quem entra ou sai da conta
// chama resetVisitFlag(), e a proxima pagina conta de novo, ja no estado certo
// (o servidor decide se e logada ou convidada pela sessao).
const FLAG = 'mc_visit_counted';

export function resetVisitFlag() {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    // storage bloqueado (aba anonima restrita): so deixa de contar
  }
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, '1');
    } catch {
      return;
    }
    fetch('/api/visits', { method: 'POST', keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
