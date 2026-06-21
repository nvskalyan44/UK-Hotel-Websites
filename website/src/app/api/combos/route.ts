export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const combos = await prisma.combo.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(
    combos.map((c: { id: string; name: string; description: string | null; price: number; items: string; isAvailable: boolean; image: string | null; createdAt: Date; updatedAt: Date }) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price: c.price,
      items: JSON.parse(c.items) as { id: string; name: string; emoji: string; qty: number }[],
      image: c.image,
    }))
  );
}
