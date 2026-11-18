import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

/** BFF de login: troca credenciais por tokens e guarda o refresh em cookie HttpOnly. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.redirect(new URL('/login?erro=credenciais', req.url), 303);

  const { refreshToken } = (await res.json()) as { refreshToken: string };
  (await cookies()).set('pg_rt', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(new URL('/dashboard', req.url), 303);
}
