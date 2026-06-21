export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json(
      reviews.map((r) => ({
        name: r.customerName,
        rating: r.rating,
        text: r.reviewText,
        role: "Verified customer",
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
