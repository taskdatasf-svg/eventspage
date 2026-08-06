import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

const EVENT_TTL  = 120; // 2 minutes for individual event
const LIST_KEY   = 'events:all';
const eventKey   = (id: string) => `event:${id}`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const key = eventKey(id);

    // ── Cache hit ─────────────────────────────────────────────────────────────
    const cached = await cacheGet<{ event: unknown }>(key);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
    }

    // ── Cache miss — query DB ─────────────────────────────────────────────────
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const isApprovalRequired = event.requireApproval || (event.title ? event.title.toLowerCase().includes('incept') : false);
    const formattedEvent = { ...event, requireApproval: isApprovalRequired };

    const payload = { event: formattedEvent };
    await cacheSet(key, payload, EVENT_TTL);

    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.title        !== undefined) updateData.title        = body.title;
    if (body.organizer    !== undefined) updateData.organizer    = body.organizer;
    if (body.location     !== undefined) updateData.location     = body.location;
    if (body.description  !== undefined) updateData.description  = body.description;
    if (body.startDate    !== undefined) updateData.startDate    = body.startDate;
    if (body.startTime    !== undefined) updateData.startTime    = body.startTime;
    if (body.endDate      !== undefined) updateData.endDate      = body.endDate;
    if (body.endTime      !== undefined) updateData.endTime      = body.endTime;
    if (body.price        !== undefined) updateData.price        = body.price;
    if (body.requireApproval !== undefined) updateData.requireApproval = body.requireApproval;
    if (body.title && body.title.toLowerCase().includes('incept')) updateData.requireApproval = true;
    if (body.capacity     !== undefined) updateData.capacity     = body.capacity;
    if (body.calendarType !== undefined) updateData.calendarType = body.calendarType;
    if (body.visibility   !== undefined) updateData.visibility   = body.visibility;
    if (body.coverImage   !== undefined) updateData.coverImage   = body.coverImage;
    if (body.headerBg     !== undefined) updateData.headerBg     = body.headerBg;
    if (body.themeIdx     !== undefined) updateData.themeIdx     = body.themeIdx;
    if (body.font         !== undefined) updateData.font         = body.font;
    if (body.customFields !== undefined) updateData.customFields = body.customFields;
    if (body.speakers     !== undefined) updateData.speakers     = body.speakers;

    const event = await prisma.event.update({ where: { id }, data: updateData });

    // Invalidate both the individual event and list caches
    await cacheDel(eventKey(id), LIST_KEY);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('PATCH /api/events/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });

    // Invalidate both the individual event and list caches
    await cacheDel(eventKey(id), LIST_KEY);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
