/**
 * Mock authentication. Designed to scale to many users — to add one, drop another
 * entry into MOCK_USERS. No other code changes required.
 *
 * Security: this is intentionally plaintext. The assignment explicitly says
 * "mock auth is completely fine"; do not deploy this to anything real.
 */

export interface MockUser {
  username: string;
  displayName: string;
  password: string;
}

export const MOCK_USERS: MockUser[] = [
  { username: 'jmhrotra', displayName: 'Jonathan Mehrotra', password: 'proofpoint' },
  { username: 'temp', displayName: 'Temporary User', password: 'proofpoint' },
];

/**
 * Username used to backfill existing rows when the auth migration runs.
 * Should always be a user that exists in MOCK_USERS.
 */
export const DEFAULT_BACKFILL_USERNAME = MOCK_USERS[0].username;

export const SESSION_COOKIE_NAME = 'signal_scout_user';

export function findUser(username: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function verifyCredentials(username: string, password: string): MockUser | null {
  const user = findUser(username);
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

/**
 * Server-side: read username from a cookie store (typically the next/headers cookies()).
 * Returns the user object, or null if cookie missing/invalid.
 */
export function getUserFromUsername(username: string | undefined): MockUser | null {
  if (!username) return null;
  return findUser(username) ?? null;
}

/**
 * Resolve a username to its display name. Falls back to the username (with @)
 * if no matching user is found (e.g. legacy data from a since-deleted user).
 * Safe to call from client components.
 */
export function displayNameForUsername(username: string | null | undefined): string {
  if (!username) return 'Unknown';
  const user = findUser(username);
  return user?.displayName ?? `@${username}`;
}
