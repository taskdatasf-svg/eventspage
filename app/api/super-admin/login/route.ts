import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@studentforge.in';
    const expectedPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdminSecret123!';

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter both email and password.' }, { status: 400 });
    }

    if (email.trim().toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid Super Admin credentials.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        email: expectedEmail,
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
      },
    });

    // Set secure HTTP-Only cookie for Super Admin session
    response.cookies.set('super_admin_session', 'authenticated_super_admin_session_active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Super Admin login error:', error);
    return NextResponse.json({ error: 'Failed to process Super Admin login request' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('super_admin_session');
  return response;
}
