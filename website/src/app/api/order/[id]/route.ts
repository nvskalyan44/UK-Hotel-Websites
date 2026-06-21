import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      total: order.total,
      placedAt: order.placedAt,
      items: order.items.map((i) => ({
        name: i.itemName,
        emoji: i.itemEmoji ?? "🍛",
        qty: i.quantity,
        price: i.unitPrice,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
