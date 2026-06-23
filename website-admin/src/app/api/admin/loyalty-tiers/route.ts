export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(tiers);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, minPoints, maxPoints, color, badge } = body as {
      name: string;
      minPoints: number;
      maxPoints?: number;
      color: string;
      badge: string;
    };

    if (!name?.trim() || minPoints === undefined || !color?.trim() || !badge?.trim()) {
      return NextResponse.json({ error: "name, minPoints, color, and badge are required" }, { status: 400 });
    }

    const last = await prisma.loyaltyTier.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const displayOrder = (last?.displayOrder ?? 0) + 1;

    const tier = await prisma.loyaltyTier.create({
      data: {
        name: name.trim(),
        minPoints: Number(minPoints),
        maxPoints: maxPoints !== undefined ? Number(maxPoints) : null,
        color: color.trim(),
        badge: badge.trim(),
        displayOrder,
      },
    });
    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
