import { NextResponse } from 'next/server';

/** Canonical host for auth (localStorage / reset links). */
const CANONICAL_HOST = 'synax.live';

export function middleware(request) {
  const host = request.headers.get('host')?.split(':')[0] || '';

  if (host === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
