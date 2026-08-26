import { NextRequest, NextResponse } from 'next/server';
import { generateState, getAppUrl, stateCookieOptions } from '@/lib/oauth';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Login com Google não configurado' }, { status: 500 });
  }

  const state = generateState();
  const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`;

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');

  const res = NextResponse.redirect(url);
  res.cookies.set(stateCookieOptions(state));
  return res;
}
