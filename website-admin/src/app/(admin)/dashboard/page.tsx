"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────
type StatusEntry = { id: number; value: string; label: string; color: string };

const FALLBACK_STATUSES: StatusEntry[] = [
  { id: 1, value: "pending",          label: "Pending",          color: "#6b7280" },
  { id: 2, value: "confirmed",        label: "Confirmed",        color: "#3b82f6" },
  { id: 3, value: "preparing",        label: "Preparing",        color: "#f59e0b" },
  { id: 4, value: "out-for-delivery", label: "Out for Delivery", color: "#06b6d4" },
  { id: 5, value: "delivered",        label: "Delivered",        color: "#10b981" },
  { id: 6, value: "cancelled",        label: "Cancelled",        color: "#ef4444" },
];

interface DashboardData {
  stats: {
    todayRevenue: number;
    revenueChange: number;
    activeOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    menuItemsSold: number;
  };
  weeklyRevenue: { day: string; revenue: number; orders: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  recentOrders: {
    id: string; customer: string; email: string; items: string;
    total: number; status: string; payment: string; time: string; date: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusList, setStatusList] = useState<StatusEntry[]>(FALLBACK_STATUSES);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load dashboard data"); setLoading(false); });

    fetch("/api/admin/config/order-statuses")
      .then(r => r.ok ? r.json() : null)
      .then((data: StatusEntry[] | null) => { if (data && data.length > 0) setStatusList(data); })
      .catch(() => {});
  }, []);

  const statusLabels = Object.fromEntries(statusList.map(s => [s.value, s.label]));

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No data"} />;

  const { stats, weeklyRevenue, categoryBreakdown, recentOrders } = data;
  const weekTotal = weeklyRevenue.reduce((s, d) => s + d.revenue, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Stat cards */}
      <div className="a-grid-stats">
        <StatCard color="#ea580c" icon="💰" label="Today's Revenue"
          value={`£${stats.todayRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange}% vs yesterday`}
          positive={stats.revenueChange >= 0} />
        <StatCard color="#3b82f6" icon="📦" label="Active Orders"
          value={String(stats.activeOrders)}
          trend="Confirmed + Preparing + In Transit"
          positive />
        <StatCard color="#10b981" icon="👥" label="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          trend="Registered accounts"
          positive />
        <StatCard color="#8b5cf6" icon="🧾" label="Avg Order Value"
          value={`£${stats.avgOrderValue.toFixed(2)}`}
          trend="Last 7 days"
          positive />
        <StatCard color="#f59e0b" icon="🍽️" label="Items Sold Today"
          value={String(stats.menuItemsSold)}
          trend="Menu items served"
          positive />
        <div className="a-card" style={{ padding: 20, gridColumn: "span 3" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Quick actions</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 16 }}>Common tasks</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/menu" className="admin-action-btn" style={{ fontSize: 12, padding: "7px 14px" }}>+ Add Menu Item</Link>
            <Link href="/orders" className="a-filter-btn" style={{ fontSize: 12 }}>View All Orders</Link>
            <Link href="/coupons" className="a-filter-btn" style={{ fontSize: 12 }}>+ New Coupon</Link>
            <Link href="/inventory" className="a-filter-btn" style={{ fontSize: 12 }}>Check Stock</Link>
            <Link href="/messages" className="a-filter-btn" style={{ fontSize: 12 }}>View Messages</Link>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="a-grid-dash" style={{ gap: 20 }}>
        {/* Line chart */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Weekly Revenue</div>
              <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>Mon – Sun this week</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                £{weekTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 11, color: "var(--a-green)" }}>This week's total</div>
            </div>
          </div>
          <LineChart data={weeklyRevenue} />
        </div>

        {/* Donut */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Sales by Category</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 20 }}>Last 30 days</div>
          <DonutChart data={categoryBreakdown} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {categoryBreakdown.map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  {d.name}
                </div>
                <span style={{ fontWeight: 600, color: d.color }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="a-card">
        <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Orders</div>
            <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>Live from database</div>
          </div>
          <Link href="/admin/orders" className="a-filter-btn">View all orders</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="a-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700, color: "var(--a-orange-l)" }}>{order.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.customer}</div>
                    <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{order.email}</div>
                  </td>
                  <td style={{ color: "var(--a-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {order.items}
                  </td>
                  <td style={{ fontWeight: 600 }}>£{order.total.toFixed(2)}</td>
                  <td><StatusBadge status={order.status} statusLabels={statusLabels} /></td>
                  <td style={{ color: "var(--a-muted)" }}>{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="a-grid-stats">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card" style={{ "--stat-color": "#334155" } as React.CSSProperties}>
            <div style={{ height: 28, background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 8, width: "60%" }} />
            <div style={{ height: 14, background: "rgba(255,255,255,0.04)", borderRadius: 4, width: "80%" }} />
          </div>
        ))}
      </div>
      <div className="a-grid-dash" style={{ gap: 20 }}>
        <div className="a-card" style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner />
        </div>
        <div className="a-card" style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="a-card" style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Failed to load dashboard</div>
      <div style={{ color: "var(--a-muted)", fontSize: 13 }}>{message}</div>
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#ea580c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

function StatCard({ color, icon, label, value, trend, positive }: {
  color: string; icon: string; label: string; value: string; trend: string; positive?: boolean;
}) {
  return (
    <div className="stat-card" style={{ "--stat-color": color } as React.CSSProperties}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-trend" style={{ color: positive ? "var(--a-green)" : "var(--a-red)" }}>
        {positive ? "↑" : "↓"} {trend}
      </div>
    </div>
  );
}

function StatusBadge({ status, statusLabels }: { status: string; statusLabels: Record<string, string> }) {
  const map: Record<string, string> = {
    delivered: "status-delivered", confirmed: "status-confirmed", preparing: "status-preparing",
    "out-for-delivery": "status-outdelivery", pending: "status-pending", cancelled: "status-cancelled",
  };
  return <span className={`status-badge ${map[status] ?? "status-pending"}`}>{statusLabels[status] ?? status}</span>;
}

function LineChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const W = 560, H = 140, PAD = { top: 8, right: 8, bottom: 24, left: 40 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const min = Math.min(...data.map(d => d.revenue));
  const xStep = iW / Math.max(data.length - 1, 1);
  const yScale = (v: number) => iH - ((v - min) / Math.max(max - min, 1)) * iH;
  const pts = data.map((d, i) => `${PAD.left + i * xStep},${PAD.top + yScale(d.revenue)}`).join(" ");
  const fillPts = [
    `${PAD.left},${PAD.top + iH}`,
    ...data.map((d, i) => `${PAD.left + i * xStep},${PAD.top + yScale(d.revenue)}`),
    `${PAD.left + (data.length - 1) * xStep},${PAD.top + iH}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD.top + iH * (1 - t);
        const val = min + (max - min) * t;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + iW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={10}>
              £{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
            </text>
          </g>
        );
      })}
      <polygon points={fillPts} fill="rgba(234,88,12,0.08)" />
      <polyline points={pts} fill="none" stroke="#ea580c" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={PAD.left + i * xStep} cy={PAD.top + yScale(d.revenue)} r={d.revenue > 0 ? 4 : 2}
            fill={d.revenue > 0 ? "#ea580c" : "rgba(255,255,255,0.2)"} stroke="#0f1117" strokeWidth={2} />
          <text x={PAD.left + i * xStep} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11}>{d.day}</text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const R = 70, r = 46, cx = 90, cy = 90;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const slices = data.map(d => {
    const dash = (d.value / 100) * circ;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  });
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <svg viewBox="0 0 180 180" width="100%" style={{ maxWidth: 180, display: "block", margin: "0 auto" }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={R - r} />
      {slices.map(s => (
        <circle key={s.name} cx={cx} cy={cy} r={R} fill="none" stroke={s.color}
          strokeWidth={R - r}
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={circ / 4 - s.offset}
          strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={20} fontWeight={700}>{total}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>Total</text>
    </svg>
  );
}
