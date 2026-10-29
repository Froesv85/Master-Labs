'use client';

import { usePathname } from 'next/navigation';
import { NodoLoader, messagesForPath } from '@/components/nodo/nodo-loader';

// fallback de rota enquanto o servidor monta a próxima tela
export default function AppLoading() {
  const pathname = usePathname();
  return <NodoLoader size="lg" messages={messagesForPath(pathname)} className="min-h-[60vh]" />;
}
