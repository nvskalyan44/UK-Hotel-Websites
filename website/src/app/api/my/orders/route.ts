import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

export async function GET() {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { customerEmail: customer.email },
      include: { items: true },
      orderBy: { placedAt: "desc" },
    });

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        orderType: o.orderType,
        paymentMethod: o.paymentMethod,
        subtotal: o.subtotal,
        discount: o.discountAmount,
        deliveryFee: o.deliveryFee,
        total: o.total,
        placedAt: o.placedAt,
        items: o.items.map((i) => ({
          name: i.itemName,
          emoji: i.itemEmoji ?? "🍛",
          qty: i.quantity,
          price: i.unitPrice,
        })),
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
