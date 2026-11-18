import { useSessionStore } from '@/stores/session-store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';
export const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Cliente HTTP fino: injeta o token, entende problem+json (RFC 9457)
 * e tenta um refresh transparente em 401.
 */
export async function api<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const { accessToken } = useSessionStore.getState();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.idempotencyKey) headers.set('Idempotency-Key', init.idempotencyKey);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && accessToken && (await useSessionStore.getState().refresh())) {
    return api<T>(path, init);
  }
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    throw new ApiError(res.status, problem.code ?? 'HTTP_ERROR', problem.title ?? 'Erro ao comunicar com o servidor');
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
