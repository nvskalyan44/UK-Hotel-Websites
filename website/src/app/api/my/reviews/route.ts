import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { orderId, rating, reviewText } = await req.json();
    if (!orderId || !rating || !reviewText?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    // Look up the order to get customer details
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const customer = await getSessionCustomer();

    const initials = order.customerName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    await prisma.review.create({
      data: {
        id: `REV-${Date.now()}`,
        customerId: customer?.id ?? order.customerId ?? null,
        customerName: order.customerName,
        avatarInitials: initials,
        rating,
        reviewText: reviewText.trim(),
        status: "pending",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
