import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { code, eventId, originalPrice } = await request.json();

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 });
    }

    // Sanitize input code string (remove hidden unicode whitespace like \u202F, \u00A0, \u200B)
    const sanitizedInput = code
      .replace(/[\u200B-\u200D\uFEFF\u202F\u00A0\s]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .trim()
      .toUpperCase();

    if (!sanitizedInput) {
      return NextResponse.json({ error: 'Please enter a valid coupon code' }, { status: 400 });
    }

    // 1. Try finding coupon by exact / case-insensitive code
    let coupon = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: sanitizedInput,
          mode: 'insensitive',
        },
      },
    });

    // 2. Fallback check: If database has legacy coupons with hidden unicode spaces, match by sanitizing both sides
    if (!coupon) {
      const allCoupons = await prisma.coupon.findMany();
      coupon = allCoupons.find((c) => {
        const dbSanitized = c.code
          .replace(/[\u200B-\u200D\uFEFF\u202F\u00A0\s]/g, '')
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .trim()
          .toUpperCase();
        return dbSanitized === sanitizedInput;
      }) || null;
    }

    if (!coupon) {
      return NextResponse.json({ error: `Invalid coupon code '${sanitizedInput}'` }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: `Coupon code '${coupon.code}' is currently inactive` }, { status: 400 });
    }

    // Check event constraint
    if (coupon.eventId && eventId && coupon.eventId !== eventId) {
      return NextResponse.json({ error: `Coupon '${coupon.code}' is not applicable for this event` }, { status: 400 });
    }

    // Check expiration date
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: `Coupon '${coupon.code}' has expired` }, { status: 400 });
    }

    // Check max usages limit
    if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: `Coupon '${coupon.code}' has reached its maximum redemption limit` }, { status: 400 });
    }

    // Calculate numeric original price
    const basePrice = typeof originalPrice === 'number' 
      ? originalPrice 
      : parseFloat(String(originalPrice).replace(/[^0-9.]/g, '')) || 0;

    if (coupon.minOrderAmount && basePrice < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `Coupon '${coupon.code}' requires a minimum order amount of ₹${coupon.minOrderAmount}`
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (basePrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount does not exceed original price
    discountAmount = Math.min(basePrice, discountAmount);
    const finalPriceNumber = Math.max(0, basePrice - discountAmount);

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100,
      originalPrice: basePrice,
      finalPrice: Math.round(finalPriceNumber * 100) / 100,
      isFree: finalPriceNumber === 0,
      message: coupon.discountType === 'PERCENTAGE'
        ? `Applied ${coupon.discountValue}% OFF discount!`
        : `Applied ₹${coupon.discountValue} OFF discount!`,
    });
  } catch (error) {
    console.error('Failed to apply coupon:', error);
    return NextResponse.json({ error: 'Failed to validate coupon code' }, { status: 500 });
  }
}
