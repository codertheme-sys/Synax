// Persist PKCE code_verifier when requesting reset so the email link can exchange ?code= on the same site.

const COOKIE_NAME = 'synax_pkce_verifier';
const MAX_AGE_SEC = 3600;

export function getCodeVerifierStorageKey() {
  return 'sb-auth-token-code-verifier';
}

export function saveRecoveryCodeVerifier() {
  if (typeof window === 'undefined') return false;
  const verifier = localStorage.getItem(getCodeVerifierStorageKey());
  if (!verifier) return false;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(verifier)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
  return true;
}

export function restoreRecoveryCodeVerifier() {
  if (typeof window === 'undefined') return false;
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  try {
    localStorage.setItem(getCodeVerifierStorageKey(), decodeURIComponent(match[1]));
    return true;
  } catch {
    return false;
  }
}

export function clearRecoveryCodeVerifierCookie() {
  if (typeof window === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
