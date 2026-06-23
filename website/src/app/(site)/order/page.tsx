"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { TotalsBlock } from "@/components/ui/TotalsBlock";
import { CheckIcon, ArrowIcon, ApplePayMark } from "@/components/ui/Icons";
import { PayPalButtons } from "@/components/ui/PayPalButtons";
import { StripeApplePayButton } from "@/components/ui/StripeApplePayButton";
import { useConfig } from "@/context/ConfigContext";
import type { MenuItem, OrderDetails, PaymentMethod, PlacedOrder, OrderStage } from "@/lib/types";

/* ── Helpers ── */

function Spinner() {
  return (
    <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
  );
}


function PayPalMark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ fontWeight: 900, fontSize: size * 0.72, letterSpacing: "-0.02em", lineHeight: 1 }}>
      <span style={{ color: "#003087" }}>Pay</span>
      <span style={{ color: "#009cde" }}>Pal</span>
    </span>
  );
}

/* ── Stepper ── */

const STEPS = [
  { id: "build",   label: "Build your order", n: 1 },
  { id: "details", label: "Delivery details",  n: 2 },
  { id: "payment", label: "Payment",            n: 3 },
  { id: "confirm", label: "Confirmation",       n: 4 },
] as const;

function Stepper({ stage }: { stage: OrderStage }) {
  const idx = STEPS.findIndex((s) => s.id === stage);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <span key={s.id} style={{ display: "contents" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done ? "var(--green-500)" : active ? "linear-gradient(135deg, var(--orange-500), var(--orange-600))" : "rgba(40, 18, 8, 0.7)",
                border: active ? "none" : "1px solid rgba(253, 186, 116, 0.15)",
                color: done || active ? "white" : "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
                boxShadow: active ? "0 8px 24px rgba(234, 88, 12, 0.4)" : "none",
                transition: "all 200ms",
              }}>
                {done ? <CheckIcon width={16} height={16} /> : s.n}
              </div>
              <span style={{ fontSize: 14, fontWeight: active || done ? 600 : 400, color: active ? "var(--orange-300)" : done ? "var(--ink)" : "var(--muted)" }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 40, height: 1, background: i < idx ? "var(--green-500)" : "rgba(253, 186, 116, 0.15)" }} />}
          </span>
        );
      })}
    </div>
  );
}

/* ── Basket sidebar ── */

