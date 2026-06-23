export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapCoupon(c: any) {
  return {
    id: String(c.id),
    code: c.code,
    title: c.title,
    type: c.discountType === "fixed" ? "flat" : "percent",
    discount: c.discountValue,
    minOrder: c.minOrderAmount,
    maxUses: c.maxUses ?? undefined,
    uses: c.currentUses,
    active: c.isActive,
    expiry: c.expiresAt ? c.expiresAt.toISOString().split("T")[0] : "",
    startsAt: c.startsAt ? c.startsAt.toISOString().split("T")[0] : "",
    firstOrderOnly: c.firstOrderOnly ?? false,
    usageLimitPerUser: c.usageLimitPerUser ?? undefined,
    applicableCategories: JSON.parse(c.applicableCategories || "[]"),
    applicableItems: JSON.parse(c.applicableItems || "[]"),
    orderType: c.orderType ?? "",
  };
}

export async function GET() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons.map(mapCoupon));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { code, title, type, discount, minOrder, maxUses, expiry } = body;

  const { startsAt, firstOrderOnly, usageLimitPerUser, applicableCategories, applicableItems, orderType } = body;

  const coupon = await prisma.coupon.create({
    data: {
      code: (code as string).toUpperCase(),
      title,
      discountType: type === "flat" ? "fixed" : "percent",
      discountValue: parseFloat(discount || 0),
      minOrderAmount: parseFloat(minOrder || 0),
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiresAt: expiry ? new Date(expiry) : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      firstOrderOnly: firstOrderOnly === true,
      usageLimitPerUser: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
      applicableCategories: JSON.stringify(applicableCategories ?? []),
      applicableItems: JSON.stringify(applicableItems ?? []),
      orderType: orderType || null,
    },
  });

  return NextResponse.json(mapCoupon(coupon));
}
