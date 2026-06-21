import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Date boundaries
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // ── 1. Today's stats ──────────────────────────────────
    const todayOrders = await prisma.order.findMany({
      where: { placedAt: { gte: todayStart, lt: tomorrowStart } },
      select: { total: true, status: true },
    });

    const yesterdayOrders = await prisma.order.findMany({
      where: { placedAt: { gte: yesterdayStart, lt: todayStart }, status: { not: "cancelled" } },
      select: { total: true },
    });

    const todayRevenue = todayOrders
      .filter(o => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
    const revenueChange = yesterdayRevenue > 0
      ? +((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : 0;

    const activeOrders = await prisma.order.count({
      where: { status: { in: ["confirmed", "preparing", "out-for-delivery"] } },
    });

    const totalCustomers = await prisma.customer.count();

    const recentAvg = await prisma.order.aggregate({
      _avg: { total: true },
      where: {
        placedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
        status: { not: "cancelled" },
      },
    });
    const avgOrderValue = +(recentAvg._avg.total ?? 0).toFixed(2);

    // Items sold today
    const todayItemsSold = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          placedAt: { gte: todayStart, lt: tomorrowStart },
          status: { not: "cancelled" },
        },
      },
    });

    // ── 2. Weekly revenue (Mon–Sun current week) ──────────
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay(); // 0=Sun, 1=Mon, ...
    const monday = new Date(weekStart);
    monday.setDate(weekStart.getDate() - ((dayOfWeek + 6) % 7)); // roll back to Monday

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyRevenue = await Promise.all(
      weekDays.map(async (day, i) => {
        const dayStart = new Date(monday);
        dayStart.setDate(monday.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        const agg = await prisma.order.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: {
            placedAt: { gte: dayStart, lt: dayEnd },
            status: { not: "cancelled" },
          },
        });
        return {
          day,
          revenue: Math.round((agg._sum.total ?? 0) * 100) / 100,
          orders: agg._count.id,
        };
      })
    );

    // ── 3. Category breakdown (last 30 days) ──────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const categoryItems = await prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: { gte: thirtyDaysAgo },
          status: { not: "cancelled" },
        },
        menuItemId: { not: null },
      },
      select: {
        lineTotal: true,
        menuItem: { select: { category: { select: { name: true } } } },
      },
    });

    const catRevenue: Record<string, number> = {};
    let catTotal = 0;
    for (const item of categoryItems) {
      const cat = item.menuItem?.category?.name ?? "Other";
      catRevenue[cat] = (catRevenue[cat] ?? 0) + item.lineTotal;
      catTotal += item.lineTotal;
    }
    const CAT_COLORS: Record<string, string> = {
      Rice: "#ea580c", Mains: "#f59e0b", Starters: "#3b82f6",
      Desserts: "#8b5cf6", Drinks: "#06b6d4", Breads: "#10b981",
    };
    const categoryBreakdown = Object.entries(catRevenue)
      .map(([name, rev]) => ({
        name,
        value: catTotal > 0 ? Math.round((rev / catTotal) * 100) : 0,
        color: CAT_COLORS[name] ?? "#6b7280",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    // normalise to 100
    const bkSum = categoryBreakdown.reduce((s, c) => s + c.value, 0);
    if (bkSum > 0 && bkSum !== 100) {
      categoryBreakdown[0].value += 100 - bkSum;
    }

    // ── 4. Recent orders (latest 8) ───────────────────────
    const recentOrders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 8,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        total: true,
        status: true,
        paymentStatus: true,
        placedAt: true,
        items: { select: { itemName: true, quantity: true }, take: 3 },
      },
    });

    return NextResponse.json({
      stats: {
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        revenueChange,
        activeOrders,
        totalCustomers,
        avgOrderValue,
        menuItemsSold: todayItemsSold._sum.quantity ?? 0,
      },
      weeklyRevenue,
      categoryBreakdown,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customer: o.customerName,
        email: o.customerEmail,
        items: o.items.map(i => `${i.itemName}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", "),
        total: o.total,
        status: o.status,
        payment: o.paymentStatus,
        time: new Date(o.placedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        date: isToday(new Date(o.placedAt)) ? "Today" : "Yesterday",
      })),
    });
  } catch (err) {
    console.error("[dashboard API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function isToday(d: Date) {
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}
