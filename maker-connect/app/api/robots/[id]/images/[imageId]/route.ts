import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id, imageId } = await params;
  const robotId = Number(id);
  const imgId = Number(imageId);
  if (!Number.isInteger(robotId) || !Number.isInteger(imgId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const robot = await prisma.robot.findUnique({ where: { id: robotId }, select: { ownerId: true } });
  if (!robot || robot.ownerId !== session.userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const image = await prisma.robotImage.findUnique({ where: { id: imgId } });
  if (!image || image.robotId !== robotId) return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });

  await prisma.robotImage.delete({ where: { id: imgId } });

  // reorder remaining positions
  const remaining = await prisma.robotImage.findMany({ where: { robotId }, orderBy: { position: 'asc' }, select: { id: true } });
  await Promise.all(remaining.map((r, i) => prisma.robotImage.update({ where: { id: r.id }, data: { position: i } })));

  return new NextResponse(null, { status: 204 });
}
