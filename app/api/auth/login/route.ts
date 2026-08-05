import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter your email and password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
