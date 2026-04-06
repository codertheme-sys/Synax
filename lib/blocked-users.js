/**
 * Blocked accounts (normalized lowercase). Add emails here or set BLOCKED_EMAILS env (comma-separated).
 */
const STATIC_BLOCKED = new Set(['dannybutler77@outlook.com']);

function normalizeEnvList() {
  const raw = typeof process !== 'undefined' ? process.env.BLOCKED_EMAILS : '';
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBlockedEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const n = email.trim().toLowerCase();
  if (!n) return false;
  if (STATIC_BLOCKED.has(n)) return true;
  return normalizeEnvList().includes(n);
}
