export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { select: { itemName: true, quantity: true, unitPrice: true, itemEmoji: true } } },
      orderBy: { placedAt: "desc" },
    });

    const mapped = orders.map((o) => {
      const itemSummary = o.items.map((i) => `${i.itemEmoji ?? ""} ${i.itemName} ×${i.quantity}`).join(", ");
      const placed = new Date(o.placedAt);
      return {
        id: o.id,
        customer: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone ?? "",
        items: itemSummary,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        total: o.total,
        payment: o.paymentStatus,
        status: o.status,
        type: o.orderType,
        address: o.deliveryAddress ? `${o.deliveryAddress}, ${o.deliveryPostcode ?? ""}`.trim().replace(/,$/, "") : "Collection",
        time: formatTime(placed),
        date: formatDate(placed),
        adminNotes: o.adminNotes ?? "",
        specialInstructions: o.specialInstructions ?? "",
        refundAmount: o.refundAmount ?? null,
        refundReason: o.refundReason ?? null,
        refundedAt: o.refundedAt ? o.refundedAt.toISOString() : null,
        placedAt: o.placedAt.toISOString(),
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
