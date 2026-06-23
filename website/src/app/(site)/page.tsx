"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AwardIcon, ForkIcon, TagIcon, ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { useConfig } from "@/context/ConfigContext";
import type { MenuItem } from "@/lib/types";

type DBReview = { name: string; rating: number; text: string; role: string };
type ContentMap = Record<string, string>;

const DEFAULT_CONTENT: ContentMap = {
  hero_pill: "Sheffield's No. 1 South Indian Restaurant",
  hero_headline_line1: "Authentic Taste of",
  hero_headline_gradient: "South India",
  hero_headline_italic: "— In Sheffield's Heart",
  hero_subtext: "From the aromatic biryanis of Hyderabad to the fiery curries of Andhra Pradesh — experience the rich culinary heritage of Telangana, right here on Ecclesall Road, Sheffield.",
  stat_1_value: "20K+", stat_1_label: "Happy Customers",
  stat_2_value: "4.9★", stat_2_label: "Google Rating",
  stat_3_value: "25yr",  stat_3_label: "Heritage",
  stat_4_value: "2 hrs", stat_4_label: "Sheffield Delivery",
  story_headline: "A family recipe, twenty-five years on Ecclesall Road.",
  story_paragraph_1: "Founded in 2000 by Chef Ravi Reddy, Abhiruchi (the Telugu word for good taste) brings the bold, layered flavours of Hyderabad and Andhra Pradesh to Sheffield's most-loved high street.",
  story_paragraph_2: "Our dum biryani is slow-cooked under sealed dough. Our curries are ground fresh each morning. Our masalas are flown in from family suppliers in Telangana. Nothing shortcut. Everything from scratch.",
  usp_1_icon: "🌶️", usp_1_label: "Hand-ground masalas", usp_1_sub: "Roasted & blended daily",
  usp_2_icon: "🔥",  usp_2_label: "Tandoor-fired",        usp_2_sub: "Charcoal-only, 480°C",
  usp_3_icon: "🌾",  usp_3_label: "Aged basmati",         usp_3_sub: "1121 long-grain only",
  usp_4_icon: "👨‍🍳", usp_4_label: "Chef Ravi's recipes",  usp_4_sub: "From his Hyderabad home",
  cta_headline: "Tonight's biryani is calling.",
};

