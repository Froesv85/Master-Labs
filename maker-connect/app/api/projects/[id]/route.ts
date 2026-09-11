import { Category } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadProjectImage } from '@/lib/project-media';
import { TAG_ALIASES as tagMap, canAccessProject } from '@/lib/project-access';

type Params = { params: Promise<{ id: string }> };

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
      objective: true,
      visibility: true,
      teamId: true,
      team: { select: { id: true, name: true } },
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
      tags: { select: { tag: true } },
      components: { select: { id: true, name: true, quantity: true, description: true } },
      images: { orderBy: { position: 'asc' }, select: { id: true, imageUrl: true, position: true } },
      files: { orderBy: { createdAt: 'asc' }, select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSizeKb: true } },
      _count: { select: { votes: true, shares: true, children: true } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const session = await getSession();
  const allowed = await canAccessProject(project, session?.userId ?? null);
  if (!allowed) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const { _count, tags, ...rest } = project;
  return NextResponse.json({
    ...rest,
    tags: tags.map((t) => t.tag),
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

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    objective?: string;
    tags?: string[];
    visibility?: 'public' | 'private_owner' | 'private_team';
    teamId?: number | null;
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
  if (body.objective !== undefined) data.objective = body.objective.trim() || null;
  if (body.printerBrand !== undefined) data.printerBrand = body.printerBrand.trim() || null;
  if (body.printerModel !== undefined) data.printerModel = body.printerModel.trim() || null;
  if (body.printerNozzle !== undefined) data.printerNozzle = body.printerNozzle.trim() || null;
  if (body.printerMaterial !== undefined) data.printerMaterial = body.printerMaterial.trim() || null;
  if (body.printerLayerHeight !== undefined) data.printerLayerHeight = body.printerLayerHeight.trim() || null;

  let resolvedTags: Category[] | null = null;
  if (body.tags !== undefined) {
    const tagValues = Array.isArray(body.tags) ? body.tags : [];
    if (tagValues.length === 0) return NextResponse.json({ error: 'Selecione ao menos uma tag' }, { status: 400 });
    const resolved = new Set<Category>();
    for (const t of tagValues) {
      const r = tagMap[t];
      if (!r) return NextResponse.json({ error: 'Tag inválida' }, { status: 400 });
      resolved.add(r);
    }
    resolvedTags = Array.from(resolved);
  }

  if (body.visibility !== undefined) {
    if (!['public', 'private_owner', 'private_team'].includes(body.visibility)) {
      return NextResponse.json({ error: 'Visibilidade inválida' }, { status: 400 });
    }
    data.visibility = body.visibility;
    if (body.visibility === 'private_team') {
      if (!body.teamId) return NextResponse.json({ error: 'Equipe obrigatória para projeto privado da equipe' }, { status: 400 });
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: body.teamId, userId: session!.userId } },
        select: { status: true },
      });
      if (!membership || membership.status !== 'approved') {
        return NextResponse.json({ error: 'Você não é membro aprovado desta equipe' }, { status: 403 });
      }
      data.teamId = body.teamId;
    } else {
      data.teamId = null;
    }
  }

  if (body.coverImageB64 && body.coverImageContentType) {
    try {
      const result = await uploadProjectImage(body.coverImageB64, body.coverImageContentType, projectId);
      data.coverImageUrl = result.url;
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro no upload da imagem' }, { status: 400 });
    }
  }

  const [project] = await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data,
      select: { id: true, title: true, description: true, objective: true, visibility: true, teamId: true, coverImageUrl: true },
    }),
    ...(resolvedTags
      ? [
          prisma.projectTag.deleteMany({ where: { projectId } }),
          prisma.projectTag.createMany({ data: resolvedTags.map((tag) => ({ projectId, tag })) }),
        ]
      : []),
  ]);

  const currentTags = resolvedTags
    ?? (await prisma.projectTag.findMany({ where: { projectId }, select: { tag: true } })).map((t) => t.tag);

  return NextResponse.json({ ...project, tags: currentTags });
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
    prisma.projectTag.deleteMany({ where: { projectId } }),
    prisma.projectComponent.deleteMany({ where: { projectId } }),
    prisma.projectVote.deleteMany({ where: { projectId } }),
    prisma.projectShare.deleteMany({ where: { projectId } }),
    prisma.projectDifficulty.deleteMany({ where: { projectId } }),
    prisma.projectExport.deleteMany({ where: { projectId } }),
    prisma.projectExtractionLog.deleteMany({ where: { projectId } }),
    prisma.projectImage.deleteMany({ where: { projectId } }),
    prisma.projectFile.deleteMany({ where: { projectId } }),
    prisma.projectComment.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ]);

  return NextResponse.json({ ok: true });
}
