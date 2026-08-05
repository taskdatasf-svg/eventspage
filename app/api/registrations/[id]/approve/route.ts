import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueRegistrationMail } from '@/lib/mailQueue';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id }
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: registration.eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found for this registration' }, { status: 404 });
    }

    // Update status to APPROVED if it's not already APPROVED
    let updatedRegistration = registration;
    if (registration.status !== 'APPROVED') {
      updatedRegistration = await prisma.registration.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      // Enqueue approval confirmation email via BullMQ Queue
      try {
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        await enqueueRegistrationMail({
          to: updatedRegistration.email,
          subject: `Registration Approved & Ticket Confirmed - ${event.title}`,
          event,
          registration: updatedRegistration,
          regType: 'CONFIRMED',
          originUrl: origin
        });
      } catch (mailError) {
        console.error('Failed to queue approval email (proceeding anyway):', mailError);
      }
    }

    return NextResponse.json({ success: true, registration: updatedRegistration });
  } catch (error: any) {
    console.error('Approve registration error:', error);
    return NextResponse.json({ error: 'Failed to approve registration: ' + error.message }, { status: 500 });
  }
}
