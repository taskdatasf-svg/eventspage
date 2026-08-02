import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Map properties explicitly to match Prisma schema and ignore extra parameters
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.organizer !== undefined) updateData.organizer = body.organizer;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.requireApproval !== undefined) updateData.requireApproval = body.requireApproval;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.calendarType !== undefined) updateData.calendarType = body.calendarType;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.headerBg !== undefined) updateData.headerBg = body.headerBg;
    if (body.themeIdx !== undefined) updateData.themeIdx = body.themeIdx;
    if (body.font !== undefined) updateData.font = body.font;
    if (body.customFields !== undefined) updateData.customFields = body.customFields;
    if (body.speakers !== undefined) updateData.speakers = body.speakers;

    const event = await prisma.event.update({ where: { id }, data: updateData });
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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
