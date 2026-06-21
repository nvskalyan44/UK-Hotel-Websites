export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(
      tiers.map((t) => ({
        id:        t.id,
        name:      t.name,
        minPoints: t.minPoints,
        maxPoints: t.maxPoints,
        color:     t.color,
        badge:     t.badge,
      }))
    );
  } catch (err) {
    console.error("[api/config/loyalty-tiers]", err);
    return NextResponse.json({ error: "Failed to load loyalty tiers" }, { status: 500 });
  }
}
