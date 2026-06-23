export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();

    // Optional date range (ISO strings)
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const rangeStart = fromParam ? new Date(fromParam) : null;
    const rangeEnd = toParam ? new Date(toParam) : null;

    // ── 1. Monthly revenue (last 12 completed months or custom range) ────
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let monthly: { month: string; year: number; revenue: number; orders: number }[];

    if (rangeStart && rangeEnd) {
      // Build months between rangeStart and rangeEnd
      const months: { month: string; year: number; revenue: number; orders: number }[] = [];
      const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 1);
      while (cursor < end) {
        const start = new Date(cursor);
        const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        const agg = await prisma.order.aggregate({
          _sum: { total: true }, _count: { id: true },
          where: { placedAt: { gte: start, lt: mEnd }, status: { not: "cancelled" } },
        });
        months.push({ month: monthNames[cursor.getMonth()], year: cursor.getFullYear(), revenue: Math.round((agg._sum.total ?? 0) * 100) / 100, orders: agg._count.id });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      monthly = months;
    } else {
      monthly = await Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 12 + i, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          return prisma.order.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: { placedAt: { gte: start, lt: end }, status: { not: "cancelled" } },
          }).then(agg => ({
            month: monthNames[d.getMonth()],
            year: d.getFullYear(),
            revenue: Math.round((agg._sum.total ?? 0) * 100) / 100,
            orders: agg._count.id,
          }));
        })
      );
    }

    // ── 2. Annual KPIs ────────────────────────────────────
    const yearStart = rangeStart ?? new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const yearEnd = rangeEnd ? new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 1) : undefined;
    const periodWhere = { gte: yearStart, ...(yearEnd ? { lt: yearEnd } : {}) };
    const annualAgg = await prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
      where: {
        placedAt: periodWhere,
        status: { not: "cancelled" },
      },
    });

    const annualRevenue = Math.round((annualAgg._sum.total ?? 0) * 100) / 100;
    const totalOrders   = annualAgg._count.id;
    const avgOrderValue = Math.round((annualAgg._avg.total ?? 0) * 100) / 100;
    const bestMonth     = monthly.length > 0 ? monthly.reduce((a, b) => b.revenue > a.revenue ? b : a, monthly[0]) : { month: "—", year: 0, revenue: 0, orders: 0 };

    // ── 3. Category breakdown ────────────────────────────
    const categoryItems = await prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: periodWhere,
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
      .sort((a, b) => b.value - a.value);
    // normalise percentages to 100
    const bkSum = categoryBreakdown.reduce((s, c) => s + c.value, 0);
    if (bkSum > 0 && categoryBreakdown.length > 0 && bkSum !== 100) {
      categoryBreakdown[0].value += 100 - bkSum;
    }

    // ── 4. Order metrics ──────────────────────────────────
    // Repeat customer rate: customers with > 1 order
    const repeatCustomers = await prisma.customer.count({
      where: { totalOrders: { gt: 1 } },
    });
    const totalCustomers = await prisma.customer.count();
    const repeatRate = totalCustomers > 0
      ? Math.round((repeatCustomers / totalCustomers) * 100)
      : 0;

    // Cancellation rate
    const cancelCount = await prisma.order.count({
      where: { placedAt: periodWhere, status: "cancelled" },
    });
    const allCount = await prisma.order.count({
      where: { placedAt: periodWhere },
    });
    const cancelRate = allCount > 0
      ? +((cancelCount / allCount) * 100).toFixed(1)
      : 0;

    // Delivery vs collection
    const deliveryCount = await prisma.order.count({
      where: { placedAt: periodWhere, orderType: "delivery", status: { not: "cancelled" } },
    });
    const collectionCount = totalOrders - deliveryCount;
    const deliverySplit = totalOrders > 0
      ? `${Math.round((deliveryCount / totalOrders) * 100)}% / ${Math.round((collectionCount / totalOrders) * 100)}%`
      : "—";

    // Avg orders per day
    const rangeEndTime = yearEnd ?? now;
    const daysSince = Math.max(1, Math.round((rangeEndTime.getTime() - yearStart.getTime()) / 86_400_000));
    const ordersPerDay = +(totalOrders / daysSince).toFixed(1);

    // ── 5. Top selling items ──────────────────────────────
    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ["itemName"],
      where: {
        order: {
          placedAt: periodWhere,
          status: { not: "cancelled" },
        },
      },
      _sum: { quantity: true, lineTotal: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const topItems = topItemsRaw.map(r => ({
      name: r.itemName,
      orders: r._count.id,
      units: r._sum.quantity ?? 0,
      revenue: Math.round((r._sum.lineTotal ?? 0) * 100) / 100,
    }));

    return NextResponse.json({
      monthly,
      kpis: {
        annualRevenue,
        totalOrders,
        avgOrderValue,
        bestMonth: `${bestMonth.month} ${bestMonth.year}`,
        bestMonthRevenue: bestMonth.revenue,
      },
      categoryBreakdown,
      metrics: {
        avgOrderValue,
        ordersPerDay,
        repeatCustomerRate: repeatRate,
        deliverySplit,
        cancelRate,
      },
      topItems,
    });
  } catch (err) {
    console.error("[analytics API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
