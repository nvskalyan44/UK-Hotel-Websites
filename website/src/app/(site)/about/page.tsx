import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AwardIcon, ArrowIcon } from "@/components/ui/Icons";

const timeline = [
  { year: "2000", title: "Doors open on Ecclesall Road",        desc: "Chef Ravi & Lakshmi Reddy arrive from Hyderabad with three suitcases of masalas and a dream." },
  { year: "2008", title: "Sheffield Star — 'Best Curry House'", desc: "First Sheffield Star award. We add the second dining room to fit the regulars." },
  { year: "2014", title: "Tandoor oven installed",              desc: "A real charcoal tandoor — Sheffield's first South-Indian-style oven — fires up the menu." },
  { year: "2020", title: "Lockdown — and delivery is born",     desc: "We learn to box biryani like a love letter. 20,000 deliveries later, here we are." },
  { year: "2026", title: "Voted Sheffield's No. 1 South Indian", desc: "Twenty-five years on, the same recipes, the same family. New menu launching this autumn." },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section style={{ padding: "60px 0" }}>
        <div className="container grid-about">
          <div>
            <span className="pill" style={{ marginBottom: 24 }}><AwardIcon /> Est. 2000 · Family Owned</span>
            <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 24 }}>
              The Reddy family kitchen — <span className="gradient-text">now your local.</span>
            </h1>
            <p className="text-muted" style={{ fontSize: 18, lineHeight: 1.7 }}>
              <i>Abhiruchulu</i> means <i>&ldquo;good taste&rdquo;</i> in Telugu. For us it also means good company, good time, and a recipe book that&apos;s older than most of Ecclesall Road.
            </p>
          </div>
          <div style={{ position: "relative", minHeight: 400 }}>
            <div className="card" style={{ position: "absolute", inset: "10% 0 10% 10%", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, rgba(234, 88, 12, 0.2), rgba(251, 191, 36, 0.1))" }}>
              <div style={{ fontSize: 140, marginBottom: 20 }}>👨‍🍳</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>Chef Ravi Reddy</div>
              <div className="text-muted">Founder · Head Chef</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="Three things we never compromise on" title="The way we cook." />
          <div className="grid-values">
            {[
              { icon: "🌶️", title: "Fresh masalas, every morning",    desc: "Whole spices roasted at sunrise, ground to a fine powder in our stone wet-grinder. Not a single jarred curry paste enters this kitchen." },
              { icon: "🔥", title: "Charcoal tandoor, hand-fired",    desc: "Our naans and tikkas come out of a 480°C clay oven kept lit from noon to midnight. You can taste the smoke." },
              { icon: "🌾", title: "Aged basmati, layered slow",      desc: "Hyderabadi dum biryani means six hours of work for thirty minutes of magic. Sealed with dough, opened at the table." },
            ].map((v) => (
              <div key={v.title} className="card" style={{ padding: 36 }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>{v.icon}</div>
                <h3 style={{ fontSize: 24, marginBottom: 12 }}>{v.title}</h3>
                <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.65 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section" style={{ background: "linear-gradient(135deg, rgba(234, 88, 12, 0.06), transparent)", borderTop: "1px solid rgba(253, 186, 116, 0.08)", borderBottom: "1px solid rgba(253, 186, 116, 0.08)" }}>
        <div className="container">
          <SectionHeader eyebrow="Twenty-five years on Ecclesall Road" title="Our story, in five acts." />
          <div style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}>
            <div style={{ position: "absolute", left: 79, top: 12, bottom: 12, width: 2, background: "linear-gradient(to bottom, var(--orange-500), transparent)" }} />
            {timeline.map((t) => (
              <div key={t.year} style={{ display: "flex", gap: 32, marginBottom: 36, position: "relative" }}>
                <div className="text-yellow" style={{ width: 80, flexShrink: 0, fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, textAlign: "right", paddingTop: 4 }}>{t.year}</div>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--orange-500)", marginTop: 18, boxShadow: "0 0 0 4px rgba(234, 88, 12, 0.15), 0 0 20px rgba(234, 88, 12, 0.5)", flexShrink: 0 }} />
                <div className="card" style={{ padding: 24, flex: 1 }}>
                  <h4 style={{ fontSize: 20, marginBottom: 8 }}>{t.title}</h4>
                  <p className="text-muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 24 }}>Come hungry. Leave family.</h2>
          <p className="text-muted" style={{ fontSize: 18, maxWidth: 560, margin: "0 auto 36px" }}>
            That&apos;s how we do things on Ecclesall Road. Has been since 2000.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/order" className="btn btn-primary btn-lg">Order delivery <ArrowIcon /></Link>
            <Link href="/contact" className="btn btn-ghost btn-lg">Visit the restaurant</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
