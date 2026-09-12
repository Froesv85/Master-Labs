import { Category, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const TAG_ALIASES: Record<string, Category> = {
  '3D_Printing': Category.Printing3D,
  Printing3D: Category.Printing3D,
  Robotics: Category.Robotics,
  IoT: Category.IoT,
  Woodworking: Category.Woodworking,
};

export async function getApprovedTeamIds(userId: number): Promise<number[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId, status: 'approved' },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

export async function projectVisibilityWhere(userId: number | null): Promise<Prisma.ProjectWhereInput> {
  if (!userId) return { visibility: 'public' };
  const approvedTeamIds = await getApprovedTeamIds(userId);
  return {
    OR: [
      { visibility: 'public' },
      { visibility: 'private_owner', creatorId: userId },
      ...(approvedTeamIds.length
        ? [{ visibility: 'private_team' as const, teamId: { in: approvedTeamIds } }]
        : []),
    ],
  };
}

export type OwnershipGuardResult = { error: null; project: { creatorId: number } } | { error: string; status: number };

export async function requireOwnedProject(
  projectId: number,
  userId: number | null | undefined
): Promise<OwnershipGuardResult> {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return { error: 'ID inválido', status: 400 };
  }
  if (!userId) {
    return { error: 'Não autorizado', status: 401 };
  }
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { creatorId: true } });
  if (!project) {
    return { error: 'Projeto não encontrado', status: 404 };
  }
  if (project.creatorId !== userId) {
    return { error: 'Sem permissão', status: 403 };
  }
  return { error: null, project };
}

export async function canAccessProject(
  project: { visibility: string; creatorId: number; teamId: number | null },
  userId: number | null
): Promise<boolean> {
  if (project.visibility === 'public') return true;
  if (!userId) return false;
  if (project.visibility === 'private_owner') return project.creatorId === userId;
  if (project.visibility === 'private_team') {
    if (!project.teamId) return false;
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId } },
      select: { status: true },
    });
    return membership?.status === 'approved';
  }
  return false;
}
