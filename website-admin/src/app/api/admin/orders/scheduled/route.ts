export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam   = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const to = toParam ? new Date(toParam) : (() => {
    const d = new Date(from);
    d.setDate(d.getDate() + 7);
    return d;
  })();

  try {
    // Scheduled orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        timePreference: "scheduled",
        scheduledTime: { gte: from, lte: to },
      },
      include: { items: true },
      orderBy: { scheduledTime: "asc" },
    });

    // Reservations (ContactMessages) in the date range
    // reservationDate is stored as ISO date string "YYYY-MM-DD"
    const fromDateStr = from.toISOString().split("T")[0];
    const toDateStr   = to.toISOString().split("T")[0];

    const reservations = await prisma.contactMessage.findMany({
      where: {
        reservationDate: {
          not: null,
          gte: fromDateStr,
          lte: toDateStr,
        },
      },
      orderBy: { reservationDate: "asc" },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        orderType: o.orderType,
        status: o.status,
        total: o.total,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        scheduledTime: o.scheduledTime,
        placedAt: o.placedAt,
      })),
      reservations: reservations.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        date: r.reservationDate,
        time: r.reservationTime,
        partySize: r.partySize,
        status: r.status,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
