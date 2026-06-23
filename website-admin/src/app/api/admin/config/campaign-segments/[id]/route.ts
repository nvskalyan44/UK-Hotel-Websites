export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  const { label, description, isActive } = await req.json();
  try {
    const data: Record<string, unknown> = {};
    if (label !== undefined) data.label = label;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;
    const segment = await prisma.campaignSegment.update({ where: { id: numId }, data });
    return NextResponse.json(segment);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  try {
    await prisma.campaignSegment.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
