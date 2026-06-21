"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { PlusIcon } from "@/components/ui/Icons";
import type { MenuItem, MenuVariant } from "@/lib/types";

// ─── Favourites helpers ───────────────────────────────────────────────────────

const FAV_LS_KEY = "abhi_favs";

function readFavsFromCache(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeFavsToCache(favs: Set<string>) {
  try {
    localStorage.setItem(FAV_LS_KEY, JSON.stringify(Array.from(favs)));
  } catch {}
}

// Singleton promise so all cards share a single API fetch per page load
let _favsPromise: Promise<Set<string>> | null = null;

function getFavsPromise(): Promise<Set<string>> {
  if (_favsPromise) return _favsPromise;
  _favsPromise = fetch("/api/my/favourites")
    .then((r) => {
      if (r.status === 401) return new Set<string>();
      return r.json().then((d) => {
        const ids = new Set<string>(d.menuItemIds ?? []);
        writeFavsToCache(ids);
        return ids;
      });
    })
    .catch(() => readFavsFromCache());
  return _favsPromise;
}

// ─── Heart Button ─────────────────────────────────────────────────────────────

function HeartButton({ itemId }: { itemId: string }) {
  const [favourited, setFavourited] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialise from cache first (instant), then confirm from server
    const cached = readFavsFromCache();
    if (cached.size > 0) setFavourited(cached.has(itemId));

    getFavsPromise().then((ids) => {
      setFavourited(ids.has(itemId));
    });
  }, [itemId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/my/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: itemId }),
      });
      if (res.status === 401) {
        // Not logged in — do nothing
        return;
      }
      const data = await res.json();
      setFavourited(data.favourited);
      // Update cache
      const current = readFavsFromCache();
      if (data.favourited) {
        current.add(itemId);
      } else {
        current.delete(itemId);
      }
      writeFavsToCache(current);
      // Bust the promise so next navigation gets fresh data
      _favsPromise = null;
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  if (favourited === null) return null; // don't show until we know state

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
        background: "rgba(13, 6, 4, 0.65)",
        border: "1px solid rgba(253, 186, 116, 0.12)",
        borderRadius: "50%",
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading ? "wait" : "pointer",
        fontSize: 17,
        lineHeight: 1,
        color: favourited ? "#ef4444" : "rgba(255,255,255,0.45)",
        transition: "color 150ms, transform 150ms",
        transform: loading ? "scale(0.88)" : "scale(1)",
        backdropFilter: "blur(4px)",
      }}
    >
      {favourited ? "♥" : "♡"}
    </button>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ avg, count }: { avg: number; count: number }) {
  if (!avg || count === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, marginBottom: 2 }}>
      <span style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{avg.toFixed(1)}</span>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>({count})</span>
    </div>
  );
}

// ─── Variant Modal ────────────────────────────────────────────────────────────

function VariantModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const cart = useCart();
  const variants = item.variants!;
  const [selected, setSelected] = useState<MenuVariant>(variants[0]);
  const cartId = `${item.id}:${selected.label}`;
  const inCart = cart.items.find(x => x.id === cartId);

  const handleAdd = () => {
    cart.add(item, 1, selected);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0 0" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--card-bg, #1c120a)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, padding: "28px 24px 36px", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

        {/* Item header */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 56, lineHeight: 1, width: 60, height: 60, borderRadius: 14, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.emoji}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{item.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.45 }}>{item.desc}</div>
          </div>
        </div>

        {/* Variant options */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Choose size / quantity
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {variants.map(v => {
            const isSelected = selected.label === v.label;
            const vCartId = `${item.id}:${v.label}`;
            const vInCart = cart.items.find(x => x.id === vCartId);
            return (
              <button
                key={v.label}
                type="button"
                onClick={() => setSelected(v)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                  border: isSelected ? "1.5px solid rgba(234,88,12,0.7)" : "1.5px solid rgba(255,255,255,0.1)",
                  background: isSelected ? "rgba(234,88,12,0.12)" : "rgba(255,255,255,0.04)",
                  transition: "all 120ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: isSelected ? "5px solid #ea580c" : "2px solid rgba(255,255,255,0.3)",
                    transition: "all 120ms", flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: 15 }}>{v.label}</span>
                  {vInCart && (
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: "rgba(234,88,12,0.15)", color: "#fb923c", fontWeight: 600 }}>
                      ×{vInCart.qty} in cart
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: isSelected ? "#fb923c" : "inherit" }}>
                  £{v.price.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add / stepper */}
        {inCart ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <QtyStepper qty={inCart.qty} onChange={q => cart.setQty(cartId, q)} size="lg" />
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "14px 0" }}
            onClick={() => { handleAdd(); onClose(); }}
          >
            <PlusIcon width={18} height={18} /> Add to Cart — £{selected.price.toFixed(2)}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MenuItemCard ─────────────────────────────────────────────────────────────

interface MenuItemCardProps {
  item: MenuItem;
  mode?: "card" | "row";
}

export function MenuItemCard({ item, mode = "card" }: MenuItemCardProps) {
  const cart = useCart();
  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
  const [showModal, setShowModal] = useState(false);
  const unavailable = item.available === false;

  // For items without variants use simple direct ID
  const inCart = hasVariants ? null : cart.items.find(x => x.id === item.id);
  // For cards with variants, check if any variant is in cart (for badge display)
  const anyVariantInCart = hasVariants ? cart.items.some(x => x.id.startsWith(`${item.id}:`)) : false;
  const variantCartCount = hasVariants ? cart.items.filter(x => x.id.startsWith(`${item.id}:`)).reduce((s, x) => s + x.qty, 0) : 0;

  const fromPrice = hasVariants ? Math.min(...item.variants!.map(v => v.price)) : item.price;

  if (mode === "row") {
    return (
      <>
        <div className="card card-hover" style={{ padding: 20, display: "flex", gap: 18, alignItems: "center", opacity: unavailable ? 0.5 : 1, pointerEvents: unavailable ? "none" : undefined, position: "relative" }}>
          <HeartButton itemId={item.id} />
          <div style={{ width: 80, height: 80, borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(234,88,12,0.1))", border: "1px solid rgba(253,186,116,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, flexShrink: 0 }}>
            {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span className={"dot " + (item.veg ? "dot-veg" : "dot-nonveg")} />
              <h4 style={{ fontSize: 19, margin: 0 }}>{item.name}</h4>
              {item.popular && <span className="badge badge-hot" style={{ fontSize: 10, padding: "3px 8px" }}>POPULAR</span>}
              {unavailable && <span className="badge" style={{ fontSize: 10, padding: "3px 8px", background: "rgba(107,114,128,0.2)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.3)" }}>Unavailable</span>}
            </div>
            {item.avgRating !== undefined && item.reviewCount !== undefined && item.reviewCount > 0 && (
              <StarRating avg={item.avgRating} count={item.reviewCount} />
            )}
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 520 }}>{item.desc}</p>
            {item.allergens && item.allergens.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {item.allergens.map(a => (
                  <span key={a} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.03em" }}>{a}</span>
                ))}
              </div>
            )}
            {hasVariants && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                {item.variants!.map(v => v.label).join(" · ")}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <div className="text-orange" style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--display)" }}>
              {hasVariants ? `from £${fromPrice.toFixed(2)}` : `£${item.price.toFixed(2)}`}
            </div>
            {!unavailable && !hasVariants && (inCart ? (
              <QtyStepper qty={inCart.qty} onChange={q => cart.setQty(item.id, q)} size="sm" />
            ) : (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => cart.add(item)}>
                <PlusIcon width={16} height={16} /> Add
              </button>
            ))}
            {!unavailable && hasVariants && (
              anyVariantInCart ? (
                <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowModal(true)} style={{ position: "relative" }}>
                  <PlusIcon width={16} height={16} /> Add
                  <span style={{ position: "absolute", top: -6, right: -6, background: "#ea580c", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{variantCartCount}</span>
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowModal(true)}>
                  <PlusIcon width={16} height={16} /> Add
                </button>
              )
            )}
            {unavailable && (
              <button className="btn btn-sm" type="button" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
                <PlusIcon width={16} height={16} /> Add
              </button>
            )}
          </div>
        </div>
        {showModal && <VariantModal item={item} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="card card-hover" style={{ padding: 22, display: "flex", flexDirection: "column", opacity: unavailable ? 0.5 : 1, pointerEvents: unavailable ? "none" : undefined, position: "relative" }}>
        <HeartButton itemId={item.id} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingRight: 42 }}>
          <span className={"badge " + (item.veg ? "badge-veg" : "badge-nonveg")}>
            <span className={"dot " + (item.veg ? "dot-veg" : "dot-nonveg")} />
            {item.veg ? "Veg" : "Non-veg"}
          </span>
          {unavailable && <span className="badge" style={{ background: "rgba(107,114,128,0.2)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.3)" }}>Unavailable</span>}
          {!unavailable && item.popular && <span className="badge badge-hot">🔥 Popular</span>}
        </div>
        <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 74, marginBottom: 10, borderRadius: 14, overflow: "hidden" }}>
          {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.emoji}
        </div>
        <h4 style={{ fontSize: 22, marginBottom: 4 }}>{item.name}</h4>
        {item.avgRating !== undefined && item.reviewCount !== undefined && item.reviewCount > 0 && (
          <StarRating avg={item.avgRating} count={item.reviewCount} />
        )}
        <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: item.allergens && item.allergens.length > 0 ? 10 : 18, marginTop: 6, minHeight: 40 }}>{item.desc}</p>
        {item.allergens && item.allergens.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
            {item.allergens.map(a => (
              <span key={a} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.03em" }}>{a}</span>
            ))}
          </div>
        )}
        {hasVariants && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            {item.variants!.map(v => v.label).join(" · ")}
          </div>
        )}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="text-orange" style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--display)" }}>
            {hasVariants ? `from £${fromPrice.toFixed(2)}` : `£${item.price.toFixed(2)}`}
          </span>
          {!unavailable && !hasVariants && (inCart ? (
            <QtyStepper qty={inCart.qty} onChange={q => cart.setQty(item.id, q)} size="sm" />
          ) : (
            <button className="btn btn-primary btn-sm" type="button" onClick={() => cart.add(item)}>
              <PlusIcon width={16} height={16} /> Add
            </button>
          ))}
          {!unavailable && hasVariants && (
            anyVariantInCart ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowModal(true)} style={{ position: "relative" }}>
                <PlusIcon width={16} height={16} /> Add
                <span style={{ position: "absolute", top: -6, right: -6, background: "#ea580c", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{variantCartCount}</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowModal(true)}>
                <PlusIcon width={16} height={16} /> Add
              </button>
            )
          )}
          {unavailable && (
            <button className="btn btn-sm" type="button" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
              <PlusIcon width={16} height={16} /> Add
            </button>
          )}
        </div>
      </div>
      {showModal && <VariantModal item={item} onClose={() => setShowModal(false)} />}
    </>
  );
}
