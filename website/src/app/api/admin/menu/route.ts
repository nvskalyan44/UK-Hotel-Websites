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

export async function GET() {
  const items = await prisma.menuItem.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(items.map(mapItem));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, desc, price, category, emoji, veg } = body;

  const cat = await prisma.menuCategory.findFirst({ where: { name: category } });
  if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 });

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = `${base}-${Date.now()}`;

  const item = await prisma.menuItem.create({
    data: {
      id,
      name,
      description: desc,
      price: parseFloat(price),
      categoryId: cat.id,
      emoji: emoji || "🍛",
      isVegetarian: veg === "veg",
      availabilityType: body.availabilityType ?? "both",
    },
    include: { category: { select: { name: true } } },
  });

  return NextResponse.json(mapItem(item));
}
