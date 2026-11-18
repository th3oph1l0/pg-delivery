import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

/**
 * BFF: o refresh token fica em cookie HttpOnly e nunca é exposto ao JavaScript.
 * Rotaciona o cookie a cada chamada (o backend detecta reuso e revoga a família).
 */
export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get('pg_rt')?.value;
  if (!refreshToken) return NextResponse.json({ code: 'NO_SESSION' }, { status: 401 });

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  if (!res.ok) {
    jar.delete('pg_rt');
    return NextResponse.json({ code: 'SESSION_EXPIRED' }, { status: 401 });
  }

  const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
  jar.set('pg_rt', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ accessToken: tokens.accessToken });
}
