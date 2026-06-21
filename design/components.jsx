/* ============================================================
   Shared components — Header, Footer, Cart drawer, primitives
   ============================================================ */

const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

// Alias to avoid colliding with the top-level consts in data.js
// (all Babel scripts share global scope)
const RST_C = window.__DATA.RESTAURANT;
const MENU_C = window.__DATA.MENU;
const COUPONS_C = window.__DATA.COUPONS;

/* ---------- Cart context ---------- */

const CartContext = createContext(null);
const useCart = () => useContext(CartContext);

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("abhi_cart") || "[]"); } catch { return []; }
  });
  const [coupon, setCoupon] = useState(() => localStorage.getItem("abhi_coupon") || "");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem("abhi_cart", JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem("abhi_coupon", coupon || ""); }, [coupon]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 1800);
  };

  const add = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      if (existing) return prev.map((x) => x.id === item.id ? { ...x, qty: x.qty + qty } : x);
      return [...prev, { id: item.id, name: item.name, price: item.price, emoji: item.emoji, veg: item.veg, qty }];
    });
    showToast(`Added ${item.name} to cart`);
  };

  const setQty = (id, qty) => {
    if (qty <= 0) return remove(id);
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, qty } : x));
  };

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));
  const clear = () => { setItems([]); setCoupon(""); };

  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
  const appliedCoupon = COUPONS_C.find((c) => c.code === coupon && subtotal >= c.minOrder);
  const discount = appliedCoupon
    ? (appliedCoupon.type === "percent" ? subtotal * appliedCoupon.discount / 100 : appliedCoupon.discount)
    : 0;
  const deliveryFee = subtotal >= RST_C.freeDeliveryThreshold || subtotal === 0 ? 0 : RST_C.deliveryCharge;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const count = items.reduce((s, x) => s + x.qty, 0);

  const applyCoupon = (code) => {
    const c = COUPONS_C.find((x) => x.code === code.toUpperCase());
    if (!c) { showToast("Coupon not recognised"); return false; }
    if (subtotal < c.minOrder) { showToast(`Spend £${c.minOrder} to use ${c.code}`); return false; }
    setCoupon(c.code);
    showToast(`${c.code} applied — you saved £${(c.type === "percent" ? subtotal * c.discount / 100 : c.discount).toFixed(2)}`);
    return true;
  };

  const value = {
    items, count, subtotal, discount, deliveryFee, total,
    coupon, appliedCoupon, applyCoupon, setCoupon,
    add, setQty, remove, clear,
    open, setOpen, toast, showToast,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ---------- Icons (tiny inline SVGs) ---------- */

const Icon = {
  Cart: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>,
  User: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Shield: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Plus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  Minus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...p}><path d="M5 12h14"/></svg>,
  X: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Arrow: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  Phone: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>,
  Mail: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Pin: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Clock: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Check: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  Fork: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 2v6c0 1.7 1.3 3 3 3s3-1.3 3-3V2M9 11v11M15 2v20M18 2v8c0 1.7-1.3 3-3 3"/></svg>,
  Tag: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Award: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Spark: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2L9 9l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>,
};

/* ---------- Header ---------- */

const TABS = [
  { id: "home",    label: "Home" },
  { id: "menu",    label: "Menu" },
  { id: "order",   label: "Order" },
  { id: "offers",  label: "Offers" },
  { id: "about",   label: "About" },
  { id: "contact", label: "Contact" },
];

