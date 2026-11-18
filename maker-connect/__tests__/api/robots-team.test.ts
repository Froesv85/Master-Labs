import { NextRequest } from 'next/server';

// Vinculo robo <-> equipe: so vale para equipe da qual o dono e membro aprovado.
jest.mock('@/lib/prisma', () => ({
  prisma: {
    robot: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    robotImage: { create: jest.fn() },
    robotComponent: { createMany: jest.fn() },
    robotAward: { createMany: jest.fn() },
    robotEvent: { create: jest.fn() },
    robotEventParticipation: { create: jest.fn() },
  },
}));
jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/project-media', () => ({ uploadProjectImage: jest.fn() }));
jest.mock('@/lib/project-access', () => ({ getApprovedTeamIds: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getApprovedTeamIds } from '@/lib/project-access';
import { POST } from '@/app/api/robots/route';
import { PATCH } from '@/app/api/robots/[id]/route';

const post = (body: object) =>
  new NextRequest(new URL('http://localhost:3000/api/robots'), { method: 'POST', body: JSON.stringify(body) });
const patch = (body: object) =>
  new NextRequest(new URL('http://localhost:3000/api/robots/5'), { method: 'PATCH', body: JSON.stringify(body) });
const ctx = { params: Promise.resolve({ id: '5' }) };

beforeEach(() => {
  jest.clearAllMocks();
  (getApprovedTeamIds as jest.Mock).mockResolvedValue([3]);
  (prisma.robot.create as jest.Mock).mockResolvedValue({ id: 5 });
  (prisma.robot.update as jest.Mock).mockResolvedValue({ id: 5 });
});

describe('POST /api/robots — equipe', () => {
  it('401 sem sessão (não cai mais no usuário 1)', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(post({ name: 'Nodo', category: 'educational' }));
    expect(res.status).toBe(401);
    expect(prisma.robot.create).not.toHaveBeenCalled();
  });

  it('403 ao vincular a equipe da qual não é membro', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    const res = await POST(post({ name: 'Nodo', category: 'educational', teamId: 9 }));
    expect(res.status).toBe(403);
    expect(prisma.robot.create).not.toHaveBeenCalled();
  });

  it('cria vinculado à própria equipe', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue({ id: 5, teamId: 3 });
    const res = await POST(post({ name: 'Nodo', category: 'educational', teamId: 3 }));
    expect(res.status).toBe(201);
    expect((prisma.robot.create as jest.Mock).mock.calls[0][0].data).toMatchObject({ ownerId: 1, teamId: 3 });
  });
});

describe('PATCH /api/robots/[id] — equipe', () => {
  it('401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    expect((await PATCH(patch({ teamId: 3 }), ctx)).status).toBe(401);
  });

  it('403 quando não é o dono do robô', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1, teamId: null });
    expect((await PATCH(patch({ teamId: 3 }), ctx)).status).toBe(403);
    expect(prisma.robot.update).not.toHaveBeenCalled();
  });

  it('403 ao mover para equipe da qual não é membro', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1, teamId: null });
    expect((await PATCH(patch({ teamId: 9 }), ctx)).status).toBe(403);
    expect(prisma.robot.update).not.toHaveBeenCalled();
  });

  it('vincula à própria equipe', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1, teamId: null });
    expect((await PATCH(patch({ teamId: 3 }), ctx)).status).toBe(200);
    expect((prisma.robot.update as jest.Mock).mock.calls[0][0].data).toEqual({ teamId: 3 });
  });

  it('manter a equipe atual é permitido mesmo se o dono saiu dela', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1, teamId: 9 });
    expect((await PATCH(patch({ name: 'Nodo v2', teamId: 9 }), ctx)).status).toBe(200);
  });

  it('desvincular (null) é sempre permitido', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1, teamId: 3 });
    expect((await PATCH(patch({ teamId: null }), ctx)).status).toBe(200);
    expect((prisma.robot.update as jest.Mock).mock.calls[0][0].data).toEqual({ teamId: null });
  });
});
