import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyCredentials, SESSION_COOKIE_NAME } from '../../../../lib/auth';

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const user = verifyCredentials(parsed.data.username, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const res = NextResponse.json({
      user: { username: user.username, displayName: user.displayName },
    });
    res.cookies.set(SESSION_COOKIE_NAME, user.username, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_MONTH_SECONDS,
    });
    return res;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
