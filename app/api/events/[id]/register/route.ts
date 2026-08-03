import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEventMail } from '@/lib/mail';

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
      paymentTxnId,
      turnstileToken
    } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Fetch event for title and approval requirement
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if already registered
    const existing = await prisma.registration.findFirst({
      where: { eventId, email },
    });
    if (existing) {
      return NextResponse.json({ success: true, registration: existing, alreadyRegistered: true });
    }

    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || process.env.NODE_ENV === 'development';

    if (!isLocalhost) {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Please complete the security verification check' }, { status: 400 });
      }

      // Verify Cloudflare Turnstile token
      const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const verifyRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
      }
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

    // Send registration email
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    if (status === 'PENDING') {
      await sendEventMail({
        to: email,
        subject: `Registration Pending Approval - ${event.title}`,
        event,
        registration,
        type: 'PENDING',
        originUrl: origin
      });
    } else {
      await sendEventMail({
        to: email,
        subject: `Registration Confirmed - ${event.title}`,
        event,
        registration,
        type: 'CONFIRMED',
        originUrl: origin
      });
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
