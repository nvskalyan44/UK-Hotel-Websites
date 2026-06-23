export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  const { label, color, bg } = await req.json();
  try {
    const data: Record<string, unknown> = {};
    if (label !== undefined) data.label = label;
    if (color !== undefined) data.color = color;
    if (bg !== undefined) data.bg = bg;
    const status = await prisma.messageStatus.update({ where: { id: numId }, data });
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  try {
    await prisma.messageStatus.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
