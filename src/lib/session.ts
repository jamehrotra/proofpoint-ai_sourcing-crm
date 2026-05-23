import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, findUser, type MockUser, DEFAULT_BACKFILL_USERNAME } from './auth';

/**
 * Reads the session cookie (server-side only) and returns the current user.
 * Returns null if the cookie is missing or invalid.
 *
 * Useful in server components.
 */
export async function getCurrentUser(): Promise<MockUser | null> {
  const store = await cookies();
  const username = store.get(SESSION_COOKIE_NAME)?.value;
  if (!username) return null;
  return findUser(username) ?? null;
}

/**
 * Reads the username from a Request's cookies. Used in API routes where we
 * already have access to the request object (faster than calling next/headers).
 */
export function getUsernameFromRequest(request: { cookies: { get(name: string): { value: string } | undefined } }): string {
  const username = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  // Middleware guarantees this cookie is present for non-public routes, but
  // fall back to the backfill user defensively.
  return username || DEFAULT_BACKFILL_USERNAME;
}
