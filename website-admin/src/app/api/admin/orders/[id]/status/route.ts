export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { status } = body as { status: string };

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.order.update({ where: { id }, data: { status } });

    await prisma.adminActivityLog.create({
      data: {
        action: "order_status",
        detail: `Order ${id} status → ${status} (via KDS)`,
        entityId: id,
      },
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
