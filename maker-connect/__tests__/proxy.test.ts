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

  it('páginas privadas continuam redirecionando para /login', async () => {
    const res = await proxy(req('/projects'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it.each(['/', '/termos', '/privacidade', '/login', '/historia/arduino-uno.webp'])(
    'página pública %s passa sem sessão',
    async (path) => {
      const res = await proxy(req(path));
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  );
});
