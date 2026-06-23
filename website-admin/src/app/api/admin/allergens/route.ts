export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const allergens = await prisma.allergenType.findMany({
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, displayOrder: true },
    });
    return NextResponse.json(allergens);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body as { name: string };
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const last = await prisma.allergenType.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const displayOrder = (last?.displayOrder ?? 0) + 1;

    const allergen = await prisma.allergenType.create({
      data: { name: name.trim(), displayOrder },
    });
    return NextResponse.json(allergen, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
