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
      label?: string;
      href?: string;
      icon?: string | null;
      displayOrder?: number;
      isVisible?: boolean;
    } = {};
    if (body.label !== undefined) data.label = String(body.label).trim();
    if (body.href !== undefined) data.href = String(body.href).trim();
    if (body.icon !== undefined) data.icon = body.icon === null ? null : String(body.icon).trim();
    if (body.displayOrder !== undefined) data.displayOrder = Number(body.displayOrder);
    if (body.isVisible !== undefined) data.isVisible = Boolean(body.isVisible);

    const item = await prisma.navItem.update({ where: { id: Number(id) }, data });
    return NextResponse.json(item);
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
    await prisma.navItem.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
