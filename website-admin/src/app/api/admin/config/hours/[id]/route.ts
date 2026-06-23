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
    const data: { dayLabel?: string; timeLabel?: string; isOpen?: boolean } = {};
    if (body.dayLabel !== undefined) data.dayLabel = String(body.dayLabel).trim();
    if (body.timeLabel !== undefined) data.timeLabel = String(body.timeLabel).trim();
    if (body.isOpen !== undefined) data.isOpen = Boolean(body.isOpen);

    const entry = await prisma.openingHours.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(entry);
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
    await prisma.openingHours.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
