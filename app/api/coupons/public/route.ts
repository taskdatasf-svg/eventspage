import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const where: any = {
      isActive: true,
    };

    if (eventId) {
      where.OR = [
        { eventId },
        { eventId: null },
        { eventId: '' }
      ];
    }

    const coupons = await prisma.coupon.findMany({
      where,
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        eventId: true,
        eventTitle: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out expired or exhausted coupons
    const validCoupons = coupons.filter((c) => {
      const isExpired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
      const isExhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
      return !isExpired && !isExhausted;
    });

    return NextResponse.json({ coupons: validCoupons });
  } catch (error) {
    console.error('Failed to fetch public coupons:', error);
    return NextResponse.json({ coupons: [] });
  }
}
