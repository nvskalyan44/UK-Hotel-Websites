"use client";

import { useState, useEffect } from "react";

type InventoryItem = {
  id: string; name: string; category: string;
  stock: number; unit: string; minStock: number; maxStock: number; lastUpdated: string;
};

type FormState = {
  name: string; category: string; stock: string;
  unit: string; minStock: string; maxStock: string;
};

const EMPTY: FormState = { name: "", category: "", stock: "0", unit: "kg", minStock: "5", maxStock: "100" };

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then(r => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(items.map(i => i.category)));
  const lowStock = items.filter(i => i.stock <= i.minStock);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    return matchSearch && (catFilter === "all" || i.category === catFilter);
  });

  const stockPct = (item: InventoryItem) => Math.min(100, Math.round((item.stock / item.maxStock) * 100));
  const stockColor = (item: InventoryItem) => {
    const pct = stockPct(item);
    if (pct <= 20) return "#ef4444";
    if (pct <= 40) return "#f59e0b";
    return "#10b981";
  };

  const updateStock = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, parseFloat((item.stock + delta).toFixed(1)));
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock: newStock } : i));
    await fetch(`/api/admin/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newStock }),
    });
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    await fetch(`/api/admin/inventory/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveItem = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newItem = await res.json();
      setItems(prev => [...prev, newItem]);
      setShowModal(false);
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.4)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: 14, marginBottom: 6 }}>
              {lowStock.length} item{lowStock.length > 1 ? "s are" : " is"} below minimum stock level
            </div>
            <div style={{ fontSize: 13, color: "var(--a-muted)", display: "flex", flexWrap: "wrap", gap: "4px 0" }}>
              {lowStock.map((i, idx) => (
                <span key={i.id}>
                  <a
                    href={`#inv-${i.id}`}
                    onClick={e => { e.preventDefault(); document.getElementById(`inv-${i.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                    style={{ color: "#fbbf24", textDecoration: "underline", cursor: "pointer" }}
                  >
                    {i.name}
                  </a>
                  {idx < lowStock.length - 1 ? <span style={{ marginRight: 6 }}>,</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="a-grid-stats">
        {[
          { label: "Total Items", value: items.length, color: "#ea580c" },
          { label: "Low Stock", value: items.filter(i => i.stock <= i.minStock).length, color: "#ef4444" },
          { label: "Categories", value: categories.length, color: "#3b82f6" },
          { label: "Well Stocked", value: items.filter(i => i.stock > i.minStock * 1.5).length, color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 28 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div className="a-search" style={{ flex: "1 1 240px" }}>
          <SearchIcon />
          <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`a-filter-btn ${catFilter === "all" ? "active" : ""}`} onClick={() => setCatFilter("all")}>All</button>
        {categories.map(c => (
          <button key={c} className={`a-filter-btn ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
        <button className="admin-action-btn" onClick={() => { setForm(EMPTY); setShowModal(true); }}>+ Add Item</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading inventory…</div>}

      {/* Grid */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {filtered.map(item => {
            const pct = stockPct(item);
            const color = stockColor(item);
            const isLow = item.stock <= item.minStock;
            return (
              <div key={item.id} id={`inv-${item.id}`} className="a-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 2 }}>{item.category}</div>
                  </div>
                  {isLow && <span className="inv-low-badge">⚠ Low</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color }}>
                    {item.stock} <span style={{ fontSize: 13, color: "var(--a-muted)", fontWeight: 400 }}>{item.unit}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "var(--a-muted)" }}>{pct}%</span>
                </div>
                <div className="inv-bar-track">
                  <div className="inv-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>Min: {item.minStock} {item.unit}</span>
                  <span>Max: {item.maxStock} {item.unit}</span>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--a-border)", display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="a-filter-btn" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => updateStock(item.id, -1)}>−</button>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--a-muted)" }}>Adjust stock</span>
                  <button className="a-filter-btn" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => updateStock(item.id, 1)}>+</button>
                  <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 8px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }} onClick={() => deleteItem(item.id)}>🗑</button>
                </div>
                <div style={{ fontSize: 10, color: "var(--a-muted)", marginTop: 8, textAlign: "center" }}>Updated {item.lastUpdated}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="a-card" style={{ width: "100%", maxWidth: 480, padding: 28, margin: "0 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Add Inventory Item</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Item Name</label>
                <input value={form.name} onChange={set("name")} placeholder="e.g. Basmati Rice" />
              </div>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Category</label>
                <input value={form.category} onChange={set("category")} placeholder="e.g. Grains & Rice" />
              </div>
              <div className="a-field">
                <label>Current Stock</label>
                <input type="number" step="0.1" value={form.stock} onChange={set("stock")} placeholder="0" />
              </div>
              <div className="a-field">
                <label>Unit</label>
                <input value={form.unit} onChange={set("unit")} placeholder="kg / litres / units" />
              </div>
              <div className="a-field">
                <label>Min Stock Level</label>
                <input type="number" step="0.1" value={form.minStock} onChange={set("minStock")} placeholder="5" />
              </div>
              <div className="a-field">
                <label>Max Stock Level</label>
                <input type="number" step="0.1" value={form.maxStock} onChange={set("maxStock")} placeholder="100" />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button className="a-filter-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-action-btn" onClick={saveItem} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Add Item"}
              </button>
            </div>
          </div>
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
