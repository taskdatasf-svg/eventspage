import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

const CACHE_KEY = 'events:all';
const CACHE_TTL = 60; // 60 seconds

export async function GET() {
  try {
    // ── 1. Cache hit ────────────────────────────────────────────────────────
    const cached = await cacheGet<{ events: unknown[] }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // ── 2. Cache miss — query DB ────────────────────────────────────────────
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formattedEvents = events.map(e => ({
      ...e,
      requireApproval: e.requireApproval || (e.title ? e.title.toLowerCase().includes('incept') : false)
    }));

    const payload = { events: formattedEvents };
    await cacheSet(CACHE_KEY, payload, CACHE_TTL);

    return NextResponse.json(payload, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const isApprovalRequired = body.requireApproval === true || (body.title ? body.title.toLowerCase().includes('incept') : false);

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
        requireApproval: isApprovalRequired,
        capacity: body.capacity || 'Unlimited',
        calendarType: body.calendarType || 'Personal Calendar',
        visibility: body.visibility || 'Public',
        coverImage: body.coverImage || null,
        headerBg: body.headerBg || 'bg-[#818cf8]',
        themeIdx: body.themeIdx ?? 0,
        font: body.font || 'Default',
        customFields: body.customFields || null,
        speakers: body.speakers || null,
      },
    });

    // Invalidate list cache so next GET reflects the new event
    await cacheDel(CACHE_KEY);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
