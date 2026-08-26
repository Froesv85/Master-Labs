import { NextRequest, NextResponse } from 'next/server';
import { generateState, getAppUrl, stateCookieOptions } from '@/lib/oauth';

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Login com GitHub não configurado' }, { status: 500 });
  }

  const state = generateState();
  const redirectUri = `${getAppUrl(req)}/api/auth/github/callback`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);

  const res = NextResponse.redirect(url);
  res.cookies.set(stateCookieOptions(state));
  return res;
}
