import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  generateSessionToken,
} from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const password =
      typeof body === 'object' && body !== null && 'password' in body
        ? (body as { password?: string }).password
        : undefined;

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const appPassword = process.env.APP_PASSWORD;

    if (!appPassword) {
      console.error('APP_PASSWORD is not configured');
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    if (password !== appPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = await generateSessionToken(expiresAt);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing login request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
