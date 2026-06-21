import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Try to get session customer — order is viewable by owner or publicly (no auth required)
    const customer = await getSessionCustomer().catch(() => null);
    if (customer && order.customerEmail !== customer.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      discount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      total: order.total,
      placedAt: order.placedAt,
      estimatedMinutes: order.estimatedMinutes,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      deliveryAddress: order.deliveryAddress,
      deliveryPostcode: order.deliveryPostcode,
      specialInstructions: order.specialInstructions,
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
