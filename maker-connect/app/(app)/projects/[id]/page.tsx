import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ProjectTabs from './project-tabs';
import ProjectHero from './project-hero';

type Params = {
  id: string;
};

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      parent: {
        select: {
          id: true,
          title: true,
        },
      },
      images: {
        orderBy: { position: 'asc' },
        select: { id: true, imageUrl: true, position: true },
      },
      files: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSizeKb: true },
      },
      difficulties: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { votes: true, shares: true, children: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const session = await getSession();
  const isOwner = session?.userId === project.creatorId;

  return (
    <div className="space-y-6">
      <ProjectHero
        project={{
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          creatorId: project.creatorId,
          creatorName: project.creator.name,
          creatorEmail: project.creator.email,
          parentId: project.parent?.id ?? null,
          parentTitle: project.parent?.title ?? null,
          coverImageUrl: project.coverImageUrl,
          printerBrand: project.printerBrand,
          printerModel: project.printerModel,
          printerNozzle: project.printerNozzle,
          printerMaterial: project.printerMaterial,
          printerLayerHeight: project.printerLayerHeight,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          images: project.images,
          files: project.files,
          votes: project._count.votes,
          shares: project._count.shares,
          forkCount: project._count.children,
        }}
      />

      <ProjectTabs
        projectId={project.id}
        initialInput={project.content ?? project.description ?? ''}
        currentEmbeddingId={project.embeddingId}
        difficulties={project.difficulties}
        comments={project.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
        isOwner={isOwner}
      />
    </div>
  );
}
