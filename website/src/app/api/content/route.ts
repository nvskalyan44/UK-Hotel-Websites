export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const blocks = await prisma.contentBlock.findMany();
  const map: Record<string, string> = {};
  for (const b of blocks) map[b.id] = b.value;
  return NextResponse.json(map);
}