function Header({ tab, onTab }) {
  const cart = useCart();
  return (
    <header className="site-header">
      <div className="container nav-row">
        <div className="brand" onClick={() => onTab("home")}>
          <div className="brand-logo">🍛</div>
          <div>
            <div className="brand-name">{RST_C.name}</div>
            <div className="brand-sub">Sheffield · Est. {RST_C.est}</div>
          </div>
        </div>

        <nav className="nav-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={"nav-tab" + (tab === t.id ? " active" : "")} onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn admin-btn" onClick={() => alert("Admin panel shown in screenshots — staying on customer site.")}>
            <Icon.Shield /> Admin
          </button>
          <button className="icon-btn cart-btn" onClick={() => cart.setOpen(true)}>
            <Icon.Cart /> Cart
            {cart.count > 0 && <span className="cart-count">{cart.count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Footer ---------- */

function Footer({ onTab }) {
  return (
    <footer style={{ padding: "60px 0 32px", borderTop: "1px solid rgba(253, 186, 116, 0.08)", marginTop: 80 }}>
      <div className="container" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 48 }}>
        <div>
          <div className="brand" style={{ marginBottom: 18 }}>
            <div className="brand-logo">🍛</div>
            <div>
              <div className="brand-name">{RST_C.name}</div>
              <div className="brand-sub">Sheffield · Est. {RST_C.est}</div>
            </div>
          </div>
          <p className="text-muted" style={{ maxWidth: 360, fontSize: 14 }}>
            Authentic Hyderabadi and Andhra cuisine, served fresh on Ecclesall Road since 2000.
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "var(--orange-300)" }}>Explore</div>
          {TABS.map((t) => (
            <div key={t.id} style={{ marginBottom: 10 }}>
              <button onClick={() => onTab(t.id)} className="text-muted" style={{ fontSize: 14 }}>{t.label}</button>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "var(--orange-300)" }}>Visit</div>
          <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
            {RST_C.address}<br/>
            {RST_C.phone}<br/>
            {RST_C.email}
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "var(--orange-300)" }}>Hours</div>
          {RST_C.hours.map((h) => (
            <div key={h.day} className="text-muted" style={{ fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--ink-dim)" }}>{h.day}</span><br/>{h.time}
            </div>
          ))}
        </div>
      </div>
      <div className="container" style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(253, 186, 116, 0.06)", display: "flex", justifyContent: "space-between", color: "var(--faint)", fontSize: 13 }}>
        <span>© {new Date().getFullYear()} Abhiruchulu. All rights reserved.</span>
        <span>Made with 🌶️ in Sheffield</span>
      </div>
    </footer>
  );
}

/* ---------- Cart drawer ---------- */

function CartDrawer({ onCheckout }) {
  const cart = useCart();
  if (!cart.open) return null;
  const empty = cart.items.length === 0;

  return (
    <>
      <div className="cart-backdrop" onClick={() => cart.setOpen(false)} />
      <aside className="cart-drawer">
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(253, 186, 116, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700 }}>Your basket</div>
            <div className="text-muted" style={{ fontSize: 13 }}>{cart.count} item{cart.count === 1 ? "" : "s"}</div>
          </div>
          <button className="icon-btn" style={{ padding: 10, borderRadius: "50%" }} onClick={() => cart.setOpen(false)}><Icon.X /></button>
        </div>

        {empty ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your basket is empty</div>
            <p className="text-muted" style={{ marginBottom: 24, maxWidth: 280 }}>Pick something delicious from our menu to get started.</p>
            <button className="btn btn-primary" onClick={() => { cart.setOpen(false); document.dispatchEvent(new CustomEvent("nav", { detail: "menu" })); }}>Browse menu</button>
          </div>
        ) : (
          <>
            <div className="scroll-y" style={{ flex: 1, padding: "12px 28px" }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: "1px solid rgba(253, 186, 116, 0.06)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(40, 18, 8, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                      <button onClick={() => cart.remove(item.id)} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
                    </div>
                    <div className="text-orange" style={{ fontWeight: 700, marginTop: 2 }}>£{(item.price * item.qty).toFixed(2)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 8 }}>
                      <QtyStepper qty={item.qty} onChange={(q) => cart.setQty(item.id, q)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(253, 186, 116, 0.1)", background: "rgba(13, 6, 4, 0.6)" }}>
              <TotalsBlock />
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => { cart.setOpen(false); onCheckout(); }}>
                Checkout · £{cart.total.toFixed(2)} <Icon.Arrow />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function QtyStepper({ qty, onChange, size = "md" }) {
  const sz = size === "sm" ? { btn: 28, font: 14 } : { btn: 34, font: 16 };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(20, 8, 4, 0.6)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.12)" }}>
      <button onClick={() => onChange(qty - 1)} style={{ width: sz.btn, height: sz.btn, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--orange-300)" }}><Icon.Minus /></button>
      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: sz.font }}>{qty}</span>
      <button onClick={() => onChange(qty + 1)} style={{ width: sz.btn, height: sz.btn, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--orange-300)" }}><Icon.Plus /></button>
    </div>
  );
}

