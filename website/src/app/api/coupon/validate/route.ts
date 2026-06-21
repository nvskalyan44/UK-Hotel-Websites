import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal, email, itemIds, orderType } = body as {
      code: string;
      subtotal: number;
      email?: string;
      itemIds?: string[];
      orderType?: string;
    };

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Coupon not recognised" });
    }

    const now = new Date();

    if (coupon.startsAt && now < coupon.startsAt) {
      return NextResponse.json({ valid: false, error: "This coupon is not yet active" });
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    // Eligibility checks (who can use it) — must come before order-amount checks
    // so the customer gets the real reason, not a misleading "min order" message.

    if (coupon.firstOrderOnly && email) {
      const customer = await prisma.customer.findUnique({
        where: { email },
        select: { totalOrders: true },
      });
      if (customer && customer.totalOrders > 0) {
        return NextResponse.json({ valid: false, error: "This coupon is for first-time customers only" });
      }
    }

    if (coupon.usageLimitPerUser && email) {
      const customer = await prisma.customer.findUnique({
        where: { email },
        select: { id: true },
      });
      if (customer) {
        const usageCount = await prisma.couponRedemption.count({
          where: {
            couponId: coupon.id,
            order: { customerId: customer.id },
          },
        });
        if (usageCount >= coupon.usageLimitPerUser) {
          return NextResponse.json({ valid: false, error: "You have already used this coupon the maximum number of times" });
        }
      }
    }

    if (coupon.orderType && orderType && coupon.orderType !== orderType) {
      const label = coupon.orderType === "delivery" ? "delivery" : "collection";
      return NextResponse.json({ valid: false, error: `This coupon is only valid for ${label} orders` });
    }

    if (coupon.maxUses != null && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its limit" });
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order of £${coupon.minOrderAmount.toFixed(2)} required`,
      });
    }

    const applicableItems: string[] = JSON.parse(coupon.applicableItems || "[]");
    const applicableCategories: string[] = JSON.parse(coupon.applicableCategories || "[]");

    if ((applicableItems.length > 0 || applicableCategories.length > 0) && itemIds && itemIds.length > 0) {
      const cartMenuItems = await prisma.menuItem.findMany({
        where: { id: { in: itemIds } },
        include: { category: { select: { name: true } } },
      });

      const hasMatch = cartMenuItems.some(
        (item) =>
          (applicableItems.length > 0 && applicableItems.includes(item.id)) ||
          (applicableCategories.length > 0 && applicableCategories.includes(item.category.name))
      );

      if (!hasMatch) {
        return NextResponse.json({ valid: false, error: "This coupon is not valid for items in your basket" });
      }
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      title: coupon.title,
      type: coupon.discountType === "fixed" ? "flat" : "percent",
      discount: coupon.discountValue,
      minOrder: coupon.minOrderAmount,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
