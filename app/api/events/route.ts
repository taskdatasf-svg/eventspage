import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();

    const event = await prisma.event.create({
      data: {
        ticketCode: `GBD${randomChars}`,
        title: body.title,
        organizer: body.organizer || 'Infinity Event Organizer',
        location: body.location || '',
        description: body.description || '',
        startDate: body.startDate,
        startTime: body.startTime,
        endDate: body.endDate || '',
        endTime: body.endTime || '',
        price: body.price || 'Free',
        requireApproval: body.requireApproval ?? false,
        capacity: body.capacity || 'Unlimited',
        calendarType: body.calendarType || 'Personal Calendar',
        visibility: body.visibility || 'Public',
        coverImage: body.coverImage || null,
        headerBg: body.headerBg || 'bg-[#818cf8]',
        themeIdx: body.themeIdx ?? 0,
        customFields: body.customFields || null,
        speakers: body.speakers || null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
