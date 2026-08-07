import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueBroadcastBatch, getTodaySentCount, DAILY_LIMIT } from '@/lib/mailQueue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, bodyHtml, headerBannerUrl, eventId } = body;

    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
    }

    if (!bodyHtml || typeof bodyHtml !== 'string' || bodyHtml.trim() === '') {
      return NextResponse.json({ error: 'Mail body content is required.' }, { status: 400 });
    }

    // Check daily limit upfront
    const sentToday = await getTodaySentCount();
    if (sentToday >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily broadcast limit of ${DAILY_LIMIT} emails has been reached for today (${sentToday}/${DAILY_LIMIT} sent). Please try again tomorrow.`,
          totalSentToday: sentToday,
          limit: DAILY_LIMIT,
        },
        { status: 429 }
      );
    }

    // Determine target recipient emails from database
    const recipientMap = new Map<string, { email: string; name?: string }>();

    if (eventId && eventId !== 'all') {
      // Event-specific target: Fetch all attendees registered for this specific event
      const registrations = await prisma.registration.findMany({
        where: { eventId },
        select: { email: true, name: true },
      });

      for (const reg of registrations) {
        if (reg.email && !recipientMap.has(reg.email.trim().toLowerCase())) {
          recipientMap.set(reg.email.trim().toLowerCase(), { email: reg.email.trim(), name: reg.name });
        }
      }
    } else {
      // All platform audience target: Fetch both registered users and event attendees
      const [allUsers, allRegistrations] = await Promise.all([
        prisma.user.findMany({
          select: { email: true, name: true },
        }),
        prisma.registration.findMany({
          select: { email: true, name: true },
        }),
      ]);

      for (const u of allUsers) {
        if (u.email && !recipientMap.has(u.email.trim().toLowerCase())) {
          recipientMap.set(u.email.trim().toLowerCase(), { email: u.email.trim(), name: u.name });
        }
      }

      for (const reg of allRegistrations) {
        if (reg.email && !recipientMap.has(reg.email.trim().toLowerCase())) {
          recipientMap.set(reg.email.trim().toLowerCase(), { email: reg.email.trim(), name: reg.name });
        }
      }
    }

    const recipients = Array.from(recipientMap.values());

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No registered attendees found for the selected audience.' }, { status: 400 });
    }

    // Enqueue jobs with BullMQ (3 seconds gap between mails, 90 per day cap)
    const result = await enqueueBroadcastBatch(
      recipients,
      subject.trim(),
      bodyHtml.trim(),
      headerBannerUrl ? headerBannerUrl.trim() : null
    );

    return NextResponse.json({
      message: `Successfully queued ${result.enqueuedCount} broadcast email(s).`,
      enqueuedCount: result.enqueuedCount,
      delayedForTomorrowCount: result.delayedForTomorrowCount,
      dailyLimitReached: result.delayedForTomorrowCount > 0,
      totalSentToday: result.totalSentToday,
      remainingToday: result.remainingToday,
      logs: result.logs,
    });
  } catch (err: any) {
    console.error('Broadcast send error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to send broadcast.' }, { status: 500 });
  }
}