function BasketSidebar({ onNext, onBrowse }: { onNext: () => void; onBrowse: () => void }) {
  const cart = useCart();
  const config = useConfig();
  const [code, setCode] = useState("");
  const [quickCoupons, setQuickCoupons] = useState<{ code: string }[]>([]);
  const tooLow = cart.subtotal > 0 && cart.subtotal < config.minOrder;
  const empty = cart.items.length === 0;

  useEffect(() => {
    fetch("/api/offers")
      .then(r => r.ok ? r.json() : [])
      .then((cs: { code: string }[]) => setQuickCoupons(cs.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h3 style={{ fontSize: 24 }}>Your basket</h3>
        <span className="text-muted" style={{ fontSize: 13 }}>{cart.count} item{cart.count === 1 ? "" : "s"}</span>
      </div>

      {empty ? (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
          <p className="text-muted" style={{ fontSize: 14 }}>Add some dishes to get started.</p>
        </div>
      ) : (
        <>
          <div className="scroll-y" style={{ maxHeight: 280, marginBottom: 18, paddingRight: 4 }}>
            {cart.items.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(253, 186, 116, 0.06)" }}>
                <div style={{ fontSize: 28 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                  <div className="text-orange" style={{ fontSize: 13, fontWeight: 700 }}>£{(item.price * item.qty).toFixed(2)}</div>
                  <div style={{ marginTop: 6 }}>
                    <QtyStepper qty={item.qty} onChange={(q) => cart.setQty(item.id, q)} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div style={{ marginBottom: 18 }}>
            {!cart.appliedCoupon ? (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="field-input" style={{ flex: 1, padding: "10px 14px", fontSize: 14 }} placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => cart.applyCoupon(code)}>Apply</button>
                </div>
                {quickCoupons.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {quickCoupons.map((c) => (
                      <button key={c.code} type="button" onClick={() => cart.applyCoupon(c.code)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700, borderRadius: 999, background: "rgba(234, 88, 12, 0.12)", border: "1px dashed rgba(253, 186, 116, 0.3)", color: "var(--orange-300)", letterSpacing: "0.05em" }}>{c.code}</button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#4ade80", fontSize: 13 }}><b>{cart.appliedCoupon.code}</b> applied</span>
                <button type="button" onClick={() => cart.setCoupon("")} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
              </div>
            )}
          </div>

          <TotalsBlock />

          {tooLow && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.25)", fontSize: 13, color: "var(--yellow-300)" }}>
              ⚠️ Add £{(config.minOrder - cart.subtotal).toFixed(2)} more to meet the £{config.minOrder} minimum order.
            </div>
          )}
          {!tooLow && cart.subtotal > 0 && cart.subtotal < config.freeDeliveryThreshold && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(234, 88, 12, 0.08)", border: "1px solid rgba(234, 88, 12, 0.2)", fontSize: 13, color: "var(--orange-300)" }}>
              🚲 Add £{(config.freeDeliveryThreshold - cart.subtotal).toFixed(2)} more for free delivery.
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 18, opacity: tooLow ? 0.5 : 1, cursor: tooLow ? "not-allowed" : "pointer" }}
            disabled={tooLow}
            onClick={onNext}
          >
            Continue to delivery <ArrowIcon />
          </button>
        </>
      )}

      {empty && (
        <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8 }} type="button" onClick={onBrowse}>
          Browse the full menu
        </button>
      )}
    </div>
  );
}

/* ── Order summary card ── */

function OrderSummaryCard({ details, showCoupon = false }: { details?: OrderDetails; showCoupon?: boolean }) {
  const cart = useCart();
  return (
    <div className="card" style={{ padding: 28 }}>
      <h3 style={{ fontSize: 22, marginBottom: 18 }}>Order summary</h3>
      <div className="scroll-y" style={{ maxHeight: 220, marginBottom: 14, paddingRight: 4 }}>
        {cart.items.map((item) => (
          <div key={item.id} style={{ display: "flex", gap: 10, padding: "8px 0", fontSize: 14 }}>
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>× {item.qty}</div>
            </div>
            <div className="text-orange" style={{ fontWeight: 700 }}>£{(item.price * item.qty).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="divider" style={{ margin: "12px 0" }} />
      <TotalsBlock showCouponInput={showCoupon} />
      {details && (
        <>
          <div className="divider" style={{ margin: "16px 0" }} />
          <div style={{ fontSize: 13 }} className="text-muted">
            <div style={{ marginBottom: 6 }}>
              <b style={{ color: "var(--ink-dim)" }}>{details.type === "delivery" ? "🚲 Delivering to" : "🏪 Collection by"}:</b> {details.name}
            </div>
            {details.type === "delivery" && <div>{details.address}, {details.postcode}</div>}
            <div>{details.time === "asap" ? "ASAP" : "Scheduled: " + details.scheduledTime}</div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Stage 1: Build ── */

function BuildStage({ onNext, onBrowse }: { onNext: () => void; onBrowse: () => void }) {
  const config = useConfig();
  const [cat, setCat] = useState("All");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.ok ? r.json() : [])
      .then((items: MenuItem[]) => {
        setMenu(items);
        const seen = new Set<string>();
        const cats: string[] = ["All"];
        for (const m of items) {
          if (!seen.has(m.category)) { seen.add(m.category); cats.push(m.category); }
        }
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => cat === "All" ? menu : menu.filter((m) => m.category === cat), [cat, menu]);

  return (
    <div className="grid-order">
      <div>
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", marginBottom: 8 }}>
          Start your <span className="gradient-text">order</span>.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>
          Pick from {menu.length} dishes. Min order £{config.minOrder}. Free delivery over £{config.freeDeliveryThreshold}.
        </p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, padding: 10, background: "rgba(20, 8, 4, 0.4)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.08)" }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={"nav-tab" + (cat === c ? " active" : "")} style={{ padding: "8px 18px", fontSize: 14 }}>{c}</button>
          ))}
        </div>

        {menu.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading menu…</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {filtered.map((m) => <MenuItemCard key={m.id} item={m} mode="row" />)}
          </div>
        )}
      </div>

      <div className="order-sticky">
        <BasketSidebar onNext={onNext} onBrowse={onBrowse} />
      </div>
    </div>
  );
}

/* ── Stage 2: Details ── */

function detailsDefaults(): OrderDetails {
  return { type: "delivery", name: "", phone: "", email: "", address: "", postcode: "", time: "asap", scheduledTime: "", instructions: "" };
}

function buildScheduledSlots(): { date: string; label: string }[] {
  const dates: { date: string; label: string }[] = [];
  const today = new Date();
  for (let d = 0; d <= 7; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() + d);
    const iso = day.toISOString().split("T")[0];
    const label = d === 0 ? "Today" : d === 1 ? "Tomorrow" : day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    dates.push({ date: iso, label });
  }
  return dates;
}

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 12; h < 22; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  slots.push("22:00");
  return slots;
}

function DetailsStage({ onBack, onNext }: { onBack: () => void; onNext: (d: OrderDetails) => void }) {
  const { user } = useUser();
  const cart = useCart();
  const config = useConfig();
  const [details, setDetails] = useState<OrderDetails>(() => {
    if (typeof window === "undefined") return detailsDefaults();
    try { return JSON.parse(localStorage.getItem("abhi_details") || "null") ?? detailsDefaults(); } catch { return detailsDefaults(); }
  });
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);
  const [schedDate, setSchedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [schedTime, setSchedTime] = useState("12:00");

  // Postcode validation state
  const [postcodeStatus, setPostcodeStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [postcodeMsg, setPostcodeMsg] = useState("");

  const scheduledSlots = buildScheduledSlots();
  const timeSlots = buildTimeSlots();

  // Sync order type to cart so delivery fee updates reactively
  useEffect(() => {
    cart.setOrderType(details.type as "delivery" | "collection");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details.type]);

  // Sync loyalty discount to cart so total updates reactively
  const loyaltyPoints = user?.loyaltyPoints ?? 0;
  useEffect(() => {
    cart.setLoyaltyPointsUsed(loyaltyApplied ? loyaltyPoints : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loyaltyApplied, loyaltyPoints]);

  // Autofill contact fields from logged-in user (only if fields are still empty)
  useEffect(() => {
    if (!user) return;
    setDetails((d) => ({
      ...d,
      name:  d.name  || user.name,
      email: d.email || user.email,
      phone: d.phone || user.phone || "",
    }));
  }, [user]);

  // On mount, sync stored order type to cart
  useEffect(() => {
    cart.setOrderType(details.type as "delivery" | "collection");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof OrderDetails>(k: K, v: OrderDetails[K]) => setDetails((d) => ({ ...d, [k]: v }));

  // Validate postcode on blur
  const handlePostcodeBlur = async () => {
    const postcode = details.postcode.trim();
    if (!postcode || details.type !== "delivery") return;
    setPostcodeStatus("checking");
    setPostcodeMsg("");
    try {
      const res = await fetch("/api/settings/delivery-zones");
      const zones: { prefix: string; label: string; fee: number }[] = res.ok ? await res.json() : [];
      if (zones.length === 0) {
        // No zones configured — allow all postcodes, use default fee
        setPostcodeStatus("valid");
        setPostcodeMsg("Delivery available");
        cart.setDeliveryFeeOverride(null);
        return;
      }
      const prefix = postcode.replace(/\s+/g, "").replace(/[0-9][A-Z]{2}$/, "").toUpperCase();
      const match = zones.find((z) => prefix.toUpperCase().startsWith(z.prefix.toUpperCase()));
      if (match) {
        setPostcodeStatus("valid");
        setPostcodeMsg(`Delivery available to ${match.label} — £${match.fee.toFixed(2)}`);
        cart.setDeliveryFeeOverride(match.fee);
      } else {
        setPostcodeStatus("invalid");
        setPostcodeMsg("Sorry, we don't deliver to this postcode yet.");
        cart.setDeliveryFeeOverride(null);
      }
    } catch {
      setPostcodeStatus("idle");
    }
  };

  const valid = !!(
    details.name && details.phone && details.email &&
    (details.type === "collection" || (details.address && details.postcode && postcodeStatus !== "invalid"))
  );

  const loyaltyDiscount = cart.loyaltyDiscount;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const scheduledTime = details.time === "scheduled" ? `${schedDate}T${schedTime}` : "";
    const finalDetails: OrderDetails = {
      ...details,
      scheduledTime,
      loyaltyPointsUsed: loyaltyApplied ? loyaltyPoints : 0,
    };
    localStorage.setItem("abhi_details", JSON.stringify(finalDetails));
    onNext(finalDetails);
  };

  return (
    <div className="grid-order">
      <form onSubmit={submit}>
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", marginBottom: 8 }}>
          <span className="gradient-text">Delivery</span> details.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>Tell us where to send the food.</p>

        {/* Order type */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="field-label" style={{ marginBottom: 14 }}>Order type</div>
          <div className="grid-2col" style={{ gap: 12 }}>
            {[
              { id: "delivery"   as const, icon: "🚲", title: "Delivery",   sub: `£${config.deliveryCharge} · ${config.deliveryEstimateMinutes} min` },
              { id: "collection" as const, icon: "🏪", title: "Collection", sub: `FREE · ${config.collectionEstimateMinutes} min` },
            ].map((o) => (
              <button key={o.id} type="button" onClick={() => set("type", o.id)} style={{
                padding: 20, borderRadius: 16, textAlign: "left",
                background: details.type === o.id ? "rgba(234, 88, 12, 0.15)" : "rgba(20, 8, 4, 0.4)",
                border: "1px solid " + (details.type === o.id ? "var(--orange-500)" : "rgba(253, 186, 116, 0.1)"),
                transition: "all 160ms",
              }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>{o.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{o.title}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{o.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 19, marginBottom: 16 }}>Contact</h3>
          <div style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label className="field-label">Full name</label>
              <input className="field-input" required value={details.name} onChange={(e) => set("name", e.target.value)} placeholder="Sarah Mitchell" />
            </div>
            <div className="grid-2col" style={{ gap: 14 }}>
              <div className="field">
                <label className="field-label">Phone</label>
                <input className="field-input" required value={details.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07712 345 678" />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input className="field-input" type="email" required value={details.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        {details.type === "delivery" && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 16 }}>Delivery address</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div className="field">
                <label className="field-label">Street address</label>
                <input className="field-input" required value={details.address} onChange={(e) => set("address", e.target.value)} placeholder="12 Sharrow Vale Road" />
              </div>
              <div className="field" style={{ maxWidth: 200 }}>
                <label className="field-label">Postcode</label>
                <input
                  className="field-input"
                  required
                  value={details.postcode}
                  onChange={(e) => { set("postcode", e.target.value.toUpperCase()); setPostcodeStatus("idle"); setPostcodeMsg(""); }}
                  onBlur={handlePostcodeBlur}
                  placeholder="S11 8ZF"
                  style={{ borderColor: postcodeStatus === "invalid" ? "#ef4444" : postcodeStatus === "valid" ? "#10b981" : undefined }}
                />
                {postcodeStatus === "checking" && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Checking…</div>}
                {postcodeStatus === "valid" && <div style={{ fontSize: 12, color: "#34d399", marginTop: 4 }}>✓ {postcodeMsg}</div>}
                {postcodeStatus === "invalid" && <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>✗ {postcodeMsg}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Timing */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 19, marginBottom: 16 }}>When?</h3>
          <div className="grid-2col" style={{ gap: 12, marginBottom: 14 }}>
            {[
              { id: "asap"      as const, title: "As soon as possible", sub: details.type === "delivery" ? `~ ${config.deliveryEstimateMinutes} min` : `~ ${config.collectionEstimateMinutes} min` },
              { id: "scheduled" as const, title: "Schedule for later",   sub: "Pick a time" },
            ].map((o) => (
              <button key={o.id} type="button" onClick={() => set("time", o.id)} style={{
                padding: 16, borderRadius: 14, textAlign: "left",
                background: details.time === o.id ? "rgba(234, 88, 12, 0.15)" : "rgba(20, 8, 4, 0.4)",
                border: "1px solid " + (details.time === o.id ? "var(--orange-500)" : "rgba(253, 186, 116, 0.1)"),
              }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{o.title}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{o.sub}</div>
              </button>
            ))}
          </div>
          {details.time === "scheduled" && (
            <div className="grid-2col" style={{ gap: 12 }}>
              <div className="field">
                <label className="field-label">Date</label>
                <select className="field-input" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}>
                  {scheduledSlots.map((s) => (
                    <option key={s.date} value={s.date}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Time</label>
                <select className="field-input" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Loyalty points */}
        {user && loyaltyPoints > 0 && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 14 }}>Loyalty points</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  You have <span className="text-orange">{loyaltyPoints.toLocaleString()} pts</span>
                  {" — "}
                  redeem for <span className="text-orange">£{Math.floor(loyaltyPoints / 100).toFixed(2)} off</span>
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{config.loyaltyPointsPerPound} pts = £1.00</div>
              </div>
              <button
                type="button"
                onClick={() => setLoyaltyApplied((v) => !v)}
                className={loyaltyApplied ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                style={{ borderColor: loyaltyApplied ? undefined : "rgba(234,88,12,0.4)", color: loyaltyApplied ? undefined : "var(--orange-300)" }}
              >
                {loyaltyApplied ? `✓ £${loyaltyDiscount.toFixed(2)} applied` : "Apply points"}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="field">
            <label className="field-label">Notes for the kitchen (optional)</label>
            <textarea className="field-textarea" value={details.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Extra spicy, no coriander, leave at the door…" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={onBack}>← Back to basket</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
            Continue to payment <ArrowIcon />
          </button>
        </div>
      </form>

      <div className="order-sticky">
        <OrderSummaryCard />
      </div>
    </div>
  );
}

/* ── Stage 3: Payment ── */

function PaymentStage({ onBack, details, onComplete }: { onBack: () => void; details: OrderDetails; onComplete: (o: PlacedOrder) => void }) {
  const cart = useCart();
  const [method, setMethod] = useState<PaymentMethod>("paypal");
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Gift voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherStatus, setVoucherStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const voucherDiscount = appliedVoucher ? Math.min(voucherBalance, cart.total) : 0;

  const handleVoucherApply = async () => {
    if (!voucherCode.trim()) return;
    setVoucherStatus("checking");
    try {
      const res = await fetch(`/api/gift-vouchers/validate?code=${encodeURIComponent(voucherCode.trim())}`);
      const data = await res.json();
      if (data.valid) {
        setVoucherStatus("valid");
        setVoucherBalance(data.balance);
        setAppliedVoucher(data.code);
      } else {
        setVoucherStatus("invalid");
        setVoucherBalance(0);
        setAppliedVoucher(null);
      }
    } catch {
      setVoucherStatus("invalid");
    }
  };

  const placeOrder = async (stripePaymentIntentId?: string, paypalOrderId?: string) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        couponCode: cart.appliedCoupon?.code,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        paymentMethod: method,
        stripePaymentIntentId,
        paypalOrderId,
        details,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order failed");
    return data;
  };

  const handlePayPalApprove = async (paypalOrderId: string) => {
    setProcessing(true);
    setError("");
    try {
      const captureRes = await fetch("/api/payment/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: paypalOrderId }),
      });
      const captureData = await captureRes.json();
      if (!captureRes.ok) throw new Error(captureData.error || "Payment capture failed");

      const data = await placeOrder(undefined, paypalOrderId);
      const placed: PlacedOrder = {
        id: data.id,
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        coupon: cart.appliedCoupon?.code,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        method,
        details,
        eta: data.eta,
        placedAt: new Date().toISOString(),
      };
      cart.clear();
      onComplete(placed);
    } catch (err: any) {
      setError(err.message || "PayPal payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const handleApplePaySuccess = async (paymentIntentId: string) => {
    setProcessing(true);
    setError("");
    try {
      const data = await placeOrder(paymentIntentId);
      const placed: PlacedOrder = {
        id: data.id,
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        coupon: cart.appliedCoupon?.code,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        method,
        details,
        eta: data.eta,
        placedAt: new Date().toISOString(),
      };
      cart.clear();
      onComplete(placed);
    } catch (err: any) {
      setError(err.message || "Apple Pay payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setProcessing(true);
    setError("");
    try {
      const data = await placeOrder(undefined);
      const placed: PlacedOrder = {
        id: data.id,
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        coupon: cart.appliedCoupon?.code,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        method,
        details,
        eta: data.eta,
        placedAt: new Date().toISOString(),
      };
      cart.clear();
      onComplete(placed);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="grid-order">
      <form onSubmit={submit}>
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", marginBottom: 8 }}>
          <span className="gradient-text">Payment</span>.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>Secured by 256-bit SSL · We never store your card details.</p>

        {/* Method */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="field-label" style={{ marginBottom: 14 }}>Payment method</div>
          <div className="grid-2col" style={{ gap: 12 }}>
            {([
              { id: "paypal"   as const, icon: null,   title: "PayPal" },
              { id: "applepay" as const, icon: null,   title: "Apple Pay" },
              { id: "cash"     as const, icon: "💷",  title: `Cash on ${details.type}` },
            ]).map((m) => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)} style={{
                padding: 18, borderRadius: 14, textAlign: "center",
                background: method === m.id ? "rgba(234, 88, 12, 0.15)" : "rgba(20, 8, 4, 0.4)",
                border: "1px solid " + (method === m.id ? "var(--orange-500)" : "rgba(253, 186, 116, 0.1)"),
              }}>
                <div style={{ fontSize: 26, marginBottom: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 32 }}>
                  {m.id === "applepay" ? <ApplePayMark size={22} /> : m.id === "paypal" ? <PayPalMark size={22} /> : m.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
              </button>
            ))}
          </div>
        </div>

        {method === "applepay" && (
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <ApplePayMark size={26} /> Apple Pay
            </h3>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 0 }}>
              Tap the button below to pay with Face ID or Touch ID. Your order is placed only after payment is confirmed.
            </p>
          </div>
        )}

        {method === "paypal" && (
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
              <PayPalMark size={24} />
            </h3>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 0 }}>
              You&apos;ll be taken to PayPal to complete payment securely. After approval, your order is placed automatically.
            </p>
          </div>
        )}

        {method === "cash" && (
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 8 }}>💷 Pay on {details.type}</h3>
            <p className="text-muted" style={{ fontSize: 14 }}>
              {details.type === "delivery"
                ? `Have £${cart.total.toFixed(2)} ready for the rider. Card machine available if you'd prefer.`
                : "Pay at the counter when you collect. Card or contactless welcome."}
            </p>
          </div>
        )}

        {/* Gift Voucher */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 19, marginBottom: 14 }}>🎁 Gift Voucher</h3>
          {appliedVoucher ? (
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>{appliedVoucher} applied</div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                  Balance: £{voucherBalance.toFixed(2)} · Saving: £{voucherDiscount.toFixed(2)}
                </div>
              </div>
              <button type="button" onClick={() => { setAppliedVoucher(null); setVoucherCode(""); setVoucherStatus("idle"); setVoucherBalance(0); }} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="field-input"
                  style={{ flex: 1, padding: "10px 14px", fontSize: 14 }}
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus("idle"); }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleVoucherApply} disabled={voucherStatus === "checking"}>
                  {voucherStatus === "checking" ? "…" : "Apply"}
                </button>
              </div>
              {voucherStatus === "invalid" && (
                <div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>Invalid or expired voucher code.</div>
              )}
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Don&apos;t have one? <Link href="/gift-vouchers" style={{ color: "var(--orange-300)" }} target="_blank">Buy a gift voucher</Link>
              </div>
            </>
          )}
        </div>

        {/* T&Cs */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: "rgba(20, 8, 4, 0.4)", borderRadius: 14, border: "1px solid rgba(253, 186, 116, 0.1)", marginBottom: 20, cursor: "pointer" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: "var(--orange-500)" }} />
          <span style={{ fontSize: 14, lineHeight: 1.5 }} className="text-muted">
            I confirm my order is correct, agree to Abhiruchi&apos;s terms of service, and consent to my data being used to fulfil this order.
          </span>
        </label>

        {error && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}

        {method === "paypal" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {processing ? (
              <div style={{ padding: 20, textAlign: "center", borderRadius: 14, background: "rgba(20, 8, 4, 0.4)", border: "1px solid rgba(253, 186, 116, 0.1)" }}>
                <Spinner /> <span style={{ marginLeft: 10, fontSize: 14, color: "var(--ink-dim)" }}>Processing your PayPal payment…</span>
              </div>
            ) : (
              <PayPalButtons
                amount={cart.total}
                disabled={!agreed}
                onApprove={handlePayPalApprove}
                onError={(msg) => setError(msg)}
                onCancel={() => setError("")}
              />
            )}
            <button type="button" className="btn btn-ghost" onClick={onBack} style={{ alignSelf: "flex-start" }}>← Back</button>
          </div>
        ) : method === "applepay" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {processing ? (
              <div style={{ padding: 20, textAlign: "center", borderRadius: 14, background: "rgba(20, 8, 4, 0.4)", border: "1px solid rgba(253, 186, 116, 0.1)" }}>
                <Spinner /> <span style={{ marginLeft: 10, fontSize: 14, color: "var(--ink-dim)" }}>Processing Apple Pay…</span>
              </div>
            ) : (
              <StripeApplePayButton
                amount={cart.total}
                agreed={agreed}
                onSuccess={handleApplePaySuccess}
                onError={(msg) => setError(msg)}
                onProcessingChange={setProcessing}
              />
            )}
            <button type="button" className="btn btn-ghost" onClick={onBack} style={{ alignSelf: "flex-start" }}>← Back</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, opacity: (agreed && !processing) ? 1 : 0.5, cursor: (agreed && !processing) ? "pointer" : "not-allowed" }} disabled={!agreed || processing}>
              {processing ? <><Spinner /> Processing payment…</> : <>🔒 Place order · £{cart.total.toFixed(2)}</>}
            </button>
          </div>
        )}
      </form>

      <div className="order-sticky">
        <OrderSummaryCard details={details} showCoupon={true} />
      </div>
    </div>
  );
}

/* ── Stage 4: Confirmation ── */

function ConfirmationView({ order, onReset }: { order: PlacedOrder; onReset: () => void }) {
  const config = useConfig();
  const [stepIdx, setStepIdx] = useState(0);
  const router = useRouter();

  const trackingSteps = order.details.type === "delivery"
    ? [
        { label: "Order received",           icon: "📋", time: "Just now" },
        { label: "Preparing in the kitchen", icon: "👨‍🍳", time: "~ 5 min" },
        { label: "Out for delivery",         icon: "🚲", time: "~ 25 min" },
        { label: "Delivered",                icon: "🎉", time: `~ ${order.eta} min` },
      ]
    : [
        { label: "Order received",           icon: "📋", time: "Just now" },
        { label: "Preparing in the kitchen", icon: "👨‍🍳", time: "~ 5 min" },
        { label: "Ready for collection",     icon: "🎉", time: `~ ${order.eta} min` },
      ];

  useEffect(() => {
    const t = setTimeout(() => { if (stepIdx === 0) setStepIdx(1); }, 1800);
    return () => clearTimeout(t);
  }, [stepIdx]);

  return (
    <section style={{ padding: "60px 0" }}>
      <div className="container" style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Hero */}
        <div className="card" style={{ padding: 48, textAlign: "center", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(234, 88, 12, 0.08))", borderColor: "rgba(16, 185, 129, 0.25)", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--green-500), var(--green-400))", color: "white", marginBottom: 24, boxShadow: "0 0 0 8px rgba(16, 185, 129, 0.15), 0 0 0 16px rgba(16, 185, 129, 0.08), 0 12px 30px rgba(16, 185, 129, 0.4)" }}>
            <CheckIcon width={36} height={36} />
          </div>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 14 }}>
            Order <span className="gradient-text">placed!</span>
          </h1>
          <p className="text-muted" style={{ fontSize: 18, marginBottom: 24 }}>
            Thank you, {order.details.name.split(" ")[0]}. We&apos;ve sent a confirmation to <b style={{ color: "var(--ink-dim)" }}>{order.details.email}</b>.
          </p>
          <div style={{ display: "inline-flex", gap: 24, padding: "16px 32px", borderRadius: 999, background: "rgba(20, 8, 4, 0.5)", border: "1px solid rgba(253, 186, 116, 0.12)", flexWrap: "wrap", justifyContent: "center" }}>
            <div>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Order #</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22 }}>{order.id}</div>
            </div>
            <div style={{ width: 1, background: "rgba(253, 186, 116, 0.12)" }} />
            <div>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>{order.details.type === "delivery" ? "Arriving in" : "Ready in"}</div>
              <div className="text-orange" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22 }}>~ {order.eta} min</div>
            </div>
            <div style={{ width: 1, background: "rgba(253, 186, 116, 0.12)" }} />
            <div>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Total paid</div>
              <div className="text-yellow" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22 }}>£{order.total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Live tracking */}
        <div className="card" style={{ padding: 36, marginBottom: 24 }}>
          <h3 style={{ fontSize: 24, marginBottom: 24 }}>Live tracking</h3>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 27, top: 28, bottom: 28, width: 2, background: "rgba(253, 186, 116, 0.12)" }} />
            <div style={{ position: "absolute", left: 27, top: 28, height: `calc(${(stepIdx / (trackingSteps.length - 1)) * 100}% - 4px)`, width: 2, background: "linear-gradient(to bottom, var(--green-500), var(--orange-500))", transition: "height 800ms ease" }} />
            {trackingSteps.map((s, i) => {
              const done   = i <= stepIdx;
              const active = i === stepIdx;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 0", position: "relative" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: done ? "linear-gradient(135deg, var(--orange-500), var(--orange-600))" : "rgba(40, 18, 8, 0.7)",
                    border: "1px solid " + (done ? "transparent" : "rgba(253, 186, 116, 0.15)"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, flexShrink: 0,
                    boxShadow: active ? "0 0 0 6px rgba(234, 88, 12, 0.15), 0 12px 30px rgba(234, 88, 12, 0.4)" : "none",
                    animation: active ? "pulse 2s infinite" : "none",
                    transition: "all 200ms",
                  }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: done ? "var(--ink)" : "var(--muted)" }}>{s.label}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{s.time}</div>
                  </div>
                  {active && <span className="badge badge-hot" style={{ animation: "pulse 1.5s infinite" }}>In progress</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Address + payment */}
        <div className="grid-2col" style={{ gap: 24, marginBottom: 24 }}>
          <div className="card" style={{ padding: 28 }}>
            <h4 style={{ fontSize: 18, marginBottom: 16 }}>📍 {order.details.type === "delivery" ? "Delivering to" : "Collecting from"}</h4>
            {order.details.type === "delivery" ? (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.details.name}</div>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{order.details.address}<br />{order.details.postcode}</div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>📞 {order.details.phone}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{config.name}</div>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{config.address}</div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>Collected by: {order.details.name}</div>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 28 }}>
            <h4 style={{ fontSize: 18, marginBottom: 16 }}>💳 Payment</h4>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {order.method === "card" && "Card payment"}
              {order.method === "applepay" && "Apple Pay"}
              {order.method === "paypal" && "PayPal"}
              {order.method === "cash" && `Cash on ${order.details.type}`}
            </div>
            <div className="text-muted" style={{ fontSize: 14 }}>{order.method === "cash" ? `Have £${order.total.toFixed(2)} ready` : "Paid in full"}</div>
            {order.coupon && <div className="text-yellow" style={{ fontSize: 13, marginTop: 10, fontWeight: 600 }}>🏷️ {order.coupon} applied — saved £{order.discount.toFixed(2)}</div>}
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h4 style={{ fontSize: 18, marginBottom: 16 }}>🍽️ Your order</h4>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid rgba(253, 186, 116, 0.06)" }}>
              <span style={{ fontSize: 26 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>£{item.price.toFixed(2)} × {item.qty}</div>
              </div>
              <div className="text-orange" style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 18 }}>£{(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: "var(--ink-dim)" }}><span>Subtotal</span><span style={{ fontWeight: 600 }}>£{order.subtotal.toFixed(2)}</span></div>
            {order.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: "#4ade80" }}><span>Discount</span><span style={{ fontWeight: 600 }}>−£{order.discount.toFixed(2)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: "var(--ink-dim)" }}><span>Delivery</span><span style={{ fontWeight: 600 }}>{order.deliveryFee === 0 ? "FREE" : `£${order.deliveryFee.toFixed(2)}`}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", marginTop: 6, borderTop: "1px solid rgba(253, 186, 116, 0.08)", fontSize: 18 }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 22 }} className="text-orange">£{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/order/${order.id}`} className="btn btn-primary" style={{ textDecoration: "none" }}>
            📍 Track your order →
          </Link>
          <button className="btn btn-ghost" onClick={() => { onReset(); router.push("/"); }}>Back to home</button>
          <button className="btn btn-ghost" onClick={() => { onReset(); router.push("/menu"); }}>Order again</button>
          <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print receipt</button>
        </div>
      </div>
    </section>
  );
}

