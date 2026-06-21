export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      include: {
        category: { select: { name: true } },
        reviews: {
          where: { status: "published" },
          select: { rating: true },
        },
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }],
    });

    // Filter by availabilityType if the field exists on the item
    const filtered = items.filter((item: any) => {
      if ("availabilityType" in item) {
        return item.availabilityType === "delivery" || item.availabilityType === "both";
      }
      // Field doesn't exist yet — include all available items by default
      return true;
    });

    const mapped = filtered.map((item: any) => {
      const publishedReviews: { rating: number }[] = item.reviews ?? [];
      const reviewCount = publishedReviews.length;
      const avgRating =
        reviewCount > 0
          ? Math.round((publishedReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviewCount) * 10) / 10
          : undefined;

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
        avgRating,
        reviewCount,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
