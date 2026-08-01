import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Fetch event for title
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

    // Generate unique ticket code
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ticketCode = `TKT-${randomPart}`;

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
        paymentTxnId: paymentTxnId || null
      },
    });

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
