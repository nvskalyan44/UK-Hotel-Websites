export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { joinedAt: "desc" },
    });

    const mapped = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      orders: c.totalOrders,
      spent: c.totalSpent,
      points: c.loyaltyPoints,
      status: c.status,
      joined: new Date(c.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      lastOrder: c.lastOrderAt
        ? new Date(c.lastOrderAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "Never",
      notes: c.notes ?? "",
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
