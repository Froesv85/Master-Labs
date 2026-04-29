import { prisma } from '@/lib/prisma';
import type { PiiType } from './lgpd';

type CreateAuditParams = {
  action: string;
  projectId?: number;
  userId?: number;
  piiTypes: PiiType[];
  redactions: number;
  context?: string;
};

export async function createLgpdAuditLog(params: CreateAuditParams) {
  return prisma.lgpdAuditLog.create({
    data: {
      action: params.action,
      projectId: params.projectId ?? null,
      userId: params.userId ?? null,
      piiTypes: params.piiTypes.length > 0 ? JSON.stringify(params.piiTypes) : null,
      redactions: params.redactions,
      context: params.context ?? null,
    },
  });
}
