import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppNav from './_components/app-nav';
import FeedbackWidget from './_components/feedback-widget';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, profile: { select: { avatarUrl: true } } },
  });

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-zinc-50">
      <AppNav
        userId={session.userId}
        userName={session.name}
        avatarUrl={user?.profile?.avatarUrl ?? null}
        isAdmin={user?.role === 'admin'}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <FeedbackWidget />
    </div>
  );
}
