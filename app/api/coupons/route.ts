import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const organizerEmail = searchParams.get('organizerEmail');

    const where: any = {};
    if (eventId) {
      where.OR = [
        { eventId },
        { eventId: null },
        { eventId: '' }
      ];
    }
    if (organizerEmail) {
      where.organizerEmail = organizerEmail;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      eventId,
      eventTitle,
      discountType = 'PERCENTAGE',
      discountValue,
      maxUses,
      minOrderAmount,
      expiresAt,
      organizerEmail,
    } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3) {
      return NextResponse.json({ error: 'Coupon code must be at least 3 characters long' }, { status: 400 });
    }

    const parsedDiscount = parseFloat(discountValue);
    if (isNaN(parsedDiscount) || parsedDiscount <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 });
    }

    if (discountType === 'PERCENTAGE' && parsedDiscount > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ error: `Coupon code '${cleanCode}' already exists.` }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        eventId: eventId || null,
        eventTitle: eventTitle || 'All Events',
        discountType,
        discountValue: parsedDiscount,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        organizerEmail: organizerEmail || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}
