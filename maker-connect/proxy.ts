import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

// /historia/: imagens da secao de historia da home (publica), em public/historia/
const PUBLIC_PATHS = ['/login', '/signup', '/historia/'];
const PUBLIC_EXACT_PATHS = ['/', '/termos', '/privacidade'];

// API publica: autenticacao/OAuth, healthcheck do Docker e o callback do n8n
// (este se autentica pelo webhookId, que so o dono do projeto ve). Todo o resto
// de /api exige sessao aqui E checagem de permissao dentro da rota.
const PUBLIC_API_PREFIXES = ['/api/auth/'];
const PUBLIC_API_EXACT = ['/api/health'];
const PUBLIC_API_PATTERNS = [/^\/api\/projects\/\d+\/extract\/callback$/];

function isPublicApi(pathname: string) {
  return (
    PUBLIC_API_EXACT.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_API_PATTERNS.some((re) => re.test(pathname))
  );
}

function unauthorized(req: NextRequest, clearCookie: boolean) {
  const res = req.nextUrl.pathname.startsWith('/api/')
    ? NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    : NextResponse.redirect(new URL('/login', req.url));
  if (clearCookie) res.cookies.set({ name: 'mc_session', value: '', maxAge: 0, path: '/' });
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = pathname.startsWith('/api/')
    ? isPublicApi(pathname)
    : PUBLIC_EXACT_PATHS.includes(pathname) || PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('mc_session')?.value;
  if (!token) return unauthorized(req, false);

  const session = await verifySession(token);
  if (!session) return unauthorized(req, true);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
