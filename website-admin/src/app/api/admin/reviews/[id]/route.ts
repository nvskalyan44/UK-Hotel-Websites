export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const data: any = {};
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "published") data.publishedAt = new Date();
    }
    const review = await prisma.review.update({
      where: { id },
      data,
      include: { menuItem: { select: { name: true } } },
    });

    if (body.status !== undefined) {
      await prisma.adminActivityLog.create({
        data: { action: "review_status", detail: `Review ${id} → ${body.status}`, entityId: id },
      });
    }

    return NextResponse.json({ ok: true, status: review.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
