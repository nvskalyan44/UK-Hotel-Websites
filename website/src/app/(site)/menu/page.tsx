"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { SearchIcon, ForkIcon, ArrowIcon } from "@/components/ui/Icons";
import { useConfig } from "@/context/ConfigContext";
import { useIsMobile } from "@/lib/useIsMobile";
import type { MenuItem } from "@/lib/types";

export default function MenuPage() {
  const config = useConfig();
  const isMobile = useIsMobile();
  const [cat, setCat] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = ["All"];
    for (const m of items) {
      if (!seen.has(m.category)) { seen.add(m.category); cats.push(m.category); }
    }
    return cats;
  }, [items]);

  const allAllergens = useMemo(() => {
    const seen = new Set<string>();
    for (const m of items) {
      for (const a of m.allergens ?? []) seen.add(a);
    }
    return Array.from(seen).sort();
  }, [items]);

  const toggleAllergen = (allergen: string) => {
    setExcludedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(allergen)) next.delete(allergen);
      else next.add(allergen);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return items.filter((m) =>
      (cat === "All" || m.category === cat) &&
      (!search || m.name.toLowerCase().includes(search.toLowerCase())) &&
      (!vegOnly || m.veg === true) &&
      (excludedAllergens.size === 0 || !(m.allergens ?? []).some((a) => excludedAllergens.has(a)))
    );
  }, [items, cat, search, vegOnly, excludedAllergens]);

  return (
    <main>
      <section style={{ padding: "60px 0 32px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="pill" style={{ marginBottom: 24 }}><ForkIcon /> Our Menu · {items.length} dishes</span>
            <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>
              <span className="gradient-text">Plate by plate</span>, the South Indian classics.
            </h1>
            <p className="text-muted" style={{ fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
              From small plates to slow-cooked feasts. Tap any dish to add it to your basket.
            </p>
          </div>

          {/* Filter / search bar */}
          <div className="card" style={{ padding: 18, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: allAllergens.length > 0 ? 16 : 32 }}>
            <div style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "rgba(20, 8, 4, 0.5)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.1)" }}>
              <SearchIcon style={{ color: "var(--faint)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                style={{ flex: 1, padding: "8px 0", fontSize: 15 }}
              />
            </div>
            <div className="cat-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={"nav-tab" + (cat === c ? " active" : "")}
                  style={{ padding: "8px 16px", fontSize: 14 }}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={() => setVegOnly((v) => !v)}
                className={"nav-tab" + (vegOnly ? " active" : "")}
                style={{ padding: "8px 16px", fontSize: 14, borderColor: vegOnly ? "#22c55e" : undefined, color: vegOnly ? "#22c55e" : undefined }}
              >
                🌿 Veg only
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(20, 8, 4, 0.5)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.08)" }}>
              <button onClick={() => setView("grid")} className={"nav-tab" + (view === "grid" ? " active" : "")} style={{ padding: "6px 14px", fontSize: 13 }}>Grid</button>
              <button onClick={() => setView("list")} className={"nav-tab" + (view === "list" ? " active" : "")} style={{ padding: "6px 14px", fontSize: 13 }}>List</button>
            </div>
          </div>

          {/* Allergen filter */}
          {allAllergens.length > 0 && (
            <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                Exclude allergens:
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {allAllergens.map((allergen) => {
                  const active = excludedAllergens.has(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergen(allergen)}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 999,
                        cursor: "pointer",
                        border: active ? "1px solid #f59e0b" : "1px solid rgba(245,158,11,0.25)",
                        background: active ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.06)",
                        color: active ? "#f59e0b" : "rgba(245,158,11,0.7)",
                        transition: "all 120ms",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {active && (
                        <span style={{ fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✕</span>
                      )}
                      {allergen}
                    </button>
                  );
                })}
              </div>
              {excludedAllergens.size > 0 && (
                <button
                  type="button"
                  onClick={() => setExcludedAllergens(new Set())}
                  style={{ fontSize: 12, color: "var(--faint)", background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 4, textDecoration: "underline" }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>Loading menu…</div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 80, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🤔</div>
              <h3 style={{ fontSize: 24, marginBottom: 8 }}>No dishes match</h3>
              <p className="text-muted">Try a different category or search term.</p>
            </div>
          ) : isMobile ? (
            /* Mobile: Swiggy / Zomato style compact list (both toggle views) */
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filtered.map((m) => <MenuItemCard key={m.id} item={m} mode="list" />)}
            </div>
          ) : view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {filtered.map((m) => <MenuItemCard key={m.id} item={m} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filtered.map((m) => <MenuItemCard key={m.id} item={m} mode="row" />)}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "40px 0 60px" }}>
        <div className="container">
          <div className="card" style={{ padding: 40, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: 28, marginBottom: 6 }}>Ready to order?</h3>
              <p className="text-muted">Free delivery over £{config.freeDeliveryThreshold} · most orders out in 35 mins</p>
            </div>
            <Link href="/order" className="btn btn-primary btn-lg">Start your order <ArrowIcon /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
