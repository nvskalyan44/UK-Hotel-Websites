export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

function mapCombo(c: { id: string; name: string; description: string | null; price: number; items: string; isAvailable: boolean; image: string | null; createdAt: Date; updatedAt: Date }) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    price: c.price,
    items: JSON.parse(c.items) as { id: string; name: string; emoji: string; qty: number }[],
    isAvailable: c.isAvailable,
    image: c.image,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export async function GET() {
  const combos = await prisma.combo.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(combos.map(mapCombo));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, price, items, isAvailable, image } = body;
  if (!name?.trim() || price == null) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }
  const combo = await prisma.combo.create({
    data: {
      id: nanoid(12),
      name: name.trim(),
      description: description?.trim() || null,
      price: parseFloat(price),
      items: JSON.stringify(Array.isArray(items) ? items : []),
      isAvailable: isAvailable !== false,
      image: image || null,
    },
  });
  return NextResponse.json(mapCombo(combo));
}
