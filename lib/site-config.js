// lib/site-config.js — canonical site URL and support email (synax.live)

const DEFAULT_DOMAIN = 'synax.live';

/** Origin without trailing slash, e.g. https://synax.live */
export function getSiteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || `https://${DEFAULT_DOMAIN}`;
  return raw.replace(/\/$/, '');
}

/** Absolute URL for a path, e.g. getSiteUrl('/trade') */
export function getSiteUrl(path = '/') {
  const origin = getSiteOrigin();
  if (!path || path === '/') return `${origin}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function getSupportEmail() {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER?.includes('@')) return process.env.SMTP_USER;
  return `support@${DEFAULT_DOMAIN}`;
}

export const SITE_DOMAIN = DEFAULT_DOMAIN;
