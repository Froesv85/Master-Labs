import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import DifficultiesPanel from './difficulties-panel';

type Params = {
  id: string;
};

function formatCategory(category: string) {
  return category === 'Printing3D' ? '3D_Printing' : category;
}

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
      difficulties: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const creatorProfileHref = `/profile?email=${encodeURIComponent(project.creator.email)}`;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Projeto #{project.id}</h1>
          <div className="flex items-center gap-2">
            <Link
              href={creatorProfileHref}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              Ver Profile
            </Link>
            <Link
              href="/feed"
              className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200"
            >
              Voltar ao Feed
            </Link>
          </div>
        </div>

        <article className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              {formatCategory(project.category)}
            </span>
            {project.parent ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Fork de #{project.parent.id}
              </span>
            ) : null}
          </div>

          <h2 className="mb-2 text-xl font-semibold">{project.title}</h2>

          <p className="mb-6 text-sm text-zinc-600">
            {project.description ?? 'Este projeto ainda nao possui descricao detalhada.'}
          </p>

          <dl className="grid grid-cols-1 gap-4 text-sm text-zinc-700 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-500">Criador</dt>
              <dd className="flex items-center gap-2">
                <span>{project.creator.name ?? project.creator.email}</span>
                <Link href={creatorProfileHref} className="text-zinc-700 underline">
                  abrir profile
                </Link>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Criado em</dt>
              <dd>{new Date(project.createdAt).toLocaleString('pt-BR')}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Atualizado em</dt>
              <dd>{new Date(project.updatedAt).toLocaleString('pt-BR')}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">ID do criador</dt>
              <dd>{project.creatorId}</dd>
            </div>
          </dl>
        </article>

        <DifficultiesPanel projectId={project.id} initialDifficulties={project.difficulties} />
      </main>
    </div>
  );
}
