"use client";

import { useState, useEffect } from "react";

type ComboItem = { id: string; name: string; emoji: string; qty: number };
type Combo = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  items: ComboItem[];
  isAvailable: boolean;
  image: string | null;
  createdAt: string;
};

type MenuItem = { id: string; name: string; emoji: string; price: number; category: string };

const EMPTY_FORM = { name: "", description: "", price: "", isAvailable: true, image: "" };

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/combos").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/menu").then(r => r.ok ? r.json() : []),
    ]).then(([c, m]) => {
      setCombos(c);
      setMenuItems(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setComboItems([]);
    setError("");
    setShowForm(true);
  };

  const openEdit = (combo: Combo) => {
    setEditing(combo);
    setForm({ name: combo.name, description: combo.description ?? "", price: combo.price.toString(), isAvailable: combo.isAvailable, image: combo.image ?? "" });
    setComboItems(combo.items);
    setError("");
    setShowForm(true);
  };

  const addMenuItem = (item: MenuItem) => {
    setComboItems(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) return prev.map(ci => ci.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci);
      return [...prev, { id: item.id, name: item.name, emoji: item.emoji, qty: 1 }];
    });
    setItemSearch("");
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setComboItems(prev => prev.filter(ci => ci.id !== id));
    else setComboItems(prev => prev.map(ci => ci.id === id ? { ...ci, qty } : ci));
  };

  const save = async () => {
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError("Valid price is required"); return; }
    if (comboItems.length === 0) { setError("Add at least one item to the combo"); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), items: comboItems };
      const url = editing ? `/api/admin/combos/${editing.id}` : "/api/admin/combos";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      if (editing) setCombos(prev => prev.map(c => c.id === data.id ? data : c));
      else setCombos(prev => [data, ...prev]);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const deleteCombo = async (id: string) => {
    if (!confirm("Delete this meal deal?")) return;
    await fetch(`/api/admin/combos/${id}`, { method: "DELETE" });
    setCombos(prev => prev.filter(c => c.id !== id));
  };

  const toggleAvailable = async (combo: Combo) => {
    const res = await fetch(`/api/admin/combos/${combo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !combo.isAvailable }),
    });
    const data = await res.json();
    if (res.ok) setCombos(prev => prev.map(c => c.id === data.id ? data : c));
  };

  const filteredItems = menuItems.filter(m =>
    !itemSearch || m.name.toLowerCase().includes(itemSearch.toLowerCase()) || m.category.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 12);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#ea580c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--a-muted)" }}>{combos.length} meal deal{combos.length !== 1 ? "s" : ""} configured</div>
        </div>
        <button className="admin-action-btn" onClick={openAdd}>+ New Meal Deal</button>
      </div>

      {/* Combo list */}
      {combos.length === 0 ? (
        <div className="a-card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No meal deals yet</div>
          <div style={{ color: "var(--a-muted)", fontSize: 14, marginBottom: 24 }}>
            Create bundled meal deals to offer customers a better value deal.
          </div>
          <button className="admin-action-btn" onClick={openAdd}>Create your first deal</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {combos.map(combo => (
            <div key={combo.id} className="a-card" style={{ padding: 20, opacity: combo.isAvailable ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{combo.name}</div>
                  {combo.description && <div style={{ fontSize: 13, color: "var(--a-muted)", lineHeight: 1.5 }}>{combo.description}</div>}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--a-orange)", marginLeft: 12 }}>£{combo.price.toFixed(2)}</div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {combo.items.map(item => (
                  <span key={item.id} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.2)", color: "var(--a-orange-l)" }}>
                    {item.emoji} {item.name} ×{item.qty}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="a-filter-btn"
                  style={{ fontSize: 11, padding: "5px 12px", color: combo.isAvailable ? "#10b981" : "var(--a-muted)", borderColor: combo.isAvailable ? "rgba(16,185,129,0.3)" : undefined }}
                  onClick={() => toggleAvailable(combo)}
                >
                  {combo.isAvailable ? "✓ Available" : "Hidden"}
                </button>
                <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => openEdit(combo)}>Edit</button>
                <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 12px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)", marginLeft: "auto" }} onClick={() => deleteCombo(combo.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", background: "var(--a-bg)", border: "1px solid var(--a-border)", borderRadius: 20, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{editing ? "Edit Meal Deal" : "New Meal Deal"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--a-muted)", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            <div className="a-grid-2col" style={{ gap: 14, marginBottom: 14 }}>
              <div className="a-field">
                <label>Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Family Feast" />
              </div>
              <div className="a-field">
                <label>Deal Price (£) *</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 24.99" />
              </div>
            </div>
            <div className="a-field" style={{ marginBottom: 14 }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what's included in this deal…" rows={2} style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} />
                Show on customer website
              </label>
            </div>

            {/* Items in combo */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Items included in this deal</div>
              {comboItems.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {comboItems.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(234,88,12,0.06)", borderRadius: 10, border: "1px solid rgba(234,88,12,0.12)" }}>
                      <span style={{ fontSize: 20 }}>{item.emoji}</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--a-border)", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "inherit" }}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--a-border)", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "inherit" }}>+</button>
                        <button onClick={() => updateQty(item.id, 0)} style={{ background: "none", border: "none", color: "var(--a-muted)", cursor: "pointer", fontSize: 16, marginLeft: 4 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="a-field">
                <label>Search menu items to add</label>
                <input
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  placeholder="Type to search dishes…"
                />
              </div>
              {itemSearch && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {filteredItems.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => addMenuItem(m)}
                      style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", cursor: "pointer", color: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>{m.emoji}</span> {m.name} <span style={{ color: "var(--a-muted)" }}>£{m.price.toFixed(2)}</span>
                    </button>
                  ))}
                  {filteredItems.length === 0 && <span style={{ fontSize: 13, color: "var(--a-muted)" }}>No items found</span>}
                </div>
              )}
            </div>

            {error && <div style={{ fontSize: 13, color: "var(--a-red)", padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="a-filter-btn" style={{ padding: "10px 20px" }} onClick={() => setShowForm(false)}>Cancel</button>
              <button className="admin-action-btn" style={{ flex: 1, justifyContent: "center", opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create deal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
