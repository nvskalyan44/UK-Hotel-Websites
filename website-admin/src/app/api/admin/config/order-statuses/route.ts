export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const statuses = await prisma.orderStatus.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(statuses);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { value, label, color } = body;
  if (!value?.trim() || !label?.trim() || !color?.trim()) {
    return NextResponse.json({ error: "value, label and color are required" }, { status: 400 });
  }
  const max = await prisma.orderStatus.aggregate({ _max: { displayOrder: true } });
  const status = await prisma.orderStatus.create({
    data: {
      value: value.trim(),
      label: label.trim(),
      color: color.trim(),
      displayOrder: (max._max.displayOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(status);
}
