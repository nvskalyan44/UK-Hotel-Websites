export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.eventType.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(types.map((t) => ({ id: t.id, name: t.name })));
  } catch (err) {
    console.error("[api/config/event-types]", err);
    return NextResponse.json({ error: "Failed to load event types" }, { status: 500 });
  }
}
