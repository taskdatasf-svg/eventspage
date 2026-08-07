import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
    });

    // Enrich users with registration counts
    const userEmails = users.map((u) => u.email);
    const registrations = await prisma.registration.groupBy({
      by: ['email'],
      _count: { id: true },
      where: { email: { in: userEmails } },
    });

    const regMap = new Map(registrations.map((r) => [r.email.toLowerCase(), r._count.id]));

    const formattedUsers = users.map((u) => ({
      ...u,
      registrationCount: regMap.get(u.email.toLowerCase()) || 0,
    }));

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users list' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
