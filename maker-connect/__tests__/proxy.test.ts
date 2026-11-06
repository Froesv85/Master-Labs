import { NextRequest } from 'next/server';

const mockVerifySession = jest.fn();
jest.mock('@/lib/auth', () => ({ verifySession: (...args: unknown[]) => mockVerifySession(...args) }));

import { config, proxy } from '@/proxy';

function req(path: string, cookie?: string) {
  return new NextRequest(new URL(path, 'http://localhost:3000'), {
    headers: cookie ? { cookie: `mc_session=${cookie}` } : {},
  });
}

afterEach(() => jest.clearAllMocks());

describe('proxy (middleware de autenticação)', () => {
  it('cobre /api no matcher (antes /api ficava de fora e as rotas ficavam abertas)', () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    expect(matcher.test('/api/users/1')).toBe(true);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
  });

  it.each(['/api/users/1', '/api/profile', '/api/projects/1/extract', '/api/projects/1/difficulties'])(
    'responde 401 em JSON para %s sem sessão',
    async (path) => {
      const res = await proxy(req(path));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Não autenticado.' });
    }
  );

  it('responde 401 e limpa o cookie quando a sessão é inválida', async () => {
    mockVerifySession.mockResolvedValue(null);
    const res = await proxy(req('/api/users/1', 'expirado'));
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toMatch(/mc_session=;/);
  });

  it.each([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/google/callback',
    '/api/health',
    '/api/projects/7/extract/callback',
  ])('deixa %s passar sem sessão', async (path) => {
    const res = await proxy(req(path));
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(mockVerifySession).not.toHaveBeenCalled();
  });

  it('não trata o callback de outro caminho como público', async () => {
    const res = await proxy(req('/api/projects/7/extract'));
    expect(res.status).toBe(401);
  });

  it('libera a API com sessão válida', async () => {
    mockVerifySession.mockResolvedValue({ userId: 1, email: 'me@test.com', name: 'Me' });
    const res = await proxy(req('/api/users/1', 'valido'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it.each(['/profile', '/profile/3', '/robots', '/admin/metrics', '/projects/abc', '/teams/1/extra'])(
    'página privada %s continua redirecionando para /login',
    async (path) => {
      const res = await proxy(req(path));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    }
  );

  describe('modo convidado', () => {
    function reqMethod(path: string, method: string) {
      return new NextRequest(new URL(path, 'http://localhost:3000'), { method });
    }

    it.each(['/projects', '/projects/12', '/teams', '/teams/3', '/communities', '/communities/4'])(
      'página de leitura %s abre sem sessão',
      async (path) => {
        const res = await proxy(req(path));
        expect(res.headers.get('x-middleware-next')).toBe('1');
        expect(mockVerifySession).not.toHaveBeenCalled();
      }
    );

    it.each([
      '/api/projects',
      '/api/projects/12',
      '/api/projects/12/export',
      '/api/teams',
      '/api/teams/3',
      '/api/teams/3/members',
      '/api/teams/3/competitions',
      '/api/communities',
      '/api/communities/4',
      '/api/communities/4/members',
    ])('GET %s passa sem sessão', async (path) => {
      const res = await proxy(reqMethod(path, 'GET'));
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it.each([
      ['POST', '/api/projects'],
      ['POST', '/api/projects/12/vote'],
      ['POST', '/api/projects/12/comments'],
      ['POST', '/api/projects/12/fork'],
      ['POST', '/api/projects/12/export'],
      ['POST', '/api/teams'],
      ['POST', '/api/teams/3/members'],
      ['POST', '/api/communities'],
      ['POST', '/api/communities/4/members'],
      ['POST', '/api/communities/4/posts'],
      ['PATCH', '/api/projects/12'],
      ['DELETE', '/api/teams/3'],
      ['GET', '/api/projects/12/dossier'],
      ['GET', '/api/teams/mine'],
      ['GET', '/api/users/1'],
    ])('%s %s continua exigindo sessão (401)', async (method, path) => {
      const res = await proxy(reqMethod(path, method));
      expect(res.status).toBe(401);
    });

    it('POST /api/visits é público (conta visitas de convidados)', async () => {
      const res = await proxy(reqMethod('/api/visits', 'POST'));
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('GET /api/visits não é público', async () => {
      const res = await proxy(reqMethod('/api/visits', 'GET'));
      expect(res.status).toBe(401);
    });
  });

  it.each(['/', '/termos', '/privacidade', '/login', '/historia/arduino-uno.webp'])(
    'página pública %s passa sem sessão',
    async (path) => {
      const res = await proxy(req(path));
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  );
});
