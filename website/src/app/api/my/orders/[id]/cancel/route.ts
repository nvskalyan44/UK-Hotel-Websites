import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "cancelled") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    if (!["pending", "confirmed"].includes(order.status))
      return NextResponse.json({ error: "Order cannot be cancelled at this stage" }, { status: 400 });

    const ageMs = Date.now() - new Date(order.placedAt).getTime();
    if (ageMs > 15 * 60 * 1000)
      return NextResponse.json({ error: "Cancellation window has passed (15 minutes)" }, { status: 400 });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ status: updated.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
