import { prisma } from '@/lib/prisma';
import { getSession, type SessionPayload } from '@/lib/auth';

export async function getAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (user?.role !== 'admin') return null;
  return session;
}
