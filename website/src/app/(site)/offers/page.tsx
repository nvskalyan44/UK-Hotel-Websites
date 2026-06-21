"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CheckIcon, TagIcon, ArrowIcon } from "@/components/ui/Icons";
import { useConfig } from "@/context/ConfigContext";
import type { Coupon } from "@/lib/types";

type LoyaltyReward = { pointThreshold: number; rewardName: string; emoji: string };

const FALLBACK_REWARDS: LoyaltyReward[] = [
  { pointThreshold: 100, rewardName: "Free Mango Lassi",        emoji: "🥭" },
  { pointThreshold: 250, rewardName: "Free starter",            emoji: "🍽️" },
  { pointThreshold: 500, rewardName: "Free Hyderabadi Biryani", emoji: "🍛" },
];

function CouponCard({ coupon, featured }: { coupon: Coupon; featured: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="card card-hover" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      {featured && (
        <div style={{ position: "absolute", top: 16, right: 16, padding: "5px 10px", borderRadius: 999, background: "rgba(251, 191, 36, 0.18)", color: "var(--yellow-400)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid rgba(251, 191, 36, 0.3)", zIndex: 1 }}>
          ★ Featured
        </div>
      )}
      <div style={{ padding: "36px 32px 28px", background: "linear-gradient(135deg, rgba(234, 88, 12, 0.18), rgba(234, 88, 12, 0.06))", borderBottom: "2px dashed rgba(253, 186, 116, 0.2)", textAlign: "center" }}>
        <div className="text-muted" style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>Promo code</div>
        <div className="gradient-text" style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 800, letterSpacing: "0.04em" }}>{coupon.code}</div>
        <div style={{ marginTop: 10, fontSize: 16, fontWeight: 600, color: "var(--ink-dim)" }}>{coupon.title}</div>
      </div>
      <div style={{ padding: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div>
            <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Discount</div>
            <div className="text-orange" style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--display)" }}>
              {coupon.type === "percent" ? `${coupon.discount}% off` : `£${coupon.discount} off`}
            </div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Min spend</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--display)" }}>£{coupon.minOrder}</div>
          </div>
        </div>
        {coupon.expiry && <div className="text-muted" style={{ fontSize: 12, marginBottom: 18 }}>Valid until {coupon.expiry}</div>}
        <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={copy}>
          {copied ? <><CheckIcon /> Copied!</> : <><TagIcon /> Copy code</>}
        </button>
      </div>
    </div>
  );
}

type ComboItem = { id: string; name: string; emoji: string; qty: number };
type Combo = { id: string; name: string; description: string | null; price: number; items: ComboItem[] };

function ComboCard({ combo }: { combo: Combo }) {
  const totalItemPrice = combo.items.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="card card-hover" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{combo.name}</div>
          {combo.description && <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{combo.description}</p>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
          <div className="text-orange" style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--display)" }}>£{combo.price.toFixed(2)}</div>
          <div className="text-muted" style={{ fontSize: 11 }}>bundle deal</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {combo.items.map(item => (
          <span key={item.id} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 999, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.2)", color: "var(--orange-300)" }}>
            {item.emoji} {item.name} ×{item.qty}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4, borderTop: "1px solid rgba(253,186,116,0.08)" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{totalItemPrice} item{totalItemPrice > 1 ? "s" : ""} included</span>
        <Link href="/order" className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}>Order now <ArrowIcon /></Link>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const config = useConfig();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>(FALLBACK_REWARDS);

  useEffect(() => {
    fetch("/api/offers")
      .then(r => r.ok ? r.json() : [])
      .then(setCoupons)
      .catch(() => {});
    fetch("/api/combos")
      .then(r => r.ok ? r.json() : [])
      .then(setCombos)
      .catch(() => {});
    fetch("/api/config/loyalty-rewards")
      .then(r => r.ok ? r.json() : null)
      .then((data: LoyaltyReward[] | null) => { if (data && data.length > 0) setLoyaltyRewards(data); })
      .catch(() => {});
  }, []);

  return (
    <main>
      {/* Meal Deals section */}
      {combos.length > 0 && (
        <section style={{ padding: "60px 0 40px" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span className="pill" style={{ marginBottom: 20 }}>🎁 Meal Deals</span>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", marginBottom: 12 }}>
                <span className="gradient-text">Bundle up</span> and save.
              </h2>
              <p className="text-muted" style={{ fontSize: 17, maxWidth: 540, margin: "0 auto" }}>
                Handpicked combinations for the whole table — better value, no decisions.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {combos.map(c => <ComboCard key={c.id} combo={c} />)}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: "60px 0 32px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="pill" style={{ marginBottom: 24 }}><TagIcon /> {coupons.length} live offers</span>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>
            <span className="gradient-text">Save</span> on tonight&apos;s order.
          </h1>
          <p className="text-muted" style={{ fontSize: 18, maxWidth: 580, margin: "0 auto 48px" }}>
            Tap any code to copy it — then apply at checkout. New customer? <b style={{ color: "var(--orange-300)" }}>WELCOME15</b> is yours.
          </p>
        </div>
        <div className="container">
          {coupons.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted)" }}>No active offers right now — check back soon.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
              {coupons.map((c, i) => <CouponCard key={c.code} coupon={c} featured={i === 0} />)}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="How it works" title="Three steps, one delicious total." />
          <div className="grid-values">
            {[
              { n: "01", title: "Pick a code",        desc: "Browse the offers above. Tap the one that fits tonight's order." },
              { n: "02", title: "Build your basket",  desc: "Head to the menu and add the dishes you fancy." },
              { n: "03", title: "Apply at checkout",  desc: "Paste your code on the payment page. Watch the total drop. Eat." },
            ].map((s) => (
              <div key={s.n} className="card" style={{ padding: 36 }}>
                <div className="gradient-text" style={{ fontSize: 56, fontFamily: "var(--display)", fontWeight: 700, lineHeight: 1, marginBottom: 16 }}>{s.n}</div>
                <h3 style={{ fontSize: 22, marginBottom: 10 }}>{s.title}</h3>
                <p className="text-muted" style={{ fontSize: 14.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loyalty */}
      <section className="section">
        <div className="container">
          <div className="card grid-loyalty" style={{ padding: "40px 32px", background: "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(234, 88, 12, 0.06))", borderColor: "rgba(251, 191, 36, 0.25)" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Abhiruchulu Loyalty</div>
              <h2 style={{ fontSize: "clamp(36px, 4.5vw, 52px)", marginBottom: 18 }}>Every order earns you points. Spend them on biryani.</h2>
              <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 28 }}>
                Earn {config.loyaltyPointsPerPound} points for every £1. Hit {loyaltyRewards[loyaltyRewards.length - 1]?.pointThreshold ?? 500} points and unlock a free Hyderabadi Chicken Biryani. Just like that.
              </p>
              <Link href="/order" className="btn btn-primary">Start earning <ArrowIcon /></Link>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {loyaltyRewards.map((t) => (
                <div key={t.pointThreshold} style={{ display: "flex", alignItems: "center", gap: 16, padding: 18, background: "rgba(20, 8, 4, 0.4)", borderRadius: 16, border: "1px solid rgba(253, 186, 116, 0.1)" }}>
                  <div style={{ fontSize: 32 }}>{t.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{t.rewardName}</div>
                    <div className="text-orange" style={{ fontSize: 13, fontWeight: 700 }}>{t.pointThreshold} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
