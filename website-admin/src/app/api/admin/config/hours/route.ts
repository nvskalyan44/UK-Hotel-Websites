export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hours = await prisma.openingHours.findMany({
      orderBy: { displayOrder: "asc" },
      select: { id: true, dayLabel: true, timeLabel: true, displayOrder: true, isOpen: true },
    });
    return NextResponse.json(hours);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dayLabel, timeLabel, isOpen } = body as {
      dayLabel: string;
      timeLabel: string;
      isOpen?: boolean;
    };

    if (!dayLabel?.trim() || !timeLabel?.trim()) {
      return NextResponse.json({ error: "dayLabel and timeLabel are required" }, { status: 400 });
    }

    const last = await prisma.openingHours.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const displayOrder = (last?.displayOrder ?? 0) + 1;

    const entry = await prisma.openingHours.create({
      data: {
        dayLabel: dayLabel.trim(),
        timeLabel: timeLabel.trim(),
        isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
        displayOrder,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
