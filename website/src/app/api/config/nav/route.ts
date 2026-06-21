export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.navItem.findMany({
    where: { site: "customer", isVisible: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(items.map(n => ({ id: n.id, href: n.href, label: n.label, icon: n.icon })));
}
