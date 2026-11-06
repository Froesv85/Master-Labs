import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GuestProvider } from '@/components/guest-gate';
import AppNav from './_components/app-nav';
import FeedbackWidget from './_components/feedback-widget';
import NodoWelcome from './_components/nodo-welcome';
import RouteTransition from './_components/route-transition';

// Sem sessao, o visitante entra como convidado. O proxy.ts so deixa chegar aqui
// sem sessao as paginas de leitura (projetos, equipes, comunidades).
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, profile: { select: { avatarUrl: true } } },
      })
    : null;

  return (
    <GuestProvider isGuest={!session}>
      <div className="min-h-screen bg-[#0a0f1e] text-zinc-50">
        <AppNav
          userId={session?.userId ?? null}
          userName={session?.name ?? null}
          avatarUrl={user?.profile?.avatarUrl ?? null}
          isAdmin={user?.role === 'admin'}
        />
        <main className="mx-auto max-w-7xl px-4 py-6">
          <RouteTransition>{children}</RouteTransition>
        </main>
        {session && <FeedbackWidget />}
        {session && <NodoWelcome userName={session.name} />}
      </div>
    </GuestProvider>
  );
}
