import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadProjectImage } from '@/lib/project-media';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = 12;

  const where = category ? { category: category as never } : {};
  const [robots, total] = await Promise.all([
    prisma.robot.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        awards: { orderBy: { year: 'desc' }, take: 3 },
        images: { orderBy: { position: 'asc' }, take: 1 },
        _count: { select: { matches: true } },
      },
      orderBy: { eloScore: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.robot.count({ where }),
  ]);

  return NextResponse.json({ robots, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json() as {
      name: string;
      description?: string;
      category: string;
      teamId?: number;
      weightKg?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      coverImageB64?: string;
      coverImageContentType?: string;
      components?: { name: string; quantity?: number; description?: string }[];
      awards?: { title: string; year: number; placement?: number }[];
      competitions?: { eventName: string; location?: string; date?: string; placement?: number }[];
    };

    const { name, description, category } = body;
    const ownerId = session?.userId ?? 1;

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    if (!category) return NextResponse.json({ error: 'Categoria obrigatória' }, { status: 400 });

    const robot = await prisma.robot.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category as never,
        ownerId,
        teamId: body.teamId ?? null,
        weightKg: body.weightKg ?? null,
        lengthCm: body.lengthCm ?? null,
        widthCm: body.widthCm ?? null,
        heightCm: body.heightCm ?? null,
      },
    });

    // Cover image upload
    if (body.coverImageB64 && body.coverImageContentType) {
      try {
        const result = await uploadProjectImage(body.coverImageB64, body.coverImageContentType, robot.id);
        await prisma.robotImage.create({
          data: { robotId: robot.id, imageUrl: result.url, position: 0 },
        });
      } catch { /* non-fatal */ }
    }

    // Components
    if (body.components?.length) {
      await prisma.robotComponent.createMany({
        data: body.components.map((c) => ({
          robotId: robot.id,
          name: c.name.trim(),
          quantity: c.quantity ?? 1,
          description: c.description?.trim() || null,
        })),
      });
    }

    // Awards (inline, no event link)
    if (body.awards?.length) {
      await prisma.robotAward.createMany({
        data: body.awards.map((a) => ({
          robotId: robot.id,
          title: a.title.trim(),
          year: a.year,
          placement: a.placement ?? null,
        })),
      });
    }

    // Competitions — create RobotEvent + Participation inline
    if (body.competitions?.length) {
      for (const comp of body.competitions) {
        const event = await prisma.robotEvent.create({
          data: {
            name: comp.eventName.trim(),
            location: comp.location?.trim() || null,
            eventDate: comp.date ? new Date(comp.date) : new Date(),
          },
        });
        await prisma.robotEventParticipation.create({
          data: { robotId: robot.id, eventId: event.id, placement: comp.placement ?? null },
        });
      }
    }

    const full = await prisma.robot.findUnique({
      where: { id: robot.id },
      include: {
        owner: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        awards: true,
        images: { orderBy: { position: 'asc' }, take: 1 },
        _count: { select: { matches: true } },
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    console.error('POST /api/robots failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
