import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((publicPath) => {
    if (publicPath === pathname) {
      return true;
    }

    return pathname.startsWith(`${publicPath}/`);
  });

  if (isPublicPath) {
    return NextResponse.next();
  }

  if (!process.env.APP_PASSWORD) {
    console.error('CRITICAL: APP_PASSWORD environment variable is not set');
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken || !(await validateSessionToken(sessionToken))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';

    const from = `${request.nextUrl.pathname}${request.nextUrl.search}` || '/';
    loginUrl.searchParams.set('from', from);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
