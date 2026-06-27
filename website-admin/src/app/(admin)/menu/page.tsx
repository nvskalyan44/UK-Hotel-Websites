"use client";

import { useState, useEffect } from "react";
import type { MenuItem } from "@/lib/types";

type Variant = { label: string; price: string };

const FALLBACK_ALLERGENS = ["Gluten", "Dairy", "Eggs", "Nuts", "Peanuts", "Soy", "Fish", "Shellfish", "Sesame", "Celery", "Mustard", "Sulphites", "Lupin", "Molluscs"];

type Category = { id: number; name: string; displayOrder: number };

type FormState = {
  name: string; desc: string; price: string;
  category: string; emoji: string; veg: string;
  availabilityType: string; allergens: string[];
};

const EMPTY: FormState = { name: "", desc: "", price: "", category: "", emoji: "🍛", veg: "non-veg", availabilityType: "both", allergens: [] };
const EMPTY_VARIANT: Variant = { label: "", price: "" };

// Blob uploads return an absolute URL; local-dev uploads return a relative path
// served by this admin app. Render either correctly.
function imgSrc(url: string) {
  return /^https?:\/\//.test(url) ? url : url;
}

export default function MenuManagementPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [allergens, setAllergens] = useState<string[]>([]);

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");

  const CATEGORY_NAMES = categories.map(c => c.name);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/menu").then(r => r.json()),
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/allergens").then(r => r.json()),
    ]).then(([menuItems, cats, allergenData]) => {
      setItems(menuItems);
      setCategories(cats);
      if (Array.isArray(allergenData) && allergenData.length > 0) {
        setAllergens(allergenData.map((a: { name: string }) => a.name));
      }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    return matchSearch && (catFilter === "all" || item.category === catFilter);
  });

  const toggleAvailable = async (id: string, current: boolean | undefined) => {
    const next = current === false ? true : !current;
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: next } : i));
    await fetch(`/api/admin/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: next }),
    });
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY, category: CATEGORY_NAMES[0] ?? "" });
    setVariants([]);
    setImageUrl(null);
    clearPendingImage();
    setShowModal(true);
  };
  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      desc: item.desc,
      price: String(item.price),
      category: item.category,
      emoji: item.emoji,
      veg: item.veg ? "veg" : "non-veg",
      availabilityType: (item as any).availabilityType ?? "both",
      allergens: Array.isArray((item as any).allergens) ? (item as any).allergens : [],
    });
    const rawV = Array.isArray(item.variants) ? item.variants : [];
    setVariants(rawV.map(v => ({ label: v.label, price: String(v.price) })));
    setImageUrl(item.image ?? null);
    clearPendingImage();
    setShowModal(true);
  };

  // Upload a file for a known item id; returns the stored URL or throws.
  const uploadFileForId = async (file: File, id: string): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("id", id);
    const res = await fetch("/api/admin/menu/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  // Existing item → upload immediately. New item → stash the file + show a
  // local preview; it gets uploaded automatically once the item is saved.
  const handleFileSelect = async (file: File) => {
    setSaveError("");
    if (editItem) {
      setImageUploading(true);
      try {
        const url = await uploadFileForId(file, editItem.id);
        setImageUrl(url);
        setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, image: url } : i));
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setImageUploading(false);
      }
    } else {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(file);
      setPendingPreview(URL.createObjectURL(file));
    }
  };

  const clearPendingImage = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const removeImage = async () => {
    if (!editItem) return;
    await fetch("/api/admin/menu/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem.id }) });
    setImageUrl(null);
    setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, image: null } : i));
  };

  const [saveError, setSaveError] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  // For NEW items we hold the chosen file until the item is created (upload needs its id)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const saveItem = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const validVariants = variants.filter(v => v.label.trim() && v.price).map(v => ({ label: v.label.trim(), price: parseFloat(v.price) }));
      const payload = { ...form, variants: validVariants };
      if (editItem) {
        const res = await fetch(`/api/admin/menu/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setSaveError(data.error || "Failed to save changes"); return; }
        setItems(prev => prev.map(i => i.id === editItem.id ? data : i));
      } else {
        const res = await fetch("/api/admin/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let created = await res.json().catch(() => ({}));
        if (!res.ok) { setSaveError(created.error || "Failed to add item"); return; }
        // Now that the item exists and has an id, upload the chosen photo.
        if (pendingFile && created?.id) {
          try {
            const url = await uploadFileForId(pendingFile, created.id);
            created = { ...created, image: url };
          } catch (e) {
            setSaveError(`Item saved, but image upload failed: ${e instanceof Error ? e.message : "unknown error"}`);
          }
        }
        setItems(prev => [...prev, created]);
        clearPendingImage();
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof Omit<FormState, "allergens">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleAllergen = (a: string) =>
    setForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(a) ? prev.allergens.filter(x => x !== a) : [...prev.allergens, a],
    }));

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setCatSaving(true); setCatError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      const data = await res.json();
      if (!res.ok) { setCatError(data.error || "Failed"); return; }
      setCategories(prev => [...prev, data]);
      setNewCatName("");
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed to delete"); return; }
    setCategories(prev => prev.filter(c => c.id !== id));
    if (catFilter === categories.find(c => c.id === id)?.name) setCatFilter("all");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Items", value: items.length, color: "#ea580c" },
          { label: "Available", value: items.filter(i => i.available !== false).length, color: "#10b981" },
          { label: "Unavailable", value: items.filter(i => i.available === false).length, color: "#ef4444" },
          { label: "Categories", value: categories.length, color: "#3b82f6" },
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
          <input placeholder="Search menu items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className={`a-filter-btn ${catFilter === "all" ? "active" : ""}`} onClick={() => setCatFilter("all")}>All</button>
          {CATEGORY_NAMES.map(c => (
            <button key={c} className={`a-filter-btn ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>
          ))}
        </div>
        <button className="a-filter-btn" style={{ fontSize: 12 }} onClick={() => setShowCatModal(true)}>Manage Categories</button>
        <button className="admin-action-btn" onClick={openAdd}>+ Add Item</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading menu…</div>}

      {/* Grid */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} className="a-card" style={{ padding: 20, opacity: item.available === false ? 0.55 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                {item.image
                  ? <img src={imgSrc(item.image)} alt={item.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 12, border: "1px solid var(--a-border)" }} />
                  : <div style={{ fontSize: 36 }}>{item.emoji}</div>
                }
                <div style={{ display: "flex", gap: 6 }}>
                  {item.popular && <span className="status-badge status-confirmed" style={{ fontSize: 10 }}>Popular</span>}
                  <span className="status-badge" style={{ fontSize: 10, background: item.veg ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: item.veg ? "#34d399" : "#f87171", border: `1px solid ${item.veg ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                    {item.veg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 8, lineHeight: 1.5 }}>{item.desc}</div>
              {Array.isArray((item as any).allergens) && (item as any).allergens.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                  {((item as any).allergens as string[]).map(a => (
                    <span key={a} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontWeight: 600 }}>{a}</span>
                  ))}
                </div>
              )}
              {Array.isArray(item.variants) && item.variants.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {item.variants.map(v => (
                    <span key={v.label} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc", fontWeight: 600 }}>
                      {v.label} £{v.price.toFixed(2)}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "var(--a-orange-l)" }}>£{item.price.toFixed(2)}</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <div style={{ fontSize: 11, color: "var(--a-muted)", textTransform: "capitalize" }}>{item.category}</div>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: (item as any).availabilityType === "in-restaurant" ? "rgba(107,114,128,0.15)" : "rgba(16,185,129,0.12)", color: (item as any).availabilityType === "in-restaurant" ? "#9ca3af" : "#34d399", border: `1px solid ${(item as any).availabilityType === "in-restaurant" ? "rgba(107,114,128,0.25)" : "rgba(16,185,129,0.25)"}`, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {(item as any).availabilityType === "delivery" ? "🛵 Delivery" : (item as any).availabilityType === "in-restaurant" ? "🍽 Dine-in" : "🌐 Both"}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--a-border)", display: "flex", gap: 8, alignItems: "center" }}>
                <label className="a-toggle" title={item.available === false ? "Unavailable" : "Available"}>
                  <input type="checkbox" checked={item.available !== false} onChange={() => toggleAvailable(item.id, item.available)} />
                  <span className="a-toggle-slider" />
                </label>
                <span style={{ fontSize: 11, color: "var(--a-muted)", flex: 1 }}>{item.available === false ? "Unavailable" : "Live"}</span>
                <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => openEdit(item)}>Edit</button>
                <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 10px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }} onClick={() => deleteItem(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--a-muted)" }}>No items match your search.</div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: 16 }}>
          <div className="a-card" style={{ width: "100%", maxWidth: 580, padding: 28, margin: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>
              {editItem ? "Edit Menu Item" : "Add Menu Item"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Item Name</label>
                <input value={form.name} onChange={set("name")} placeholder="e.g. Chicken Biryani" />
              </div>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Description</label>
                <textarea value={form.desc} onChange={set("desc")} rows={2} placeholder="Short description…" />
              </div>
              <div className="a-field">
                <label>Price (£)</label>
                <input type="number" step="0.01" value={form.price} onChange={set("price")} placeholder="0.00" />
              </div>
              <div className="a-field">
                <label>Category</label>
                <select value={form.category} onChange={set("category")}>
                  {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="a-field">
                <label>Emoji</label>
                <input value={form.emoji} onChange={set("emoji")} placeholder="🍛" />
              </div>
              <div className="a-field">
                <label>Type</label>
                <select value={form.veg} onChange={set("veg")}>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label>Availability Type</label>
                <select value={form.availabilityType} onChange={set("availabilityType")}>
                  <option value="both">Both (In-Restaurant &amp; Online Delivery)</option>
                  <option value="delivery">Online Delivery Only</option>
                  <option value="in-restaurant">In-Restaurant Only</option>
                </select>
              </div>

              {/* Image upload */}
              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label style={{ marginBottom: 8, display: "block" }}>Item Photo <span style={{ fontWeight: 400, color: "var(--a-muted)", fontSize: 11 }}>(JPEG / PNG / WebP · max 5 MB)</span></label>
                {(imageUrl || pendingPreview) ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img src={imageUrl ? imgSrc(imageUrl) : pendingPreview!} alt="item" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12, border: "1px solid var(--a-border)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ cursor: "pointer" }}>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                        <span className="a-filter-btn" style={{ fontSize: 11, padding: "5px 12px", display: "inline-block" }}>
                          {imageUploading ? "Uploading…" : "Replace image"}
                        </span>
                      </label>
                      <button type="button" className="a-filter-btn" style={{ fontSize: 11, padding: "5px 12px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }} onClick={() => editItem ? removeImage() : clearPendingImage()}>
                        Remove
                      </button>
                      {!editItem && pendingPreview && (
                        <span style={{ fontSize: 10, color: "var(--a-muted)" }}>Uploads when you save</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0", borderRadius: 12, border: "2px dashed var(--a-border)", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span style={{ fontSize: 12, color: "var(--a-muted)", textAlign: "center" }}>
                      {imageUploading ? "Uploading…" : "Click to upload a photo"}
                    </span>
                  </label>
                )}
              </div>

              <div className="a-field" style={{ gridColumn: "span 2" }}>
                <label style={{ marginBottom: 8, display: "block" }}>Allergens (select all that apply)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(allergens.length > 0 ? allergens : FALLBACK_ALLERGENS).map(a => {
                    const active = form.allergens.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAllergen(a)}
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: active ? "1px solid rgba(245,158,11,0.6)" : "1px solid var(--a-border)",
                          background: active ? "rgba(245,158,11,0.15)" : "transparent",
                          color: active ? "#f59e0b" : "var(--a-muted)",
                          cursor: "pointer",
                          fontWeight: active ? 700 : 400,
                          transition: "all 120ms",
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
                {form.allergens.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--a-muted)" }}>
                    Selected: {form.allergens.join(", ")}
                  </div>
                )}
              </div>
            </div>
            {/* Variants Editor */}
            <div style={{ marginTop: 20, borderTop: "1px solid var(--a-border)", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Size / Quantity Variants</div>
                <button
                  type="button"
                  className="a-filter-btn"
                  style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => setVariants(prev => [...prev, { ...EMPTY_VARIANT }])}
                >
                  + Add Variant
                </button>
              </div>
              {variants.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--a-muted)", fontStyle: "italic" }}>
                  No variants — item has a single price. Add variants for items like "Half / Full" or "6 pcs / 10 pcs / 12 pcs".
                </div>
              )}
              {variants.map((v, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input
                    value={v.label}
                    onChange={e => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                    placeholder="Label (e.g. Half, 6 pcs)"
                    style={{ flex: 2, padding: "7px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 13 }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={v.price}
                    onChange={e => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                    placeholder="Price"
                    style={{ flex: 1, padding: "7px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "var(--a-red)", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {saveError && (
              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
                {saveError}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button className="a-filter-btn" onClick={() => { setShowModal(false); setSaveError(""); setVariants([]); setImageUrl(null); clearPendingImage(); }}>Cancel</button>
              <button className="admin-action-btn" onClick={saveItem} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : editItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCatModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="a-card" style={{ width: "100%", maxWidth: 460, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Manage Categories</div>
              <button onClick={() => setShowCatModal(false)} style={{ background: "none", border: "none", color: "var(--a-muted)", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--a-border)" }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: "var(--a-muted)" }}>Order: {cat.displayOrder}</span>
                  <button
                    className="a-filter-btn"
                    style={{ fontSize: 11, padding: "4px 8px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }}
                    onClick={() => deleteCategory(cat.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--a-border)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 10 }}>Add new category</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="a-input"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCategory()}
                  placeholder="Category name…"
                  style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 13 }}
                />
                <button className="admin-action-btn" onClick={addCategory} disabled={catSaving || !newCatName.trim()} style={{ opacity: catSaving ? 0.7 : 1 }}>
                  Add
                </button>
              </div>
              {catError && <div style={{ fontSize: 12, color: "var(--a-red)", marginTop: 8 }}>{catError}</div>}
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
