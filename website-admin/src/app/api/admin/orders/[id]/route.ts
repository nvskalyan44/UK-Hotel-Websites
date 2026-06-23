export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStatusUpdate } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;
    if (body.estimatedMinutes !== undefined) data.estimatedMinutes = body.estimatedMinutes;

    const order = await prisma.order.update({ where: { id }, data, select: {
      id: true,
      status: true,
      customerEmail: true,
      customerName: true,
      estimatedMinutes: true,
    }});

    if (body.status !== undefined) {
      await prisma.adminActivityLog.create({
        data: { action: "order_status", detail: `Order ${id} status → ${body.status}`, entityId: id },
      });

      // Send status email non-blocking
      sendStatusUpdate({
        id: order.id,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: order.status,
        estimatedMinutes: order.estimatedMinutes,
      }).catch((err) => console.error("[email] sendStatusUpdate failed:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