function TotalsBlock({ showCouponInput = false }) {
  const cart = useCart();
  const [code, setCode] = useState("");
  const rows = [
    { label: "Subtotal", value: `£${cart.subtotal.toFixed(2)}` },
    cart.appliedCoupon && { label: `Discount (${cart.appliedCoupon.code})`, value: `−£${cart.discount.toFixed(2)}`, accent: true },
    { label: cart.deliveryFee === 0 ? "Delivery (FREE over £35)" : "Delivery", value: cart.deliveryFee === 0 ? "FREE" : `£${cart.deliveryFee.toFixed(2)}` },
  ].filter(Boolean);

  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: r.accent ? "#4ade80" : "var(--ink-dim)" }}>
          <span>{r.label}</span><span style={{ fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", marginTop: 6, borderTop: "1px solid rgba(253, 186, 116, 0.08)", fontSize: 18 }}>
        <span style={{ fontWeight: 600 }}>Total</span>
        <span style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 22 }} className="text-orange">£{cart.total.toFixed(2)}</span>
      </div>

      {showCouponInput && !cart.appliedCoupon && (
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input className="field-input" placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={() => cart.applyCoupon(code)}>Apply</button>
        </div>
      )}
      {showCouponInput && cart.appliedCoupon && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#4ade80", fontSize: 13 }}><b>{cart.appliedCoupon.code}</b> · {cart.appliedCoupon.title}</span>
          <button onClick={() => cart.setCoupon("")} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Menu item card (used in Menu, Order pages) ---------- */

function MenuItemCard({ item, mode = "card" }) {
  const cart = useCart();
  const inCart = cart.items.find((x) => x.id === item.id);

  if (mode === "row") {
    return (
      <div className="card card-hover" style={{ padding: 20, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 18, background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(234, 88, 12, 0.1))", border: "1px solid rgba(253, 186, 116, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, flexShrink: 0 }}>
          {item.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className={"dot " + (item.veg ? "dot-veg" : "dot-nonveg")} />
            <h4 style={{ fontSize: 19, margin: 0 }}>{item.name}</h4>
            {item.popular && <span className="badge badge-hot" style={{ fontSize: 10, padding: "3px 8px" }}>POPULAR</span>}
          </div>
          <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 520 }}>{item.desc}</p>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          <div className="text-orange" style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--display)" }}>£{item.price.toFixed(2)}</div>
          {inCart ? (
            <QtyStepper qty={inCart.qty} onChange={(q) => cart.setQty(item.id, q)} size="sm" />
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => cart.add(item)}>
              <Icon.Plus /> Add
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover" style={{ padding: 22, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span className={"badge " + (item.veg ? "badge-veg" : "badge-nonveg")}>
          <span className={"dot " + (item.veg ? "dot-veg" : "dot-nonveg")} />
          {item.veg ? "Veg" : "Non-veg"}
        </span>
        {item.popular && <span className="badge badge-hot">🔥 Popular</span>}
      </div>
      <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 74, marginBottom: 10 }}>
        {item.emoji}
      </div>
      <h4 style={{ fontSize: 22, marginBottom: 6 }}>{item.name}</h4>
      <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 18, minHeight: 60 }}>{item.desc}</p>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="text-orange" style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--display)" }}>£{item.price.toFixed(2)}</span>
        {inCart ? (
          <QtyStepper qty={inCart.qty} onChange={(q) => cart.setQty(item.id, q)} size="sm" />
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => cart.add(item)}>
            <Icon.Plus /> Add
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Section header ---------- */

function SectionHeader({ eyebrow, title, lead }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
      <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 18 }}>{title}</h2>
      {lead && <p className="text-muted" style={{ fontSize: 18, lineHeight: 1.6 }}>{lead}</p>}
    </div>
  );
}

/* ---------- Toast host ---------- */

function ToastHost() {
  const cart = useCart();
  if (!cart.toast) return null;
  return <div className="toast"><Icon.Check /> {cart.toast}</div>;
}

Object.assign(window, {
  CartProvider, useCart,
  Header, Footer, CartDrawer, ToastHost,
  MenuItemCard, SectionHeader, QtyStepper, TotalsBlock,
  Icon, TABS,
});
