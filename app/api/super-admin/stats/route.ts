import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalUsers, totalEvents, totalRegistrations, totalQueries, pendingQueries] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.registration.count(),
      prisma.supportQuery.count(),
      prisma.supportQuery.count({ where: { status: 'PENDING' } }),
    ]);

    const approvedRegistrations = await prisma.registration.count({ where: { status: 'APPROVED' } });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        approvedRegistrations,
        totalQueries,
        pendingQueries,
      },
    });
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch platform metrics' }, { status: 500 });
  }
}
