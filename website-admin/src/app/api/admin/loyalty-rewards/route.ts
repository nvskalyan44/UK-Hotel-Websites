export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(rewards);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pointThreshold, rewardName, emoji } = body as {
      pointThreshold: number;
      rewardName: string;
      emoji?: string;
    };

    if (pointThreshold === undefined || !rewardName?.trim()) {
      return NextResponse.json({ error: "pointThreshold and rewardName are required" }, { status: 400 });
    }

    const last = await prisma.loyaltyReward.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const displayOrder = (last?.displayOrder ?? 0) + 1;

    const reward = await prisma.loyaltyReward.create({
      data: {
        pointThreshold: Number(pointThreshold),
        rewardName: rewardName.trim(),
        ...(emoji !== undefined ? { emoji: emoji.trim() } : {}),
        displayOrder,
      },
    });
    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
