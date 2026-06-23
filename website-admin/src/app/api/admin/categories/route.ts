export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cats = await prisma.menuCategory.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  try {
    const { name, displayOrder } = await req.json() as { name: string; displayOrder?: number };
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const agg = await prisma.menuCategory.aggregate({ _max: { displayOrder: true } });
    const cat = await prisma.menuCategory.create({
      data: { name: name.trim(), displayOrder: displayOrder ?? (agg._max.displayOrder ?? 0) + 1 },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json() as { id: number };
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0)
      return NextResponse.json({ error: `Cannot delete — ${itemCount} items use this category` }, { status: 400 });
    await prisma.menuCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, name, displayOrder } = await req.json() as { id: number; name?: string; displayOrder?: number };
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    const cat = await prisma.menuCategory.update({ where: { id }, data });
    return NextResponse.json(cat);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
