export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const segments = await prisma.campaignSegment.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(segments);
}

export async function POST(req: Request) {
  const { value, label, description } = await req.json();
  if (!value?.trim() || !label?.trim())
    return NextResponse.json({ error: "value and label are required" }, { status: 400 });
  const max = await prisma.campaignSegment.aggregate({ _max: { displayOrder: true } });
  const segment = await prisma.campaignSegment.create({
    data: {
      value: value.trim(),
      label: label.trim(),
      description: description?.trim() ?? null,
      displayOrder: (max._max.displayOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(segment);
}
