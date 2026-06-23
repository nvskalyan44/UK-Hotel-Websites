export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

function mapReview(r: any) {
  return {
    id: r.id,
    customer: r.customerName,
    avatar: r.avatarInitials ?? r.customerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
    rating: r.rating,
    status: r.status,
    text: r.reviewText,
    date: timeAgo(new Date(r.createdAt)),
    item: r.menuItem?.name ?? "",
    helpful: r.helpfulCount,
  };
}

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: { menuItem: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews.map(mapReview));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
