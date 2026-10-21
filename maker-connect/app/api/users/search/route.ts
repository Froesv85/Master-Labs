import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  // Busca parcial so por nome; e-mail so por igualdade. Antes, buscar "@gmail" listava
  // os e-mails de outros usuarios. O e-mail so volta para quem ja digitou o endereco exato.
  const qLower = q.toLowerCase();
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { email: qLower },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    data: users.map((u) => ({ id: u.id, name: u.name, email: u.email.toLowerCase() === qLower ? u.email : null })),
  });
}
