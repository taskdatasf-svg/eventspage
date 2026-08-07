import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const eventIds = events.map((e) => e.id);

    const registrationCounts = await prisma.registration.groupBy({
      by: ['eventId'],
      _count: { id: true },
      where: { eventId: { in: eventIds } },
    });

    const regMap = new Map(registrationCounts.map((r) => [r.eventId, r._count.id]));

    const formattedEvents = events.map((e) => ({
      ...e,
      totalRegistrations: regMap.get(e.id) || 0,
    }));

    return NextResponse.json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events list' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Delete event and any associated registrations
    await prisma.registration.deleteMany({ where: { eventId } });
    await prisma.event.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
