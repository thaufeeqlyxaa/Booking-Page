import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  validateAdminCredentials
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!validateAdminCredentials(String(username).trim(), String(password))) {
      return NextResponse.json({ error: 'invalid' }, { status: 401 });
    }

    const token = createAdminSessionToken();

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
}
