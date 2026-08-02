import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
    }

    const registration = await prisma.registration.findUnique({
      where: { ticketCode: code.trim().toUpperCase() }
    });

    if (!registration) {
      return NextResponse.json({ error: 'Invalid ticket code or no registration found' }, { status: 404 });
    }

    // Fetch related event details
    const event = await prisma.event.findUnique({
      where: { id: registration.eventId },
      select: { title: true, startDate: true, startTime: true, location: true, organizer: true }
    });

    return NextResponse.json({ 
      success: true, 
      registration: {
        ...registration,
        eventTitle: event?.title || registration.eventTitle,
        eventStartDate: event?.startDate || '',
        eventStartTime: event?.startTime || '',
        eventLocation: event?.location || 'Online',
        eventOrganizer: event?.organizer || ''
      } 
    });
  } catch (error) {
    console.error('Verify registration error:', error);
    return NextResponse.json({ error: 'Failed to verify ticket code' }, { status: 500 });
  }
}
