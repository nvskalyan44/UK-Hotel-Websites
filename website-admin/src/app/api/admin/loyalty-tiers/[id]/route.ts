export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: {
      name?: string;
      minPoints?: number;
      maxPoints?: number | null;
      color?: string;
      badge?: string;
      displayOrder?: number;
    } = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.minPoints !== undefined) data.minPoints = Number(body.minPoints);
    if (body.maxPoints !== undefined) data.maxPoints = body.maxPoints === null ? null : Number(body.maxPoints);
    if (body.color !== undefined) data.color = String(body.color).trim();
    if (body.badge !== undefined) data.badge = String(body.badge).trim();
    if (body.displayOrder !== undefined) data.displayOrder = Number(body.displayOrder);

    const tier = await prisma.loyaltyTier.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(tier);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.loyaltyTier.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
