import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueRegistrationMail } from '@/lib/mailQueue';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const {
      name,
      email,
      phone,
      answers,
      paymentAccountName,
      paymentMethod,
      paymentTxnId
    } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
    }

    // Fetch event for title and approval requirement
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const cleanPrice = event.price.trim().toLowerCase();
    const isFree = cleanPrice === 'free' || cleanPrice === '0' || cleanPrice === '0.00' || cleanPrice === 'free entry';

    if (!isFree) {
      // Validate payment fields using regular expressions
      if (!paymentAccountName || !paymentMethod || !paymentTxnId) {
        return NextResponse.json({ error: 'All payment confirmation fields are required' }, { status: 400 });
      }

      const accountNameRegex = /^[a-zA-Z0-9\s.\-]{3,50}$/;
      if (!accountNameRegex.test(paymentAccountName)) {
        return NextResponse.json({ error: 'Payment Account Name must be 3-50 characters, containing only letters, numbers, spaces, dots, or hyphens' }, { status: 400 });
      }

      const txnIdRegex = /^(\d{12}|[a-zA-Z0-9]{8,24})$/;
      if (!txnIdRegex.test(paymentTxnId)) {
        return NextResponse.json({ error: 'Transaction ID must be a valid 12-digit UPI reference or an 8-24 character alphanumeric transaction ID' }, { status: 400 });
      }

      const validMethods = ['UPI', 'GPAY', 'PHONEPE', 'PAYTM', 'OTHER'];
      if (!validMethods.includes(paymentMethod.toUpperCase())) {
        return NextResponse.json({ error: 'Invalid payment method selected' }, { status: 400 });
      }
    }

    // Check if already registered
    const existing = await prisma.registration.findFirst({
      where: { eventId, email },
    });
    if (existing) {
      return NextResponse.json({ success: true, registration: existing, alreadyRegistered: true });
    }

    // Generate unique ticket code
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ticketCode = `TKT-${randomPart}`;

    const status = event.requireApproval ? 'PENDING' : 'APPROVED';

    const registration = await prisma.registration.create({
      data: {
        eventId,
        eventTitle: event.title,
        name,
        email,
        phone: phone || null,
        ticketCode,
        answers: answers ? JSON.stringify(answers) : null,
        paymentAccountName: paymentAccountName || null,
        paymentMethod: paymentMethod || null,
        paymentTxnId: paymentTxnId || null,
        status
      },
    });

    // Send registration email via BullMQ Queue (resilient against Resend daily quota limits)
    try {
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      if (status === 'PENDING') {
        await enqueueRegistrationMail({
          to: email,
          subject: `Registration Pending Approval - ${event.title}`,
          event,
          registration,
          regType: 'PENDING',
          originUrl: origin
        });
      } else {
        await enqueueRegistrationMail({
          to: email,
          subject: `Registration Confirmed - ${event.title}`,
          event,
          registration,
          regType: 'CONFIRMED',
          originUrl: origin
        });
      }
    } catch (mailError) {
      console.error('Failed to queue registration email (proceeding anyway):', mailError);
    }

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ registrations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}
