import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3-service';

const ALLOWED: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

async function resolveRobotAsOwner(id: string, userId: number) {
  const robotId = Number(id);
  if (!Number.isInteger(robotId) || robotId <= 0) return null;
  const robot = await prisma.robot.findUnique({ where: { id: robotId }, select: { ownerId: true } });
  if (!robot || robot.ownerId !== userId) return null;
  return robotId;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const robotId = Number(id);
  if (!Number.isInteger(robotId) || robotId <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  const images = await prisma.robotImage.findMany({
    where: { robotId },
    orderBy: { position: 'asc' },
    select: { id: true, imageUrl: true, position: true, createdAt: true },
  });
  return NextResponse.json({ data: images });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const robotId = await resolveRobotAsOwner(id, session.userId);
  if (!robotId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: { images: { imageB64: string; contentType: string }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  if (!Array.isArray(body.images) || body.images.length === 0) {
    return NextResponse.json({ error: 'images deve ser um array não vazio' }, { status: 400 });
  }

  const currentCount = await prisma.robotImage.count({ where: { robotId } });
  if (currentCount + body.images.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Limite de ${MAX_IMAGES} imagens por robô atingido. Atual: ${currentCount}` }, { status: 400 });
  }

  try {
    const uploaded: { imageUrl: string; position: number }[] = [];
    let position = currentCount;

    for (const img of body.images) {
      const ext = ALLOWED[img.contentType];
      if (!ext) throw new Error(`Tipo não suportado: ${img.contentType}`);
      const buf = Buffer.from(img.imageB64, 'base64');
      if (buf.byteLength === 0) throw new Error('Imagem vazia.');
      if (buf.byteLength > MAX_BYTES) throw new Error(`Imagem muito grande. Máximo 5 MB.`);
      const key = `robots/${robotId}/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const url = await uploadFile(buf, key, img.contentType);
      uploaded.push({ imageUrl: url, position: position++ });
    }

    await prisma.robotImage.createMany({ data: uploaded.map((u) => ({ robotId, ...u })) });
    const images = await prisma.robotImage.findMany({ where: { robotId }, orderBy: { position: 'asc' }, select: { id: true, imageUrl: true, position: true, createdAt: true } });
    return NextResponse.json({ data: images }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao fazer upload';
    const status = msg.includes('suportado') || msg.includes('grande') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
