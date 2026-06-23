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
    const data: { name?: string; displayOrder?: number } = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.displayOrder !== undefined) data.displayOrder = Number(body.displayOrder);

    const allergen = await prisma.allergenType.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(allergen);
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
    await prisma.allergenType.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
