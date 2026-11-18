import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proteção de rotas: sem cookie de sessão → /login.
 * A autorização real (papel MERCHANT/ADMIN e posse do restaurante) é sempre validada na API.
 */
export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO === 'true') return NextResponse.next();
  const hasSession = req.cookies.has('pg_rt');
  if (!hasSession) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/orders/:path*', '/menu/:path*', '/promotions/:path*', '/reports/:path*', '/admin/:path*'],
};
