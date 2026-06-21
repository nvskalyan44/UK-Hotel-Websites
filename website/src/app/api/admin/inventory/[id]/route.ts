import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.currentStock,
    unit: item.unit,
    minStock: item.minStockLevel,
    maxStock: item.maxStockLevel,
    lastUpdated: item.updatedAt.toISOString().split("T")[0],
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.stock !== undefined) data.currentStock = parseFloat(body.stock);
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.unit !== undefined) data.unit = body.unit;
  if (body.minStock !== undefined) data.minStockLevel = parseFloat(body.minStock);
  if (body.maxStock !== undefined) data.maxStockLevel = parseFloat(body.maxStock);

  const item = await prisma.inventoryItem.update({ where: { id }, data });
  return NextResponse.json(mapItem(item));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
