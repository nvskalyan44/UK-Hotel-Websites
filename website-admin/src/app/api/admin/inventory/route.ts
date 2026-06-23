export const dynamic = "force-dynamic";
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

export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items.map(mapItem));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, category, stock, unit, minStock, maxStock } = body;

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = `${base}-${Date.now()}`;

  const item = await prisma.inventoryItem.create({
    data: {
      id,
      name,
      category: category || "General",
      currentStock: parseFloat(stock || 0),
      unit: unit || "kg",
      minStockLevel: parseFloat(minStock || 0),
      maxStockLevel: parseFloat(maxStock || 100),
    },
  });

  return NextResponse.json(mapItem(item));
}
