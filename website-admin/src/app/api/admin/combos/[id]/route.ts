export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, price, items, isAvailable, image } = body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (price !== undefined) updateData.price = parseFloat(price);
  if (items !== undefined) updateData.items = JSON.stringify(Array.isArray(items) ? items : []);
  if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
  if (image !== undefined) updateData.image = image || null;
  const combo = await prisma.combo.update({ where: { id }, data: updateData });
  return NextResponse.json(mapCombo(combo));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.combo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
