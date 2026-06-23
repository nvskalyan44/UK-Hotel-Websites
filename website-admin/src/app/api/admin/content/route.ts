export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const blocks = await prisma.contentBlock.findMany({
      orderBy: { id: "asc" },
      select: { id: true, label: true, value: true },
    });
    return NextResponse.json(blocks);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const updates: { id: string; value: string }[] = await req.json();
    await Promise.all(
      updates.map((u) =>
        prisma.contentBlock.update({ where: { id: u.id }, data: { value: u.value } })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
