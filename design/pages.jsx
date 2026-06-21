/* ============================================================
   Pages — Home, Menu, About, Offers, Contact
   (Order page lives in order.jsx — it's bigger)
   ============================================================ */

const { RESTAURANT: RST, MENU: MENU_ITEMS, CATEGORIES: CATS, COUPONS: CPNS, REVIEWS: RVWS } = window.__DATA;

/* ============================================================
   HOME
   ============================================================ */

function HomePage({ onTab }) {
  const cart = useCart();
  const hero = MENU_ITEMS.find((m) => m.hero) || MENU_ITEMS[0];
  const fish = MENU_ITEMS.find((m) => m.id === "andhra-fish-curry");
  const c65 = MENU_ITEMS.find((m) => m.id === "chicken-65");
  const popular = MENU_ITEMS.filter((m) => m.popular);

  return (
    <main>
      {/* HERO */}
      <section style={{ padding: "60px 0 80px" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <span className="pill" style={{ marginBottom: 32 }}>
              <Icon.Award /> Sheffield's No. 1 South Indian Restaurant
            </span>
            <h1 style={{ fontSize: "clamp(56px, 7vw, 96px)", marginBottom: 24, lineHeight: 1 }}>
              Authentic Taste of<br/>
              <span className="gradient-text">South India</span><br/>
              <span style={{ fontStyle: "italic", color: "var(--orange-200)", fontWeight: 500, fontSize: "0.7em" }}>— In Sheffield's Heart</span>
            </h1>
            <p className="text-muted" style={{ fontSize: 19, lineHeight: 1.65, maxWidth: 540, marginBottom: 40 }}>
              From the aromatic biryanis of Hyderabad to the fiery curries of Andhra Pradesh — experience the rich culinary heritage of Telangana, right here on Ecclesall Road, Sheffield.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={() => onTab("menu")}><Icon.Fork /> Explore Menu</button>
              <button className="btn btn-ghost btn-lg" onClick={() => onTab("offers")}><Icon.Tag /> Today's Offers</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 64, paddingTop: 40, borderTop: "1px solid rgba(253, 186, 116, 0.08)" }}>
              {[
                { v: "20K+", l: "Happy Customers" },
                { v: "4.9★", l: "Google Rating" },
                { v: "25yr", l: "Heritage" },
                { v: "2 hrs", l: "Sheffield Delivery" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="gradient-text" style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--display)", lineHeight: 1 }}>{s.v}</div>
                  <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 8 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, position: "relative" }}>
            <div className="card" style={{ padding: 28, gridRow: "span 2", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 480 }}>
              <span className="badge badge-hot" style={{ position: "absolute", top: 24, right: 24 }}>🔥 Hot & Fresh</span>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120 }}>{hero.emoji}</div>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: 26, marginBottom: 8 }}>{hero.name}</h3>
                <div className="text-yellow" style={{ fontSize: 28, fontFamily: "var(--display)", fontWeight: 700 }}>£{hero.price.toFixed(2)}</div>
                <button className="btn btn-yellow btn-sm" style={{ marginTop: 18 }} onClick={() => { cart.add(hero); }}>
                  <Icon.Plus /> Add to basket
                </button>
              </div>
              <div style={{ marginTop: 18, padding: "10px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(234,88,12,0.12))", border: "1px solid rgba(251,191,36,0.25)", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--yellow-300)" }}>
                🚲 Free Delivery over £35
              </div>
            </div>

            {[fish, c65].map((m) => (
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
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="Crowd Favourites" title="Sheffield's most-ordered dishes" lead="Twenty thousand customers can't be wrong — these are the plates that keep our regulars coming back week after week." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {popular.map((m) => <MenuItemCard key={m.id} item={m} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button className="btn btn-ghost" onClick={() => onTab("menu")}>See full menu <Icon.Arrow /></button>
          </div>
        </div>
      </section>

      {/* STORY STRIP */}
      <section className="section" style={{ background: "linear-gradient(135deg, rgba(234, 88, 12, 0.08), transparent)", borderTop: "1px solid rgba(253, 186, 116, 0.08)", borderBottom: "1px solid rgba(253, 186, 116, 0.08)" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Our Story</div>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 20 }}>A family recipe, twenty-five years on Ecclesall Road.</h2>
            <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 28 }}>
              Founded in 2000 by Chef Ravi Reddy, Abhiruchulu (the Telugu word for <i>good taste</i>) brings the bold, layered flavours of Hyderabad and Andhra Pradesh to Sheffield's most-loved high street.
            </p>
            <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 36 }}>
              Our dum biryani is slow-cooked under sealed dough. Our curries are ground fresh each morning. Our masalas are flown in from family suppliers in Telangana. Nothing shortcut. Everything from scratch.
            </p>
            <button className="btn btn-primary" onClick={() => onTab("about")}>Read our story <Icon.Arrow /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[
              { icon: "🌶️", label: "Hand-ground masalas", sub: "Roasted & blended daily" },
              { icon: "🔥", label: "Tandoor-fired", sub: "Charcoal-only, 480°C" },
              { icon: "🌾", label: "Aged basmati", sub: "1121 long-grain only" },
              { icon: "👨‍🍳", label: "Chef Ravi's recipes", sub: "From his Hyderabad home" },
            ].map((c) => (
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
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="What Sheffield Says" title="Reviews from our regulars" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {RVWS.map((r) => (
              <div key={r.name} className="card" style={{ padding: 30 }}>
                <div className="text-yellow" style={{ display: "flex", gap: 2, marginBottom: 18 }}>
                  {Array.from({ length: r.rating }).map((_, i) => <Icon.Star key={i} />)}
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, fontFamily: "var(--display)", fontStyle: "italic" }}>"{r.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--orange-400), var(--orange-600))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
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

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 64, textAlign: "center", background: "linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(251, 191, 36, 0.06))", borderColor: "rgba(251, 191, 36, 0.2)" }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Ready to Order?</div>
            <h2 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 20 }}>Tonight's biryani is calling.</h2>
            <p className="text-muted" style={{ fontSize: 18, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px" }}>
              Free delivery over £35 anywhere in Sheffield. Most orders arrive within 35 minutes.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={() => onTab("order")}>Start your order <Icon.Arrow /></button>
              <button className="btn btn-ghost btn-lg" onClick={() => onTab("contact")}>Book a table</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   MENU
   ============================================================ */

function MenuPage({ onTab }) {
  const [cat, setCat] = useState("All");
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MENU_ITEMS.filter((m) => (cat === "All" || m.category === cat) && (!search || m.name.toLowerCase().includes(search.toLowerCase())));
  }, [cat, search]);

  return (
    <main>
      <section style={{ padding: "60px 0 32px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="pill" style={{ marginBottom: 24 }}><Icon.Fork /> Our Menu · {MENU_ITEMS.length} dishes</span>
            <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>
              <span className="gradient-text">Plate by plate</span>, the South Indian classics.
            </h1>
            <p className="text-muted" style={{ fontSize: 18, maxWidth: 600, margin: "0 auto" }}>
              From small plates to slow-cooked feasts. Tap any dish to add it to your basket.
            </p>
          </div>

          {/* Filter / search bar */}
          <div className="card" style={{ padding: 18, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: 32 }}>
            <div style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "rgba(20, 8, 4, 0.5)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.1)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--faint)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes…" style={{ flex: 1, padding: "8px 0", fontSize: 15 }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATS.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={"nav-tab" + (cat === c ? " active" : "")} style={{ padding: "8px 16px", fontSize: 14 }}>{c}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(20, 8, 4, 0.5)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.08)" }}>
              <button onClick={() => setView("grid")} className={"nav-tab" + (view === "grid" ? " active" : "")} style={{ padding: "6px 14px", fontSize: 13 }}>Grid</button>
              <button onClick={() => setView("list")} className={"nav-tab" + (view === "list" ? " active" : "")} style={{ padding: "6px 14px", fontSize: 13 }}>List</button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 80, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🤔</div>
              <h3 style={{ fontSize: 24, marginBottom: 8 }}>No dishes match</h3>
              <p className="text-muted">Try a different category or search term.</p>
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
              <p className="text-muted">Free delivery over £{RST.freeDeliveryThreshold} · most orders out in 35 mins</p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => onTab("order")}>Start your order <Icon.Arrow /></button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   ABOUT
   ============================================================ */

function AboutPage({ onTab }) {
  const timeline = [
    { year: "2000", title: "Doors open on Ecclesall Road", desc: "Chef Ravi & Lakshmi Reddy arrive from Hyderabad with three suitcases of masalas and a dream." },
    { year: "2008", title: "Sheffield Star — 'Best Curry House'", desc: "First Sheffield Star award. We add the second dining room to fit the regulars." },
    { year: "2014", title: "Tandoor oven installed", desc: "A real charcoal tandoor — Sheffield's first South-Indian-style oven — fires up the menu." },
    { year: "2020", title: "Lockdown — and delivery is born", desc: "We learn to box biryani like a love letter. 20,000 deliveries later, here we are." },
    { year: "2026", title: "Voted Sheffield's No. 1 South Indian", desc: "Twenty-five years on, the same recipes, the same family. New menu launching this autumn." },
  ];

  return (
    <main>
      <section style={{ padding: "60px 0" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <span className="pill" style={{ marginBottom: 24 }}><Icon.Award /> Est. 2000 · Family Owned</span>
            <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 24 }}>
              The Reddy family kitchen — <span className="gradient-text">now your local.</span>
            </h1>
            <p className="text-muted" style={{ fontSize: 18, lineHeight: 1.7 }}>
              <i>Abhiruchulu</i> means <i>"good taste"</i> in Telugu. For us it also means good company, good time, and a recipe book that's older than most of Ecclesall Road.
            </p>
          </div>
          <div style={{ position: "relative", height: 480 }}>
            <div className="card" style={{ position: "absolute", inset: "10% 0 10% 10%", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, rgba(234, 88, 12, 0.2), rgba(251, 191, 36, 0.1))" }}>
              <div style={{ fontSize: 140, marginBottom: 20 }}>👨‍🍳</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, marginBottom: 4 }}>Chef Ravi Reddy</div>
              <div className="text-muted">Founder · Head Chef</div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="Three things we never compromise on" title="The way we cook." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { icon: "🌶️", title: "Fresh masalas, every morning", desc: "Whole spices roasted at sunrise, ground to a fine powder in our stone wet-grinder. Not a single jarred curry paste enters this kitchen." },
              { icon: "🔥", title: "Charcoal tandoor, hand-fired", desc: "Our naans and tikkas come out of a 480°C clay oven kept lit from noon to midnight. You can taste the smoke." },
              { icon: "🌾", title: "Aged basmati, layered slow", desc: "Hyderabadi dum biryani means six hours of work for thirty minutes of magic. Sealed with dough, opened at the table." },
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

      {/* TIMELINE */}
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
            That's how we do things on Ecclesall Road. Has been since 2000.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={() => onTab("order")}>Order delivery <Icon.Arrow /></button>
            <button className="btn btn-ghost btn-lg" onClick={() => onTab("contact")}>Visit the restaurant</button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   OFFERS
   ============================================================ */

function OffersPage({ onTab }) {
  const cart = useCart();
  return (
    <main>
      <section style={{ padding: "60px 0 32px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="pill" style={{ marginBottom: 24 }}><Icon.Tag /> {CPNS.length} live offers</span>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>
            <span className="gradient-text">Save</span> on tonight's order.
          </h1>
          <p className="text-muted" style={{ fontSize: 18, maxWidth: 580, margin: "0 auto 48px" }}>
            Tap any code to copy it — then apply at checkout. New customer? <b style={{ color: "var(--orange-300)" }}>WELCOME15</b> is yours.
          </p>
        </div>

        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
            {CPNS.map((c, i) => <CouponCard key={c.code} coupon={c} featured={i === 0} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="How it works" title="Three steps, one delicious total." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { n: "01", title: "Pick a code", desc: "Browse the offers above. Tap the one that fits tonight's order." },
              { n: "02", title: "Build your basket", desc: "Head to the menu and add the dishes you fancy." },
              { n: "03", title: "Apply at checkout", desc: "Paste your code on the payment page. Watch the total drop. Eat." },
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

      {/* LOYALTY */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 56, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "center", background: "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(234, 88, 12, 0.06))", borderColor: "rgba(251, 191, 36, 0.25)" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Abhiruchulu Loyalty</div>
              <h2 style={{ fontSize: "clamp(36px, 4.5vw, 52px)", marginBottom: 18 }}>Every order earns you points. Spend them on biryani.</h2>
              <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 28 }}>
                Earn 10 points for every £1. Hit 500 points and unlock a free Hyderabadi Chicken Biryani. Just like that.
              </p>
              <button className="btn btn-primary" onClick={() => onTab("order")}>Start earning <Icon.Arrow /></button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {[
                { pts: "100 pts", reward: "Free Mango Lassi", emoji: "🥭" },
                { pts: "250 pts", reward: "Free starter of your choice", emoji: "🥟" },
                { pts: "500 pts", reward: "Free Hyderabadi Biryani", emoji: "🍛" },
              ].map((t) => (
                <div key={t.pts} style={{ display: "flex", alignItems: "center", gap: 16, padding: 18, background: "rgba(20, 8, 4, 0.4)", borderRadius: 16, border: "1px solid rgba(253, 186, 116, 0.1)" }}>
                  <div style={{ fontSize: 32 }}>{t.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{t.reward}</div>
                    <div className="text-orange" style={{ fontSize: 13, fontWeight: 700 }}>{t.pts}</div>
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

function CouponCard({ coupon, featured }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  return (
    <div className="card card-hover" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      {featured && <div style={{ position: "absolute", top: 16, right: 16, padding: "5px 10px", borderRadius: 999, background: "rgba(251, 191, 36, 0.18)", color: "var(--yellow-400)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid rgba(251, 191, 36, 0.3)" }}>★ Featured</div>}
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
        <div className="text-muted" style={{ fontSize: 12, marginBottom: 18 }}>Valid until {coupon.expiry}</div>
        <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={copy}>
          {copied ? <><Icon.Check /> Copied!</> : <><Icon.Tag /> Copy code</>}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CONTACT
   ============================================================ */

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "Reservation", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ name: "", email: "", subject: "Reservation", message: "" }); }, 3500);
  };

  return (
    <main>
      <section style={{ padding: "60px 0 32px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="pill" style={{ marginBottom: 24 }}><Icon.Pin /> Visit us on Ecclesall Road</span>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>
            <span className="gradient-text">Find us, call us,</span> book a table.
          </h1>
          <p className="text-muted" style={{ fontSize: 18, maxWidth: 580, margin: "0 auto 48px" }}>
            Walk-ins welcome. Reservations recommended for Friday and Saturday evenings.
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 60 }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32 }}>
          {/* Contact info */}
          <div style={{ display: "grid", gap: 16 }}>
            {[
              { icon: <Icon.Pin />,   label: "Visit",  value: RST.address, sub: "Bus 65 stops outside · 2 mins walk from Sheffield Botanical Gardens" },
              { icon: <Icon.Phone />, label: "Call",   value: RST.phone,   sub: "Lines open through service hours" },
              { icon: <Icon.Mail />,  label: "Email",  value: RST.email,   sub: "Replies within 4 hours" },
              { icon: <Icon.Clock />, label: "Hours", value: "See full schedule", sub: null, hours: true },
            ].map((c) => (
              <div key={c.label} className="card card-hover" style={{ padding: 26, display: "flex", gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, var(--orange-500), var(--orange-600))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{c.value}</div>
                  {c.sub && <div className="text-muted" style={{ fontSize: 13 }}>{c.sub}</div>}
                  {c.hours && (
                    <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                      {RST.hours.map((h) => (
                        <div key={h.day} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span className="text-muted">{h.day}</span>
                          <span>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Form + map */}
          <div style={{ display: "grid", gap: 24 }}>
            <div className="card" style={{ height: 280, overflow: "hidden", position: "relative", background: "linear-gradient(135deg, #1a0a05, #2a1208)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Stylised map */}
              <svg viewBox="0 0 400 280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(253, 186, 116, 0.15)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="400" height="280" fill="url(#grid)"/>
                <path d="M 0 140 Q 100 100, 200 140 T 400 130" stroke="rgba(253, 186, 116, 0.3)" strokeWidth="3" fill="none"/>
                <path d="M 180 0 L 220 280" stroke="rgba(253, 186, 116, 0.2)" strokeWidth="2" fill="none"/>
                <path d="M 0 200 L 400 220" stroke="rgba(253, 186, 116, 0.2)" strokeWidth="1.5" fill="none"/>
              </svg>
              <div style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--orange-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(234, 88, 12, 0.2), 0 0 0 16px rgba(234, 88, 12, 0.1), 0 12px 30px rgba(234, 88, 12, 0.4)", animation: "pulse 2s infinite", marginBottom: 14 }}>
                  <Icon.Pin />
                </div>
                <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700 }}>You'll find us here</div>
                <div className="text-muted" style={{ marginTop: 4, fontSize: 14 }}>{RST.address}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 26, marginBottom: 6 }}>Send us a note</h3>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>Bookings, dietary requests, feedback — we read every one.</p>

              {sent ? (
                <div style={{ padding: 32, textAlign: "center", background: "rgba(16, 185, 129, 0.1)", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Message received</div>
                  <p className="text-muted" style={{ fontSize: 14 }}>We'll reply to {form.email || "you"} within four hours.</p>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="field">
                      <label className="field-label">Name</label>
                      <input className="field-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                    </div>
                    <div className="field">
                      <label className="field-label">Email</label>
                      <input className="field-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Subject</label>
                    <select className="field-select" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                      <option>Reservation</option>
                      <option>Catering enquiry</option>
                      <option>Feedback</option>
                      <option>General question</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Message</label>
                    <textarea className="field-textarea" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: 6 }}>Send message <Icon.Arrow /></button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { HomePage, MenuPage, AboutPage, OffersPage, ContactPage });
