import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

export async function GET() {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const favs = await prisma.favourite.findMany({
      where: { customerId: customer.id },
      select: { menuItemId: true },
    });

    return NextResponse.json({ menuItemIds: favs.map((f) => f.menuItemId) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { menuItemId } = await req.json();
    if (!menuItemId) return NextResponse.json({ error: "menuItemId required" }, { status: 400 });

    const existing = await prisma.favourite.findUnique({
      where: { customerId_menuItemId: { customerId: customer.id, menuItemId } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favourited: false });
    } else {
      await prisma.favourite.create({
        data: { customerId: customer.id, menuItemId },
      });
      return NextResponse.json({ favourited: true });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
