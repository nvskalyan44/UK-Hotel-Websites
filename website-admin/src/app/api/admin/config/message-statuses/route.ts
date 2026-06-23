export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const statuses = await prisma.messageStatus.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(statuses);
}

export async function POST(req: Request) {
  const { value, label, color, bg } = await req.json();
  if (!value?.trim() || !label?.trim() || !color?.trim() || !bg?.trim())
    return NextResponse.json({ error: "value, label, color and bg are required" }, { status: 400 });
  const max = await prisma.messageStatus.aggregate({ _max: { displayOrder: true } });
  const status = await prisma.messageStatus.create({
    data: { value: value.trim(), label: label.trim(), color: color.trim(), bg: bg.trim(), displayOrder: (max._max.displayOrder ?? 0) + 1 },
  });
  return NextResponse.json(status);
}
