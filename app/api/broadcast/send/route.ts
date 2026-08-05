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
    let registrations;
    if (eventId && eventId !== 'all') {
      registrations = await prisma.registration.findMany({
        where: { eventId },
        select: { email: true, name: true },
      });
    } else {
      registrations = await prisma.registration.findMany({
        select: { email: true, name: true },
      });
    }

    // Deduplicate recipients by email
    const recipientMap = new Map<string, { email: string; name?: string }>();
    for (const reg of registrations) {
      if (reg.email && !recipientMap.has(reg.email.toLowerCase())) {
        recipientMap.set(reg.email.toLowerCase(), { email: reg.email, name: reg.name });
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