/* ── Closed screen ── */

function ClosedScreen({ nextOpen }: { nextOpen: string }) {
  const router = useRouter();
  return (
    <section style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 16px" }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🕐</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", marginBottom: 16, lineHeight: 1.2 }}>
          We&apos;re <span style={{ color: "#ef4444" }}>closed</span> right now
        </h1>
        <p style={{ fontSize: 18, color: "var(--ink-dim)", marginBottom: 12, lineHeight: 1.6 }}>
          Currently we are not accepting orders. Will be back soon to serve.
        </p>
        <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32, lineHeight: 1.6 }}>
          {nextOpen ? `We reopen ${nextOpen}.` : "Please check back during our opening hours."} Apologies for the inconvenience.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/")} className="btn btn-primary">Back to home</button>
          <button onClick={() => router.push("/contact")} className="btn btn-ghost">View opening hours</button>
        </div>
      </div>
    </section>
  );
}

/* ── Page ── */

export default function OrderPage() {
  const cart = useCart();
  const router = useRouter();
  const [stage, setStage] = useState<OrderStage>("build");
  const [partialOrder, setPartialOrder] = useState<Partial<PlacedOrder>>({});
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [nextOpen, setNextOpen] = useState("");

  useEffect(() => {
    fetch("/api/open-status")
      .then(r => r.ok ? r.json() : { isOpen: true })
      .then(d => { setIsOpen(d.isOpen); setNextOpen(d.nextOpen ?? ""); })
      .catch(() => setIsOpen(true));
  }, []);

  // Deep-link: cart "Checkout" sends ?stage=details to skip the redundant
  // basket-build step and go straight to the delivery details → payment flow.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stage") === "details" && cart.items.length > 0) {
      setStage("details");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While checking, render nothing to avoid flash
  if (isOpen === null) {
    return <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="text-muted">Loading…</div></main>;
  }

  if (!isOpen) {
    return <main><ClosedScreen nextOpen={nextOpen} /></main>;
  }

  if (stage === "confirm" && placedOrder) {
    return (
      <main>
        <ConfirmationView order={placedOrder} onReset={() => { cart.clear(); setStage("build"); setPlacedOrder(null); setPartialOrder({}); }} />
      </main>
    );
  }

  return (
    <main>
      <section style={{ padding: "40px 0 24px" }}>
        <div className="container">
          <Stepper stage={stage} />
        </div>
      </section>
      <section style={{ paddingBottom: 80 }}>
        <div className="container">
          {stage === "build" && (
            <BuildStage
              onNext={() => setStage("details")}
              onBrowse={() => router.push("/menu")}
            />
          )}
          {stage === "details" && (
            <DetailsStage
              onBack={() => setStage("build")}
              onNext={(d) => { setPartialOrder({ details: d }); setStage("payment"); }}
            />
          )}
          {stage === "payment" && partialOrder.details && (
            <PaymentStage
              onBack={() => setStage("details")}
              details={partialOrder.details}
              onComplete={(o) => { setPlacedOrder(o); setStage("confirm"); }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
