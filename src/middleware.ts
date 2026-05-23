import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from './lib/auth';

// Routes that do NOT require authentication.
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Allow Next internals, static assets, icons.
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname === '/icon.png' || pathname === '/icon.webp' || pathname === '/icon.svg') return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward the pathname so layouts can read it via headers().
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Match everything except static assets and the icon convention files.
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.(?:png|webp|svg|ico)).*)',
  ],
};
