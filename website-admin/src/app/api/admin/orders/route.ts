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
        lineItems: o.items.map((i) => ({ name: i.itemName, qty: i.quantity, price: i.unitPrice })),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        subtotal: o.subtotal,
        discount: o.discountAmount,
        paymentMethod: o.paymentMethod,
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

interface PosItem { id?: string; name: string; emoji?: string; price: number; qty: number; }

// Create a walk-in / till-counter order from the POS screen.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      items, orderType = "dine-in", paymentMethod = "cash",
      discount = 0, customerName, customerPhone, tableNumber, notes,
    } = body as {
      items: PosItem[]; orderType?: string; paymentMethod?: string;
      discount?: number; customerName?: string; customerPhone?: string;
      tableNumber?: string; notes?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const discountAmount = Math.min(Math.max(0, discount), subtotal);
    const total = Math.max(0, subtotal - discountAmount);

    const orderId = "POS-" + Math.floor(100000 + Math.random() * 900000);
    const name = customerName?.trim() || (tableNumber ? `Table ${tableNumber}` : "Walk-in");

    const order = await prisma.order.create({
      data: {
        id: orderId,
        orderType,
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod,
        subtotal,
        discountAmount,
        deliveryFee: 0,
        total,
        customerName: name,
        customerEmail: "pos@abhiruchi.local",
        customerPhone: customerPhone?.trim() || null,
        specialInstructions: [tableNumber ? `Table ${tableNumber}` : "", notes ?? ""].filter(Boolean).join(" · ") || null,
        adminNotes: "Created via POS",
        timePreference: "asap",
        items: {
          create: items.map((i) => ({
            menuItemId: i.id ?? null,
            itemName: i.name,
            itemEmoji: i.emoji ?? null,
            unitPrice: i.price,
            quantity: i.qty,
            lineTotal: i.price * i.qty,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ id: order.id, total: order.total });
  } catch (error) {
    console.error("[POS order]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
