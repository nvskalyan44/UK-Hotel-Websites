"use client";

import { useState, useEffect, useMemo } from "react";
import type { Coupon } from "@/lib/types";

type MenuItemOption = { id: string; name: string; category: string; emoji: string };

type FormState = {
  code: string;
  title: string;
  type: string;
  discount: string;
  minOrder: string;
  maxUses: string;
  expiry: string;
  startsAt: string;
  firstOrderOnly: boolean;
  usageLimitPerUser: string;
  applicableCategories: string[];
  applicableItems: string[];
  orderType: string;
};

type CouponStat = { uses: number; totalDiscount: number };

const EMPTY: FormState = {
  code: "", title: "", type: "percent",
  discount: "", minOrder: "", maxUses: "",
  expiry: "", startsAt: "",
  firstOrderOnly: false,
  usageLimitPerUser: "",
  applicableCategories: [],
  applicableItems: [],
  orderType: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Record<string, CouponStat>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.category));
    return Array.from(cats).sort();
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const byCat = form.applicableCategories.length > 0
      ? menuItems.filter((i) => form.applicableCategories.includes(i.category))
      : menuItems;
    return itemSearch.trim()
      ? byCat.filter((i) => i.name.toLowerCase().includes(itemSearch.toLowerCase()))
      : byCat;
  }, [menuItems, form.applicableCategories, itemSearch]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/coupons").then(r => r.json()),
      fetch("/api/admin/coupons/stats").then(r => r.json()),
      fetch("/api/admin/menu").then(r => r.json()),
    ]).then(([couponsData, statsData, itemsData]) => {
      setCoupons(couponsData);
      setStats(statsData);
      setMenuItems(itemsData.map((i: any) => ({ id: i.id, name: i.name, category: i.category, emoji: i.emoji ?? "🍛" })));
    }).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id: string, current: boolean | undefined) => {
    const next = !current;
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: next } : c));
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectAll = () => setSelected(new Set(coupons.map(c => c.id as string)));
  const clearSelection = () => setSelected(new Set());

  const bulkActivate = async (active: boolean) => {
    setBulkWorking(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map(id => fetch(`/api/admin/coupons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) })));
    setCoupons(prev => prev.map(c => selected.has(c.id as string) ? { ...c, active } : c));
    clearSelection();
    setBulkWorking(false);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} coupon${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkWorking(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map(id => fetch(`/api/admin/coupons/${id}`, { method: "DELETE" })));
    setCoupons(prev => prev.filter(c => !selected.has(c.id as string)));
    clearSelection();
    setBulkWorking(false);
  };

  const openAdd = () => {
    setEditCoupon(null);
    setForm(EMPTY);
    setItemSearch("");
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      title: c.title,
      type: c.type ?? "percent",
      discount: String(c.discount),
      minOrder: String(c.minOrder ?? ""),
      maxUses: c.maxUses ? String(c.maxUses) : "",
      expiry: c.expiry ?? "",
      startsAt: c.startsAt ?? "",
      firstOrderOnly: c.firstOrderOnly ?? false,
      usageLimitPerUser: c.usageLimitPerUser ? String(c.usageLimitPerUser) : "",
      applicableCategories: c.applicableCategories ?? [],
      applicableItems: c.applicableItems ?? [],
      orderType: c.orderType ?? "",
    });
    setItemSearch("");
    setShowModal(true);
  };

  const saveCoupon = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.discount) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (editCoupon) {
        const res = await fetch(`/api/admin/coupons/${editCoupon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setCoupons(prev => prev.map(c => c.id === editCoupon.id ? updated : c));
      } else {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const newCoupon = await res.json();
        setCoupons(prev => [newCoupon, ...prev]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const setField = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(cat)
        ? prev.applicableCategories.filter(c => c !== cat)
        : [...prev.applicableCategories, cat],
      applicableItems: prev.applicableItems.filter(id =>
        menuItems.find(m => m.id === id && !prev.applicableCategories.includes(m.category) || m.category !== cat)
      ),
    }));
  };

  const toggleItem = (id: string) => {
    setForm(prev => ({
      ...prev,
      applicableItems: prev.applicableItems.includes(id)
        ? prev.applicableItems.filter(i => i !== id)
        : [...prev.applicableItems, id],
    }));
  };

  const hasRestrictions = (c: Coupon) =>
    c.firstOrderOnly || c.orderType || (c.applicableCategories?.length ?? 0) > 0 || (c.applicableItems?.length ?? 0) > 0 || c.usageLimitPerUser;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary */}
      <div className="a-grid-stats">
        {[
          { label: "Total Coupons", value: coupons.length, color: "#ea580c" },
          { label: "Active", value: coupons.filter(c => c.active).length, color: "#10b981" },
          { label: "Inactive", value: coupons.filter(c => !c.active).length, color: "#6b7280" },
          { label: "Total Redemptions", value: coupons.reduce((s, c) => s + (c.uses ?? 0), 0), color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 28 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header + Add */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Coupons & Offers</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>Manage discount codes and promotional offers</div>
        </div>
        <button className="admin-action-btn" onClick={openAdd}>+ New Coupon</button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.2)", borderRadius: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} coupon{selected.size > 1 ? "s" : ""} selected</span>
          <button className="admin-action-btn" style={{ fontSize: 12, padding: "6px 14px", opacity: bulkWorking ? 0.6 : 1 }} disabled={bulkWorking} onClick={() => bulkActivate(true)}>Activate</button>
          <button className="a-filter-btn" style={{ fontSize: 12 }} disabled={bulkWorking} onClick={() => bulkActivate(false)}>Deactivate</button>
          <button className="a-filter-btn" style={{ fontSize: 12, color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }} disabled={bulkWorking} onClick={bulkDelete}>Delete</button>
          <button className="a-filter-btn" style={{ fontSize: 12, marginLeft: "auto" }} onClick={clearSelection}>Clear</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading coupons…</div>}

      {/* Coupon list */}
      {!loading && (
        <div className="a-card">
          {coupons.length > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--a-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox"
                checked={selected.size === coupons.length && coupons.length > 0}
                onChange={e => e.target.checked ? selectAll() : clearSelection()}
                style={{ width: 15, height: 15, cursor: "pointer" }}
              />
              <span style={{ fontSize: 11, color: "var(--a-muted)" }}>Select all</span>
            </div>
          )}
          {coupons.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--a-muted)" }}>No coupons yet. Create one above.</div>
          )}
          {coupons.map(c => (
            <div key={c.id} className="coupon-row" style={{ flexWrap: "wrap", gap: 12 }}>
              <input type="checkbox"
                checked={selected.has(c.id as string)}
                onChange={() => c.id && toggleSelect(c.id)}
                style={{ width: 15, height: 15, cursor: "pointer", flexShrink: 0 }}
              />
              <div>
                <div className="coupon-code">{c.code}</div>
                {c.active
                  ? <span className="status-badge status-active" style={{ marginTop: 4 }}>Active</span>
                  : <span className="status-badge status-pending" style={{ marginTop: 4 }}>Inactive</span>}
              </div>
              <div className="coupon-details" style={{ flex: 1, minWidth: 200 }}>
                <div className="coupon-title">{c.title}</div>
                <div className="coupon-meta">
                  <span><DiscountIcon />{c.type === "percent" ? `${c.discount}% off` : `£${c.discount} off`}{c.minOrder ? ` (min £${c.minOrder})` : ""}</span>
                  {c.uses !== undefined && <span><UsesIcon />{c.uses} uses</span>}
                  {c.maxUses && <span><LimitIcon />Max {c.maxUses}</span>}
                  {c.expiry && <span><CalIcon />Exp {c.expiry}</span>}
                  {c.startsAt && <span><CalIcon />From {c.startsAt}</span>}
                </div>
                {hasRestrictions(c) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {c.firstOrderOnly && <RestrictionTag label="First order only" color="#8b5cf6" />}
                    {c.orderType === "delivery" && <RestrictionTag label="Delivery only" color="#0ea5e9" />}
                    {c.orderType === "collection" && <RestrictionTag label="Collection only" color="#0ea5e9" />}
                    {c.usageLimitPerUser && <RestrictionTag label={`Max ${c.usageLimitPerUser}×/customer`} color="#f59e0b" />}
                    {(c.applicableCategories?.length ?? 0) > 0 && (
                      <RestrictionTag label={`${c.applicableCategories!.length} categor${c.applicableCategories!.length === 1 ? "y" : "ies"}`} color="#10b981" />
                    )}
                    {(c.applicableItems?.length ?? 0) > 0 && (
                      <RestrictionTag label={`${c.applicableItems!.length} item${c.applicableItems!.length === 1 ? "" : "s"}`} color="#10b981" />
                    )}
                  </div>
                )}
              </div>
              {c.id && stats[c.id] ? (
                <div style={{ minWidth: 110, textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>−£{stats[c.id].totalDiscount.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: "var(--a-muted)" }}>revenue impact</div>
                </div>
              ) : (
                <div style={{ minWidth: 110, textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--a-muted)" }}>£0.00</div>
                  <div style={{ fontSize: 11, color: "var(--a-muted)" }}>revenue impact</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label className="a-toggle">
                  <input type="checkbox" checked={c.active ?? false} onChange={() => c.id && toggleActive(c.id, c.active)} />
                  <span className="a-toggle-slider" />
                </label>
                <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => openEdit(c)}>Edit</button>
                <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 12px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }}
                  onClick={() => c.id && deleteCoupon(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: "32px 16px" }}>
          <div className="a-card" style={{ width: "100%", maxWidth: 560, padding: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>
              {editCoupon ? "Edit Coupon" : "New Coupon"}
            </div>

            {/* ── Basic details ── */}
            <SectionLabel>Basic details</SectionLabel>
            <div className="a-grid-2col" style={{ gap: 14, marginBottom: 20 }}>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Coupon Code *</label>
                <input value={form.code} onChange={setField("code")} placeholder="e.g. SPICE20" style={{ textTransform: "uppercase" }} />
              </div>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Title / Description *</label>
                <input value={form.title} onChange={setField("title")} placeholder="e.g. 20% off your first order" />
              </div>
              <div className="a-field">
                <label>Discount Type</label>
                <select value={form.type} onChange={setField("type")}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Fixed amount (£)</option>
                </select>
              </div>
              <div className="a-field">
                <label>Discount Value *</label>
                <input type="number" min="0" value={form.discount} onChange={setField("discount")} placeholder={form.type === "percent" ? "20" : "5.00"} />
              </div>
            </div>

            {/* ── Validity & limits ── */}
            <SectionLabel>Validity &amp; limits</SectionLabel>
            <div className="a-grid-2col" style={{ gap: 14, marginBottom: 20 }}>
              <div className="a-field">
                <label>Min Order (£)</label>
                <input type="number" min="0" value={form.minOrder} onChange={setField("minOrder")} placeholder="0.00" />
              </div>
              <div className="a-field">
                <label>Total Max Uses</label>
                <input type="number" min="1" value={form.maxUses} onChange={setField("maxUses")} placeholder="Unlimited" />
              </div>
              <div className="a-field">
                <label>Max Uses Per Customer</label>
                <input type="number" min="1" value={form.usageLimitPerUser} onChange={setField("usageLimitPerUser")} placeholder="Unlimited" />
              </div>
              <div className="a-field">
                <label>Start Date</label>
                <input type="date" value={form.startsAt} onChange={setField("startsAt")} />
              </div>
              <div className="a-field">
                <label>Expiry Date</label>
                <input type="date" value={form.expiry} onChange={setField("expiry")} />
              </div>
            </div>

            {/* ── Conditions ── */}
            <SectionLabel>Conditions</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div className="a-field">
                <label>Order Type</label>
                <select value={form.orderType} onChange={setField("orderType")}>
                  <option value="">Delivery &amp; Collection (both)</option>
                  <option value="delivery">Delivery only</option>
                  <option value="collection">Collection only</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", background: "rgba(139,92,246,0.08)", borderRadius: 8, border: "1px solid rgba(139,92,246,0.2)" }}>
                <input
                  type="checkbox"
                  checked={form.firstOrderOnly}
                  onChange={(e) => setForm(prev => ({ ...prev, firstOrderOnly: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#8b5cf6" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#c4b5fd" }}>First order only</div>
                  <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 2 }}>Customers who have previously ordered cannot use this coupon</div>
                </div>
              </label>
            </div>

            {/* ── Item & category restrictions ── */}
            <SectionLabel>Item &amp; category restrictions <span style={{ fontSize: 11, fontWeight: 400, color: "var(--a-muted)" }}>(leave empty = applies to all items)</span></SectionLabel>

            {/* Categories */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 8 }}>
                Restrict to categories
                {form.applicableCategories.length > 0 && (
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, applicableCategories: [] }))}
                    style={{ marginLeft: 10, fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    style={{
                      padding: "5px 12px", fontSize: 12, borderRadius: 999, cursor: "pointer",
                      background: form.applicableCategories.includes(cat) ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.applicableCategories.includes(cat) ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: form.applicableCategories.includes(cat) ? "#4ade80" : "var(--a-muted)",
                      fontWeight: form.applicableCategories.includes(cat) ? 600 : 400,
                    }}
                  >
                    {form.applicableCategories.includes(cat) ? "✓ " : ""}{cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific items */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 8 }}>
                Restrict to specific items
                {form.applicableItems.length > 0 && (
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, applicableItems: [] }))}
                    style={{ marginLeft: 10, fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Clear ({form.applicableItems.length})</button>
                )}
              </div>
              <input
                placeholder="Search items…"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                style={{ width: "100%", padding: "7px 12px", fontSize: 12, marginBottom: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "inherit", outline: "none" }}
              />
              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {filteredItems.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--a-muted)", padding: "8px 0", textAlign: "center" }}>No items found</div>
                )}
                {filteredItems.map(item => {
                  const selected = form.applicableItems.includes(item.id);
                  return (
                    <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, cursor: "pointer", background: selected ? "rgba(16,185,129,0.08)" : "transparent" }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleItem(item.id)} style={{ accentColor: "#10b981" }} />
                      <span style={{ fontSize: 16 }}>{item.emoji}</span>
                      <span style={{ flex: 1, fontSize: 12 }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: "var(--a-muted)" }}>{item.category}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button className="a-filter-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-action-btn" onClick={saveCoupon} disabled={saving || !form.code.trim() || !form.discount}
                style={{ opacity: saving || !form.code.trim() || !form.discount ? 0.5 : 1 }}>
                {saving ? "Saving…" : editCoupon ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--a-muted)", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

function RestrictionTag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {label}
    </span>
  );
}

function DiscountIcon() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={9} cy={9} r={2} /><circle cx={15} cy={15} r={2} /><line x1={5} y1={19} x2={19} y2={5} /></svg>;
}
function UsesIcon() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx={9} cy={7} r={4} /></svg>;
}
function LimitIcon() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10} /><line x1={4.93} y1={4.93} x2={19.07} y2={19.07} /></svg>;
}
function CalIcon() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></svg>;
}
