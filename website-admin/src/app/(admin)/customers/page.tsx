"use client";

import { useState, useEffect, Fragment } from "react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  points: number;
  status: string;
  joined: string;
  lastOrder: string;
  notes?: string;
};

function exportCustomersCSV(customers: Customer[]) {
  const headers = ["ID", "Name", "Email", "Phone", "Orders", "Total Spent", "Loyalty Points", "Status", "Joined", "Last Order"];
  const rows = customers.map(c => [
    c.id,
    `"${c.name.replace(/"/g, '""')}"`,
    c.email,
    c.phone || "",
    c.orders,
    c.spent.toFixed(2),
    c.points,
    c.status,
    c.joined,
    c.lastOrder,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);

  const FALLBACK_TIERS = [
    { key: "bronze", label: "🥉 Bronze", min: 0,    max: 499,  color: "#cd7f32" },
    { key: "silver", label: "🥈 Silver", min: 500,  max: 1999, color: "#94a3b8" },
    { key: "gold",   label: "🥇 Gold",   min: 2000, max: Infinity, color: "#f59e0b" },
  ];

  type TierItem = { key: string; label: string; min: number; max: number; color: string };
  const [loyaltyTiers, setLoyaltyTiers] = useState<TierItem[]>(FALLBACK_TIERS);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/customers").then(r => r.json()),
      fetch("/api/admin/loyalty-tiers").then(r => r.json()),
    ]).then(([customerData, tierData]: [Customer[], Array<{ id: number; name: string; minPoints: number; maxPoints: number | null; color: string; badge: string; displayOrder: number }>]) => {
      setCustomers(customerData);
      const notes: Record<string, string> = {};
      customerData.forEach(c => { notes[c.id] = c.notes ?? ""; });
      setNoteValues(notes);

      if (Array.isArray(tierData) && tierData.length > 0) {
        const mapped: TierItem[] = tierData.map(t => ({
          key: t.name.toLowerCase(),
          label: `${t.badge} ${t.name}`,
          min: t.minPoints,
          max: t.maxPoints !== null ? t.maxPoints : Infinity,
          color: t.color,
        }));
        setLoyaltyTiers(mapped);
      }
    }).finally(() => setLoading(false));
  }, []);

  const TIERS = loyaltyTiers;
  const getTier = (pts: number) => TIERS.find(t => pts >= t.min && pts <= t.max) ?? TIERS[0];

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
    const matchStatus = filter === "all" || (!["bronze", "silver", "gold"].includes(filter) && c.status === filter);
    const matchTier = !["bronze", "silver", "gold"].includes(filter) || getTier(c.points).key === filter;
    return matchSearch && (["bronze", "silver", "gold"].includes(filter) ? matchTier : matchStatus);
  });

  const saveNote = async (id: string) => {
    setSavingNote(id);
    try {
      await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteValues[id] ?? "" }),
      });
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, notes: noteValues[id] } : c));
    } finally {
      setSavingNote(null);
    }
  };

  const totalSpent   = customers.reduce((s, c) => s + c.spent, 0);
  const totalOrders  = customers.reduce((s, c) => s + c.orders, 0);
  const avgSpent     = customers.length ? totalSpent / customers.length : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary */}
      <div className="a-grid-stats">
        {[
          { label: "Total Customers",    value: customers.length.toString(),                                                                                            sub: "Registered accounts", color: "#3b82f6" },
          { label: "Total Orders",       value: totalOrders.toString(),                                                                                                 sub: "All time",            color: "#ea580c" },
          { label: "Total Revenue",      value: `£${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,                     sub: "From all customers",  color: "#10b981" },
          { label: "Avg Spend",          value: `£${avgSpent.toFixed(0)}`,                                                                                              sub: "Lifetime value",      color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      <div className="a-grid-3col">
        {TIERS.map(t => {
          const count = customers.filter(c => getTier(c.points).key === t.key).length;
          return (
            <div key={t.key} className="a-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: filter === t.key ? `1px solid ${t.color}55` : undefined }} onClick={() => setFilter(filter === t.key ? "all" : t.key)}>
              <span style={{ fontSize: 24 }}>{t.label.split(" ")[0]}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: t.color }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--a-muted)" }}>{t.label.split(" ")[1]} members</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="a-search" style={{ flex: "1 1 280px" }}>
          <SearchIcon />
          <input placeholder="Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "active", "inactive"].map(f => (
          <button key={f} className={`a-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ color: "var(--a-border)", fontSize: 16 }}>|</span>
        {TIERS.map(t => (
          <button key={t.key} className={`a-filter-btn ${filter === t.key ? "active" : ""}`} onClick={() => setFilter(t.key)} style={{ color: filter === t.key ? t.color : undefined }}>
            {t.label}
          </button>
        ))}
        <button className="a-filter-btn" style={{ fontSize: 12, padding: "6px 14px" }}
          onClick={() => exportCustomersCSV(filtered)}>
          📥 Export CSV
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading customers…</div>}

      {/* Table */}
      {!loading && (
        <div className="a-card" style={{ overflowX: "auto" }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Customer</th><th>Contact</th><th>Orders</th><th>Total Spent</th>
                <th>Loyalty Points</th><th>Last Order</th><th>Status</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <Fragment key={c.id}>
                  <tr>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="admin-avatar" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
                          {c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--a-muted)" }}>Joined {c.joined}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.email}</div>
                      <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{c.phone || "—"}</div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 16 }}>{c.orders}</td>
                    <td style={{ fontWeight: 700 }}>£{c.spent.toFixed(2)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700 }}>{c.points.toLocaleString()}</span>
                        <span style={{ fontSize: 11, color: "var(--a-muted)" }}>pts</span>
                        {(() => { const t = getTier(c.points); return (
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: `${t.color}22`, border: `1px solid ${t.color}44`, color: t.color, fontWeight: 700 }}>
                            {t.label}
                          </span>
                        ); })()}
                      </div>
                    </td>
                    <td style={{ color: "var(--a-muted)" }}>{c.lastOrder}</td>
                    <td>
                      <span className={`status-badge ${c.status === "active" ? "status-active" : "status-cancelled"}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="a-filter-btn"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                        onClick={() => setNotesOpen(notesOpen === c.id ? null : c.id)}
                      >
                        {c.notes ? "📝" : "📄"} Notes
                      </button>
                    </td>
                  </tr>
                  {notesOpen === c.id && (
                    <tr>
                      <td colSpan={8} style={{ background: "rgba(255,255,255,0.02)", padding: "14px 24px" }}>
                        <div style={{ maxWidth: 600 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--a-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Notes for {c.name}
                          </div>
                          <textarea
                            value={noteValues[c.id] ?? ""}
                            onChange={e => setNoteValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                            placeholder="Add notes about this customer…"
                            rows={3}
                            style={{
                              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--a-border)",
                              borderRadius: 8, padding: "8px 12px", color: "var(--a-text)", fontSize: 13,
                              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button
                              className="admin-action-btn"
                              style={{ fontSize: 12, padding: "6px 16px", opacity: savingNote === c.id ? 0.7 : 1 }}
                              disabled={savingNote === c.id}
                              onClick={() => saveNote(c.id)}
                            >
                              {savingNote === c.id ? "Saving…" : "Save Note"}
                            </button>
                            <button className="a-filter-btn" style={{ fontSize: 12 }} onClick={() => setNotesOpen(null)}>
                              Close
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--a-muted)" }}>
              {customers.length === 0 ? "No customers yet." : "No customers match your search."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, color: "var(--a-muted)" }}>
      <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
    </svg>
  );
}
