import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadProjectImage } from '@/lib/project-media';

type Params = { params: Promise<{ id: string }> };

const categoryMap: Record<string, 'Robotics' | 'Printing3D' | 'IoT' | 'Woodworking'> = {
  Robotics: 'Robotics',
  '3D_Printing': 'Printing3D',
  Printing3D: 'Printing3D',
  IoT: 'IoT',
  Woodworking: 'Woodworking',
};

async function requireOwnedProject(projectId: number, userId: number | undefined) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return { error: NextResponse.json({ error: 'ID inválido' }, { status: 400 }) };
  }
  if (!userId) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { creatorId: true } });
  if (!project) {
    return { error: NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 }) };
  }
  if (project.creatorId !== userId) {
    return { error: NextResponse.json({ error: 'Sem permissão' }, { status: 403 }) };
  }
  return { error: null };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      creatorId: true,
      coverImageUrl: true,
      printerBrand: true,
      printerModel: true,
      printerNozzle: true,
      printerMaterial: true,
      printerLayerHeight: true,
      createdAt: true,
      updatedAt: true,
      creator: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, title: true } },
      images: { orderBy: { position: 'asc' }, select: { id: true, imageUrl: true, position: true } },
      files: { orderBy: { createdAt: 'asc' }, select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSizeKb: true } },
      _count: { select: { votes: true, shares: true, children: true } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const { _count, ...rest } = project;
  return NextResponse.json({
    ...rest,
    votes: _count.votes,
    shares: _count.shares,
    forkCount: _count.children,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;
  const projectId = Number(id);

  const guard = await requireOwnedProject(projectId, session?.userId);
  if (guard.error) return guard.error;

  const body = await req.json() as {
    title?: string;
    description?: string;
    category?: string;
    coverImageB64?: string;
    coverImageContentType?: string;
    printerBrand?: string;
    printerModel?: string;
    printerNozzle?: string;
    printerMaterial?: string;
    printerLayerHeight?: string;
  };

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.description !== undefined) data.description = body.description.trim() || null;
  if (body.category !== undefined) {
    const cat = categoryMap[body.category];
    if (!cat) return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });
    data.category = cat;
  }
  if (body.printerBrand !== undefined) data.printerBrand = body.printerBrand.trim() || null;
  if (body.printerModel !== undefined) data.printerModel = body.printerModel.trim() || null;
  if (body.printerNozzle !== undefined) data.printerNozzle = body.printerNozzle.trim() || null;
  if (body.printerMaterial !== undefined) data.printerMaterial = body.printerMaterial.trim() || null;
  if (body.printerLayerHeight !== undefined) data.printerLayerHeight = body.printerLayerHeight.trim() || null;

  if (body.coverImageB64 && body.coverImageContentType) {
    try {
      const result = await uploadProjectImage(body.coverImageB64, body.coverImageContentType, projectId);
      data.coverImageUrl = result.url;
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro no upload da imagem' }, { status: 400 });
    }
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
    select: { id: true, title: true, description: true, category: true, coverImageUrl: true },
  });

  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;
  const projectId = Number(id);

  const guard = await requireOwnedProject(projectId, session?.userId);
  if (guard.error) return guard.error;

  await prisma.$transaction([
    // Forks keep existing as standalone projects instead of being deleted too.
    prisma.project.updateMany({ where: { parentId: projectId }, data: { parentId: null } }),
    // Governance audit trail is kept, just detached from the removed project.
    prisma.lgpdAuditLog.updateMany({ where: { projectId }, data: { projectId: null } }),
    prisma.projectVote.deleteMany({ where: { projectId } }),
    prisma.projectShare.deleteMany({ where: { projectId } }),
    prisma.projectDifficulty.deleteMany({ where: { projectId } }),
    prisma.projectExport.deleteMany({ where: { projectId } }),
    prisma.projectExtractionLog.deleteMany({ where: { projectId } }),
    prisma.projectImage.deleteMany({ where: { projectId } }),
    prisma.projectFile.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ]);

  return NextResponse.json({ ok: true });
}