export default function HomePage() {
  const cart = useCart();
  const config = useConfig();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<DBReview[]>([]);
  const [content, setContent] = useState<ContentMap>(DEFAULT_CONTENT);

  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.ok ? r.json() : [])
      .then(setMenu)
      .catch(() => {});
    fetch("/api/reviews")
      .then(r => r.ok ? r.json() : [])
      .then(setReviews)
      .catch(() => {});
    fetch("/api/content")
      .then(r => r.ok ? r.json() : null)
      .then((data: ContentMap | null) => { if (data) setContent(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  const hero = menu.find((m) => m.hero) ?? menu[0];
  const popular = menu.filter((m) => m.popular);
  const sideCards = popular.filter((m) => m.id !== hero?.id).slice(0, 2);

  const stats = [
    { v: content.stat_1_value, l: content.stat_1_label },
    { v: content.stat_2_value, l: content.stat_2_label },
    { v: content.stat_3_value, l: content.stat_3_label },
    { v: content.stat_4_value, l: content.stat_4_label },
  ];

  const usps = [
    { icon: content.usp_1_icon, label: content.usp_1_label, sub: content.usp_1_sub },
    { icon: content.usp_2_icon, label: content.usp_2_label, sub: content.usp_2_sub },
    { icon: content.usp_3_icon, label: content.usp_3_label, sub: content.usp_3_sub },
    { icon: content.usp_4_icon, label: content.usp_4_label, sub: content.usp_4_sub },
  ];

  return (
    <main>
      {/* HERO */}
      <section style={{ padding: "60px 0 80px" }}>
        <div className="container grid-hero">
          <div>
            <span className="pill" style={{ marginBottom: 32 }}>
              <AwardIcon /> {content.hero_pill}
            </span>
            <h1 style={{ fontSize: "clamp(56px, 7vw, 96px)", marginBottom: 24, lineHeight: 1 }}>
              {content.hero_headline_line1}<br />
              <span className="gradient-text">{content.hero_headline_gradient}</span><br />
              <span style={{ fontStyle: "italic", color: "var(--orange-200)", fontWeight: 500, fontSize: "0.7em" }}>{content.hero_headline_italic}</span>
            </h1>
            <p className="text-muted" style={{ fontSize: 19, lineHeight: 1.65, maxWidth: 540, marginBottom: 40 }}>
              {content.hero_subtext}
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/menu" className="btn btn-primary btn-lg"><ForkIcon /> Explore Menu</Link>
              <Link href="/offers" className="btn btn-ghost btn-lg"><TagIcon /> Today&apos;s Offers</Link>
            </div>

            <div className="grid-stats">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="gradient-text" style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--display)", lineHeight: 1 }}>{s.v}</div>
                  <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 8 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero cards */}
          <div className="grid-cards">
            {hero ? (
              <div className="card" style={{ padding: 28, gridRow: "span 2", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 480 }}>
                <span className="badge badge-hot" style={{ position: "absolute", top: 24, right: 24 }}>🔥 Hot &amp; Fresh</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120 }}>{hero.emoji}</div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: 26, marginBottom: 8 }}>{hero.name}</h3>
                  <div className="text-yellow" style={{ fontSize: 28, fontFamily: "var(--display)", fontWeight: 700 }}>£{hero.price.toFixed(2)}</div>
                  <button className="btn btn-yellow btn-sm" style={{ marginTop: 18 }} onClick={() => cart.add(hero)}>
                    Add to basket
                  </button>
                </div>
                <div style={{ marginTop: 18, padding: "10px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(234,88,12,0.12))", border: "1px solid rgba(251,191,36,0.25)", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--yellow-300)" }}>
                  🚲 Free Delivery over £{config.freeDeliveryThreshold}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 28, gridRow: "span 2", minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 48, color: "var(--muted)" }}>🍛</div>
              </div>
            )}

            {sideCards.map((m) => (
              <div key={m.id} className="card card-hover" style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 232, cursor: "pointer" }} onClick={() => cart.add(m)}>
                <div style={{ fontSize: 64 }}>{m.emoji}</div>
                <div>
                  <h4 style={{ fontSize: 17, marginBottom: 4 }}>{m.name}</h4>
                  <div className="text-yellow" style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 22 }}>£{m.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR */}
      {popular.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeader
              eyebrow="Crowd Favourites"
              title="Sheffield's most-ordered dishes"
              lead="Twenty thousand customers can't be wrong — these are the plates that keep our regulars coming back week after week."
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {popular.map((m) => <MenuItemCard key={m.id} item={m} />)}
            </div>
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <Link href="/menu" className="btn btn-ghost">See full menu <ArrowIcon /></Link>
            </div>
          </div>
        </section>
      )}

      {/* STORY STRIP */}
      <section className="section" style={{ background: "linear-gradient(135deg, rgba(234, 88, 12, 0.08), transparent)", borderTop: "1px solid rgba(253, 186, 116, 0.08)", borderBottom: "1px solid rgba(253, 186, 116, 0.08)" }}>
        <div className="container grid-story">
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Our Story</div>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 20 }}>{content.story_headline}</h2>
            <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 28 }}>
              {content.story_paragraph_1}
            </p>
            <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 36 }}>
              {content.story_paragraph_2}
            </p>
            <Link href="/about" className="btn btn-primary">Read our story <ArrowIcon /></Link>
          </div>
          <div className="grid-usps">
            {usps.map((c) => (
              <div key={c.label} className="card" style={{ padding: 26 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.label}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="What Sheffield Says" title="Reviews from our regulars" />
          <div className="grid-reviews">
            {reviews.map((r) => (
              <div key={r.name} className="card" style={{ padding: 30 }}>
                <div className="text-yellow" style={{ display: "flex", gap: 2, marginBottom: 18 }}>
                  {Array.from({ length: r.rating }).map((_, i) => <StarIcon key={i} />)}
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, fontFamily: "var(--display)", fontStyle: "italic" }}>&ldquo;{r.text}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--orange-400), var(--orange-600))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", flexShrink: 0 }}>
                    {r.name.split(" ").map((x) => x[0]).join("")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 64, textAlign: "center", background: "linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(251, 191, 36, 0.06))", borderColor: "rgba(251, 191, 36, 0.2)" }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Ready to Order?</div>
            <h2 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 20 }}>{content.cta_headline}</h2>
            <p className="text-muted" style={{ fontSize: 18, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px" }}>
              Free delivery over £{config.freeDeliveryThreshold} anywhere in Sheffield. Most orders arrive within {config.deliveryEstimateMinutes} minutes.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/order" className="btn btn-primary btn-lg">Start your order <ArrowIcon /></Link>
              <Link href="/contact" className="btn btn-ghost btn-lg">Book a table</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
