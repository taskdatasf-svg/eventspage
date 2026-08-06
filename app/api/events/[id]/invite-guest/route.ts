import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGuestInviteMail } from '@/lib/guestInviteMail';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const { guestName, guestEmail, guestRole, personalMessage } = await request.json();

    if (!guestName || !guestEmail) {
      return NextResponse.json({ error: 'Guest name and email are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if guest is already registered
    const existing = await prisma.registration.findFirst({
      where: { eventId, email: guestEmail },
    });

    let registration = existing;

    if (!registration) {
      // Generate unique VIP ticket code
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ticketCode = `TKT-VIP-${randomPart}`;
      const roleText = guestRole || 'VIP Guest';

      registration = await prisma.registration.create({
        data: {
          eventId,
          eventTitle: event.title,
          name: guestName,
          email: guestEmail,
          phone: null,
          ticketCode,
          answers: JSON.stringify({ 'Guest Role': roleText }),
          paymentAccountName: 'VIP Complimentary Pass',
          paymentMethod: 'VIP PASS',
          paymentTxnId: 'FREE-VIP',
          status: 'APPROVED', // VIP Guest & Speaker tickets are automatically free & approved
        },
      });
    }

    const originUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Dispatch Guest / Speaker Invitation Email with attached VIP PDF Ticket Pass
    let mailResult = { success: true };
    try {
      mailResult = await sendGuestInviteMail({
        to: guestEmail,
        guestName,
        guestRole: guestRole || 'VIP Guest',
        personalMessage: personalMessage || null,
        event,
        registration,
        originUrl,
      });
    } catch (mailErr) {
      console.error('Failed to send guest invite mail:', mailErr);
    }

    return NextResponse.json({
      success: true,
      registration,
      ticketCode: registration.ticketCode,
      inviteUrl: `${originUrl}/events/${eventId}/register?guestInvite=true&ticketCode=${registration.ticketCode}`,
      mailSent: mailResult.success,
    });
  } catch (error: any) {
    console.error('Invite guest error:', error);
    return NextResponse.json({ error: 'Failed to send guest invitation: ' + error.message }, { status: 500 });
  }
}
