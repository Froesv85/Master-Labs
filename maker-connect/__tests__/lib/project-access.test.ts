jest.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { canAccessProject, projectVisibilityWhere } from '@/lib/project-access';

afterEach(() => jest.clearAllMocks());

describe('canAccessProject', () => {
  it('permite acesso a projeto público sem sessão', async () => {
    const allowed = await canAccessProject({ visibility: 'public', creatorId: 1, teamId: null }, null);
    expect(allowed).toBe(true);
  });

  it('nega privado-do-dono sem sessão', async () => {
    const allowed = await canAccessProject({ visibility: 'private_owner', creatorId: 1, teamId: null }, null);
    expect(allowed).toBe(false);
  });

  it('permite privado-do-dono para o próprio criador', async () => {
    const allowed = await canAccessProject({ visibility: 'private_owner', creatorId: 1, teamId: null }, 1);
    expect(allowed).toBe(true);
  });

  it('nega privado-do-dono para outro usuário', async () => {
    const allowed = await canAccessProject({ visibility: 'private_owner', creatorId: 1, teamId: null }, 2);
    expect(allowed).toBe(false);
  });

  it('permite privado-de-equipe para membro aprovado', async () => {
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ status: 'approved' });
    const allowed = await canAccessProject({ visibility: 'private_team', creatorId: 1, teamId: 7 }, 2);
    expect(allowed).toBe(true);
  });

  it('nega privado-de-equipe para membro pendente', async () => {
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ status: 'pending' });
    const allowed = await canAccessProject({ visibility: 'private_team', creatorId: 1, teamId: 7 }, 2);
    expect(allowed).toBe(false);
  });

  it('nega privado-de-equipe para quem não é membro', async () => {
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);
    const allowed = await canAccessProject({ visibility: 'private_team', creatorId: 1, teamId: 7 }, 2);
    expect(allowed).toBe(false);
  });
});

describe('projectVisibilityWhere', () => {
  it('sem usuário, filtra só públicos', async () => {
    const where = await projectVisibilityWhere(null);
    expect(where).toEqual({ visibility: 'public' });
  });

  it('com usuário sem equipes, inclui público e privado-próprio', async () => {
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([]);
    const where = await projectVisibilityWhere(9);
    expect(where).toEqual({
      OR: [
        { visibility: 'public' },
        { visibility: 'private_owner', creatorId: 9 },
      ],
    });
  });

  it('com usuário membro de equipes, inclui privado-de-equipe', async () => {
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([{ teamId: 3 }, { teamId: 4 }]);
    const where = await projectVisibilityWhere(9);
    expect(where).toEqual({
      OR: [
        { visibility: 'public' },
        { visibility: 'private_owner', creatorId: 9 },
        { visibility: 'private_team', teamId: { in: [3, 4] } },
      ],
    });
  });
});
