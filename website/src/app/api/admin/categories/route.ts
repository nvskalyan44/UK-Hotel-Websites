export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cats = await prisma.menuCategory.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(cats.map((c) => c.name));
}
