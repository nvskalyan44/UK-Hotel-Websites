export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [rows, hours] = await Promise.all([
      prisma.siteSetting.findMany(),
      prisma.openingHours.findMany({
        orderBy: { displayOrder: "asc" },
        select: { id: true, dayLabel: true, timeLabel: true, displayOrder: true, isOpen: true },
      }),
    ]);

    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;

    return NextResponse.json({ ...settings, hours });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updates = body as { key: string; value: string }[];

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Body must be an array of { key, value }" }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ key, value }) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
