import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const registrations = await prisma.registration.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch headerBg and other details from Event model for styling
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        const event = await prisma.event.findUnique({
          where: { id: reg.eventId },
          select: { headerBg: true, startDate: true, startTime: true, location: true, price: true }
        });
        return {
          ...reg,
          eventHeaderBg: event?.headerBg || 'bg-[#818cf8]',
          eventStartDate: event?.startDate || '',
          eventStartTime: event?.startTime || '',
          eventLocation: event?.location || 'Online',
          eventPrice: event?.price || 'Free'
        };
      })
    );

    return NextResponse.json({ success: true, registrations: registrationsWithEvents });
  } catch (error) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}
