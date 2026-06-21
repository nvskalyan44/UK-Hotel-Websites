import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    desc: item.description ?? "",
    price: item.price,
    category: item.category.name,
    veg: item.isVegetarian,
    emoji: item.emoji ?? "🍛",
    popular: item.isPopular,
    hero: item.isHero,
    available: item.isAvailable,
    availabilityType: item.availabilityType ?? "both",
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.desc !== undefined) data.description = body.desc;
  if (body.price !== undefined) data.price = parseFloat(body.price);
  if (body.emoji !== undefined) data.emoji = body.emoji;
  if (body.veg !== undefined) data.isVegetarian = body.veg === "veg";
  if (body.available !== undefined) data.isAvailable = body.available;
  if (body.availabilityType !== undefined) data.availabilityType = body.availabilityType;

  if (body.category !== undefined) {
    const cat = await prisma.menuCategory.findFirst({ where: { name: body.category } });
    if (cat) data.categoryId = cat.id;
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data,
    include: { category: { select: { name: true } } },
  });

  return NextResponse.json(mapItem(item));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
