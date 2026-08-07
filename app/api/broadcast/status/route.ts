import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTodaySentCount, DAILY_LIMIT, recentMailLogs } from '@/lib/mailQueue';

export async function GET() {
  try {
    const sentToday = await getTodaySentCount();
    const remainingToday = Math.max(0, DAILY_LIMIT - sentToday);

    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        startDate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const [users, registrations] = await Promise.all([
      prisma.user.findMany({ select: { email: true } }),
      prisma.registration.findMany({ select: { email: true } }),
    ]);

    const uniqueEmails = new Set<string>();
    users.forEach((u) => u.email && uniqueEmails.add(u.email.trim().toLowerCase()));
    registrations.forEach((r) => r.email && uniqueEmails.add(r.email.trim().toLowerCase()));
    const totalAttendees = uniqueEmails.size;

    return NextResponse.json({
      dailyLimit: DAILY_LIMIT,
      sentToday,
      remainingToday,
      totalAttendees,
      events,
      logs: recentMailLogs.slice(0, 30),
    });
  } catch (err: any) {
    console.error('Broadcast status error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch broadcast status.' }, { status: 500 });
  }
}
