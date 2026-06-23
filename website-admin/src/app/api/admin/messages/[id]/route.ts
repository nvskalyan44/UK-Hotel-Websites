export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (body.status !== undefined) data.status = body.status;
  if (body.replyText !== undefined) {
    data.replyText = body.replyText;
    data.repliedAt = new Date();
    data.status = "replied";
  }

  const msg = await prisma.contactMessage.update({
    where: { id: parseInt(id) },
    data,
  });

  return NextResponse.json(msg);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contactMessage.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
