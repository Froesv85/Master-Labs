jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin';

describe('getAdminSession', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna null quando não há sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    const result = await getAdminSession();
    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('retorna null quando o usuário da sessão não é admin', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'user@test.com', name: 'User' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'user' });

    const result = await getAdminSession();
    expect(result).toBeNull();
  });

  it('retorna a sessão quando o usuário é admin', async () => {
    const session = { userId: 1, email: 'admin@test.com', name: 'Admin' };
    (getSession as jest.Mock).mockResolvedValue(session);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'admin' });

    const result = await getAdminSession();
    expect(result).toEqual(session);
  });

  it('retorna null quando o usuário da sessão não existe mais no banco', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'ghost@test.com', name: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getAdminSession();
    expect(result).toBeNull();
  });
});
