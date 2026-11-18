import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  // Só um booleano derivado, para a UI mostrar ações de moderação; o `role` em si não sai.
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  return NextResponse.json({ ...session, isAdmin: user?.role === 'admin' });
}
