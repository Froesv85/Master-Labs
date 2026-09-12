import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    project: { updateMany: jest.fn() },
    robot: { updateMany: jest.fn() },
    competition: { deleteMany: jest.fn() },
    teamMember: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, DELETE } from '@/app/api/teams/[id]/route';

const mockTeam = {
  id: 1,
  name: 'Robô Warriors',
  isPublic: true,
  owner: { id: 1, name: 'Alice Maker' },
  members: [],
};

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/teams/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna equipe com status 200', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

    const res = await GET(makeRequest('http://localhost:3000/api/teams/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Robô Warriors');
  });

  it('retorna 404 quando equipe não existe', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/teams/99'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/teams/abc'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });
});

describe('DELETE /api/teams/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  function makeDeleteRequest(url: string) {
    return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'DELETE' });
  }

  it('retorna 401 quando não autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/teams/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando quem pede não é o dono', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1 });
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/teams/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando a equipe não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/teams/99'), { params: Promise.resolve({ id: '99' }) });
    expect(res.status).toBe(404);
  });

  it('exclui a equipe quando o dono solicita, desanexando robôs e projetos', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: 1 });
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/teams/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);

    // Projetos "so a equipe" viram "so eu" (nao ficam invisiveis sem a equipe);
    // o resto (robos, projetos publicos) so desanexa. Competicoes e membros somem.
    expect(prisma.project.updateMany).toHaveBeenCalledWith({
      where: { teamId: 1, visibility: 'private_team' },
      data: { teamId: null, visibility: 'private_owner' },
    });
    expect(prisma.project.updateMany).toHaveBeenCalledWith({ where: { teamId: 1 }, data: { teamId: null } });
    expect(prisma.robot.updateMany).toHaveBeenCalledWith({ where: { teamId: 1 }, data: { teamId: null } });
    expect(prisma.competition.deleteMany).toHaveBeenCalledWith({ where: { teamId: 1 } });
    expect(prisma.teamMember.deleteMany).toHaveBeenCalledWith({ where: { teamId: 1 } });
    expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
