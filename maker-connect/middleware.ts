import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Only guard (app) routes — static assets and API routes (except those starting with /api/auth) are excluded via config
  const token = req.cookies.get('mc_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.set({ name: 'mc_session', value: '', maxAge: 0, path: '/' });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Only protect UI (app) routes. API routes handle their own auth per-handler.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|login|signup).*)',
  ],
};
