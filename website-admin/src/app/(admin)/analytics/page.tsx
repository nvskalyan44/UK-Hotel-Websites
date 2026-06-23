"use client";

import { useEffect, useState } from "react";

interface TopItem {
  name: string;
  orders: number;
  units: number;
  revenue: number;
}

interface AnalyticsData {
  monthly: { month: string; year: number; revenue: number; orders: number }[];
  kpis: {
    annualRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    bestMonth: string;
    bestMonthRevenue: number;
  };
  categoryBreakdown: { name: string; value: number; color: string }[];
  metrics: {
    avgOrderValue: number;
    ordersPerDay: number;
    repeatCustomerRate: number;
    deliverySplit: string;
    cancelRate: number;
  };
  topItems: TopItem[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = (from?: string, to?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params}` : "";
    fetch(`/api/admin/analytics${qs}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const applyDateFilter = () => fetchData(dateFrom || undefined, dateTo || undefined);
  const clearDateFilter = () => { setDateFrom(""); setDateTo(""); fetchData(); };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="a-card" style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#ea580c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ))}
    </div>
  );

  if (!data) return (
    <div className="a-card" style={{ padding: 48, textAlign: "center", color: "var(--a-muted)" }}>
      Failed to load analytics data.
    </div>
  );

  const { monthly, kpis, categoryBreakdown, metrics, topItems = [] } = data;
  const priorPeriod = monthly.slice(0, 6).reduce((s, m) => s + m.revenue, 0);
  const currentPeriod = monthly.slice(6).reduce((s, m) => s + m.revenue, 0);
  const periodChange = priorPeriod > 0
    ? +((currentPeriod - priorPeriod) / priorPeriod * 100).toFixed(1)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Date range filter */}
      <div className="a-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--a-muted)", fontWeight: 600 }}>Date range:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          style={{ padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 13 }}
        />
        <span style={{ color: "var(--a-muted)" }}>to</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          style={{ padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 13 }}
        />
        <button className="admin-action-btn" style={{ fontSize: 12, padding: "6px 16px" }} onClick={applyDateFilter} disabled={!dateFrom && !dateTo}>
          Apply
        </button>
        {(dateFrom || dateTo) && (
          <button className="a-filter-btn" style={{ fontSize: 12 }} onClick={clearDateFilter}>Clear</button>
        )}
        {(dateFrom || dateTo) && (
          <span style={{ fontSize: 12, color: "#f59e0b" }}>Showing custom range</span>
        )}
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Annual Revenue" value={`£${(kpis.annualRevenue / 1000).toFixed(1)}k`}
          sub="Last 12 months" color="#ea580c" />
        <KpiCard label="Total Orders" value={kpis.totalOrders.toLocaleString()}
          sub="Completed orders" color="#3b82f6" />
        <KpiCard label="Best Month" value={kpis.bestMonth}
          sub={`£${kpis.bestMonthRevenue.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          color="#10b981" />
        <KpiCard label="Avg Order Value" value={`£${kpis.avgOrderValue.toFixed(2)}`}
          sub="Per order" color="#8b5cf6" />
      </div>

      {/* Bar chart */}
      <div className="a-card" style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Monthly Revenue</div>
            <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>Last 12 months — live from database</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              £{(kpis.annualRevenue / 1000).toFixed(1)}k
            </div>
            <div style={{ fontSize: 11, color: periodChange >= 0 ? "var(--a-green)" : "var(--a-red)" }}>
              {periodChange >= 0 ? "↑" : "↓"} {Math.abs(periodChange)}% vs prior 6 months
            </div>
          </div>
        </div>
        <BarChart data={monthly} />
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Category breakdown */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Revenue by Category</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 20 }}>Proportional share this year</div>
          {categoryBreakdown.map(d => (
            <div key={d.name} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: d.color }}>{d.value}%</span>
              </div>
              <div className="inv-bar-track">
                <div className="inv-bar-fill" style={{ width: `${d.value}%`, background: d.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Order metrics */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Order Metrics</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 20 }}>Performance indicators — last 12 months</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <MetricRow label="Average order value" value={`£${metrics.avgOrderValue.toFixed(2)}`} positive />
            <MetricRow label="Orders per day (avg)" value={String(metrics.ordersPerDay)} positive />
            <MetricRow label="Repeat customer rate" value={`${metrics.repeatCustomerRate}%`} positive />
            <MetricRow label="Delivery vs Dine-in" value={metrics.deliverySplit} positive />
            <MetricRow label="Cancellation rate" value={`${metrics.cancelRate}%`} positive={metrics.cancelRate < 5} />
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="a-card">
        <div style={{ padding: "20px 24px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Monthly Breakdown</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>Revenue and orders — live from PostgreSQL</div>
        </div>
        <table className="a-table">
          <thead>
            <tr><th>Month</th><th>Revenue</th><th>Orders</th><th>Avg Order</th><th>vs Prior Month</th></tr>
          </thead>
          <tbody>
            {monthly.map((d, i) => {
              const prev = monthly[i - 1];
              const change = prev && prev.revenue > 0
                ? ((d.revenue - prev.revenue) / prev.revenue * 100).toFixed(1)
                : null;
              const positive = change ? parseFloat(change) >= 0 : true;
              return (
                <tr key={`${d.month}-${d.year}`}>
                  <td style={{ fontWeight: 600 }}>{d.month} {d.year !== new Date().getFullYear() ? d.year : ""}</td>
                  <td style={{ fontWeight: 700 }}>
                    £{d.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>{d.orders.toLocaleString()}</td>
                  <td>{d.orders > 0 ? `£${(d.revenue / d.orders).toFixed(2)}` : "—"}</td>
                  <td>
                    {change ? (
                      <span style={{ color: positive ? "var(--a-green)" : "var(--a-red)", fontWeight: 600 }}>
                        {positive ? "↑" : "↓"} {Math.abs(parseFloat(change))}%
                      </span>
                    ) : <span style={{ color: "var(--a-muted)" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top Selling Items */}
      {topItems.length > 0 && (
        <div className="a-card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Top Selling Items</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 24 }}>Top 10 items by units sold — last 12 months</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topItems.map((item, i) => {
              const maxUnits = topItems[0]?.units ?? 1;
              const pct = maxUnits > 0 ? (item.units / maxUnits) * 100 : 0;
              // Gradient: #1 orange, fade to blue by #10
              const hue = Math.round(25 + (i / Math.max(topItems.length - 1, 1)) * 200);
              const barColor = i === 0 ? "#f97316" : i === 1 ? "#f59e0b" : i === 2 ? "#eab308" : `hsl(${hue}, 70%, 55%)`;
              return (
                <div key={item.name} style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 90px", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: i < 3 ? barColor : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 12, color: i < 3 ? "#fff" : "var(--a-muted)", flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.4s" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{item.orders}</div>
                    <div style={{ fontSize: 11, color: "var(--a-muted)" }}>orders</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{item.units}</div>
                    <div style={{ fontSize: 11, color: "var(--a-muted)" }}>units</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: barColor }}>
                      £{item.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--a-muted)" }}>revenue</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="stat-card" style={{ "--stat-color": color } as React.CSSProperties}>
      <div className="stat-value" style={{ fontSize: 26 }}>{value}</div>
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{sub}</div>
    </div>
  );
}

function MetricRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--a-muted)" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 14, color: positive ? "var(--a-text)" : "var(--a-red)" }}>{value}</span>
    </div>
  );
}

function BarChart({ data }: { data: { month: string; revenue: number; orders: number }[] }) {
  const W = 700, H = 200, PAD = { top: 8, right: 8, bottom: 28, left: 52 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const barW = iW / data.length;
  const barPad = barW * 0.22;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD.top + iH * (1 - t);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + iW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={10}>
              £{max * t >= 1000 ? `${((max * t) / 1000).toFixed(0)}k` : Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bH = max > 0 ? (d.revenue / max) * iH : 0;
        const x = PAD.left + i * barW + barPad;
        const y = PAD.top + iH - bH;
        const bw = barW - barPad * 2;
        return (
          <g key={`${d.month}-${i}`}>
            {bH > 0 && (
              <rect x={x} y={y} width={bw} height={bH} rx={3}
                fill="url(#barGrad)" opacity={0.88} />
            )}
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>
              {d.month}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
        </linearGradient>
      </defs>
    </svg>
  );
}
