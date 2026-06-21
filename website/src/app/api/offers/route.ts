export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = coupons.map((c) => ({
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
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
