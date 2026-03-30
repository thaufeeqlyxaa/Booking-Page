import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'lyxaa_admin_session';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'lyxaa-admin-session-v1';
const ADMIN_SESSION_PAYLOAD = 'admin';

function signValue(value: string) {
  return createHmac('sha256', ADMIN_SESSION_SECRET).update(value).digest('hex');
}

export function validateAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createAdminSessionToken() {
  const signature = signValue(ADMIN_SESSION_PAYLOAD);
  return `${ADMIN_SESSION_PAYLOAD}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (payload !== ADMIN_SESSION_PAYLOAD || !signature) return false;

  const expectedSignature = signValue(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function sanitizeAdminNextPath(value?: string | null) {
  if (!value || !value.startsWith('/admin')) return '/admin';
  if (value === '/admin/login') return '/admin';
  return value;
}
