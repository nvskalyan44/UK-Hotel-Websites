export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // ── 1. Monthly revenue (last 12 completed months) ────
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthly = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        // i=0 → 12 months ago, i=11 → last complete month
        const d = new Date(now.getFullYear(), now.getMonth() - 12 + i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        return prisma.order.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: {
            placedAt: { gte: start, lt: end },
            status: { not: "cancelled" },
          },
        }).then(agg => ({
          month: monthNames[d.getMonth()],
          year: d.getFullYear(),
          revenue: Math.round((agg._sum.total ?? 0) * 100) / 100,
          orders: agg._count.id,
        }));
      })
    );

    // ── 2. Annual KPIs ────────────────────────────────────
    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const annualAgg = await prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
      where: {
        placedAt: { gte: yearStart },
        status: { not: "cancelled" },
      },
    });

    const annualRevenue = Math.round((annualAgg._sum.total ?? 0) * 100) / 100;
    const totalOrders   = annualAgg._count.id;
    const avgOrderValue = Math.round((annualAgg._avg.total ?? 0) * 100) / 100;
    const bestMonth     = monthly.reduce((a, b) => b.revenue > a.revenue ? b : a, monthly[0]);

    // ── 3. Category breakdown ────────────────────────────
    const categoryItems = await prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: { gte: yearStart },
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
      where: { placedAt: { gte: yearStart }, status: "cancelled" },
    });
    const allCount = await prisma.order.count({
      where: { placedAt: { gte: yearStart } },
    });
    const cancelRate = allCount > 0
      ? +((cancelCount / allCount) * 100).toFixed(1)
      : 0;

    // Delivery vs collection
    const deliveryCount = await prisma.order.count({
      where: { placedAt: { gte: yearStart }, orderType: "delivery", status: { not: "cancelled" } },
    });
    const collectionCount = totalOrders - deliveryCount;
    const deliverySplit = totalOrders > 0
      ? `${Math.round((deliveryCount / totalOrders) * 100)}% / ${Math.round((collectionCount / totalOrders) * 100)}%`
      : "—";

    // Avg orders per day
    const daysSince = Math.max(1, Math.round((now.getTime() - yearStart.getTime()) / 86_400_000));
    const ordersPerDay = +(totalOrders / daysSince).toFixed(1);

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
    });
  } catch (err) {
    console.error("[analytics API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
