export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  try {
    const body = await req.json();
    const data: {
      pointThreshold?: number;
      rewardName?: string;
      emoji?: string;
      isActive?: boolean;
    } = {};
    if (body.pointThreshold !== undefined) data.pointThreshold = Number(body.pointThreshold);
    if (body.rewardName !== undefined) data.rewardName = String(body.rewardName).trim();
    if (body.emoji !== undefined && body.emoji !== null) data.emoji = String(body.emoji).trim();
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const reward = await prisma.loyaltyReward.update({ where: { id: numId }, data });
    return NextResponse.json(reward);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  try {
    await prisma.loyaltyReward.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
