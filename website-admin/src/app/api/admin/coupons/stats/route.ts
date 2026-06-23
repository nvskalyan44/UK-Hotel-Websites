export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const redemptions = await prisma.couponRedemption.groupBy({
      by: ["couponId"],
      _count: { id: true },
      _sum: { discountApplied: true },
    });

    const stats: Record<number, { uses: number; totalDiscount: number }> = {};
    for (const r of redemptions) {
      stats[r.couponId] = {
        uses: r._count.id,
        totalDiscount: r._sum.discountApplied ?? 0,
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
