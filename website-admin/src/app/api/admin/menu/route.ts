export const dynamic = "force-dynamic";
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
    allergens: (() => { try { return JSON.parse(item.allergens ?? "[]"); } catch { return []; } })(),
    variants: (() => { try { return JSON.parse(item.variants ?? "[]"); } catch { return []; } })(),
    image: item.image ?? null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("categories") === "1") {
    const cats = await prisma.menuCategory.findMany({ orderBy: { displayOrder: "asc" } });
    return NextResponse.json(cats);
  }

  const items = await prisma.menuItem.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(items.map(mapItem));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, desc, price, category, emoji, veg, allergens, variants } = body;

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
      allergens: JSON.stringify(Array.isArray(allergens) ? allergens : []),
      variants: JSON.stringify(Array.isArray(variants) ? variants : []),
    },
    include: { category: { select: { name: true } } },
  });

  return NextResponse.json(mapItem(item));
}
