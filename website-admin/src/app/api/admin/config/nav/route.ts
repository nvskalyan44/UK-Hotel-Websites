export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get("site");

    const items = await prisma.navItem.findMany({
      where: site ? { site } : undefined,
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { site, href, label, icon, displayOrder } = body as {
      site: string;
      href: string;
      label: string;
      icon?: string;
      displayOrder?: number;
    };

    if (!site?.trim() || !href?.trim() || !label?.trim()) {
      return NextResponse.json({ error: "site, href, and label are required" }, { status: 400 });
    }

    let order = displayOrder;
    if (order === undefined) {
      const last = await prisma.navItem.findFirst({
        where: { site },
        orderBy: { displayOrder: "desc" },
        select: { displayOrder: true },
      });
      order = (last?.displayOrder ?? 0) + 1;
    }

    const item = await prisma.navItem.create({
      data: {
        site: site.trim(),
        href: href.trim(),
        label: label.trim(),
        icon: icon?.trim() ?? null,
        displayOrder: Number(order),
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
