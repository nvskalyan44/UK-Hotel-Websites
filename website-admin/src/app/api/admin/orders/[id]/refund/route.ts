export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { refundAmount, refundReason } = body as { refundAmount: number; refundReason: string };

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (typeof refundAmount !== "number" || refundAmount <= 0) {
      return NextResponse.json({ error: "Refund amount must be greater than 0" }, { status: 400 });
    }
    if (refundAmount > order.total) {
      return NextResponse.json({ error: "Refund amount cannot exceed order total" }, { status: 400 });
    }

    const isFullRefund = refundAmount >= order.total;
    const paymentStatus = isFullRefund ? "refunded" : "partial-refund";

    const updated = await prisma.order.update({
      where: { id },
      data: {
        refundAmount,
        refundReason: refundReason ?? "",
        refundedAt: new Date(),
        paymentStatus,
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        action: "order_refund",
        detail: `Order ${id} refunded £${refundAmount.toFixed(2)}${refundReason ? ` — ${refundReason}` : ""} (${paymentStatus})`,
        entityId: id,
      },
    });

    return NextResponse.json({
      ok: true,
      refundAmount: updated.refundAmount,
      refundReason: updated.refundReason,
      refundedAt: updated.refundedAt,
      paymentStatus: updated.paymentStatus,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
