export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slots = await prisma.reservationTimeSlot.findMany({
      where: { isAvailable: true },
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(slots.map((s) => ({ id: s.id, time: s.time })));
  } catch (err) {
    console.error("[api/config/time-slots]", err);
    return NextResponse.json({ error: "Failed to load time slots" }, { status: 500 });
  }
}
