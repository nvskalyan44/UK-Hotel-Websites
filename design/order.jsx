/* ============================================================
   ORDER — Full ordering flow: menu → details → payment → confirm
   ============================================================ */

const { RESTAURANT: ORST, MENU: OMENU, CATEGORIES: OCATS, COUPONS: OCPNS } = window.__DATA;

function OrderPage({ onTab }) {
  const cart = useCart();
  /** stage: "build" | "details" | "payment" | "confirm" */
  const [stage, setStage] = useState("build");
  const [order, setOrder] = useState(null);

  if (stage === "confirm" && order) {
    return <ConfirmationView order={order} onTab={onTab} reset={() => { cart.clear(); setStage("build"); setOrder(null); }} />;
  }

  return (
    <main>
      <section style={{ padding: "40px 0 24px" }}>
        <div className="container">
          {/* Stepper */}
          <Stepper stage={stage} />
        </div>
      </section>

      <section style={{ paddingBottom: 80 }}>
        <div className="container">
          {stage === "build" && <BuildStage onNext={() => setStage("details")} onTab={onTab} />}
          {stage === "details" && <DetailsStage onBack={() => setStage("build")} onNext={(d) => { setOrder({ details: d }); setStage("payment"); }} />}
          {stage === "payment" && <PaymentStage onBack={() => setStage("details")} order={order} onComplete={(o) => { setOrder(o); setStage("confirm"); }} />}
        </div>
      </section>
    </main>
  );
}

function Stepper({ stage }) {
  const steps = [
    { id: "build", label: "Build your order", n: 1 },
    { id: "details", label: "Delivery details", n: 2 },
    { id: "payment", label: "Payment", n: 3 },
    { id: "confirm", label: "Confirmation", n: 4 },
  ];
  const idx = steps.findIndex((s) => s.id === stage);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.id}>
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
                {done ? <Icon.Check /> : s.n}
              </div>
              <span style={{ fontSize: 14, fontWeight: active || done ? 600 : 400, color: active ? "var(--orange-300)" : done ? "var(--ink)" : "var(--muted)" }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 40, height: 1, background: i < idx ? "var(--green-500)" : "rgba(253, 186, 116, 0.15)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ============================================================
   STAGE 1: BUILD
   ============================================================ */

function BuildStage({ onNext, onTab }) {
  const cart = useCart();
  const [cat, setCat] = useState("All");
  const filtered = useMemo(() => cat === "All" ? OMENU : OMENU.filter((m) => m.category === cat), [cat]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "flex-start" }}>
      <div>
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", marginBottom: 8 }}>
          Start your <span className="gradient-text">order</span>.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>Pick from {OMENU.length} dishes. Min order £{ORST.minOrder}. Free delivery over £{ORST.freeDeliveryThreshold}.</p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, padding: 10, background: "rgba(20, 8, 4, 0.4)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.08)" }}>
          {OCATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={"nav-tab" + (cat === c ? " active" : "")} style={{ padding: "8px 18px", fontSize: 14 }}>{c}</button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((m) => <MenuItemCard key={m.id} item={m} mode="row" />)}
        </div>
      </div>

      {/* Sticky basket sidebar */}
      <div style={{ position: "sticky", top: 100 }}>
        <BasketSidebar onNext={onNext} onTab={onTab} />
      </div>
    </div>
  );
}

function BasketSidebar({ onNext, onTab }) {
  const cart = useCart();
  const [code, setCode] = useState("");
  const tooLow = cart.subtotal > 0 && cart.subtotal < ORST.minOrder;
  const empty = cart.items.length === 0;

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
              <div style={{ display: "flex", gap: 8 }}>
                <input className="field-input" style={{ flex: 1, padding: "10px 14px", fontSize: 14 }} placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                <button className="btn btn-ghost btn-sm" onClick={() => cart.applyCoupon(code)}>Apply</button>
              </div>
            ) : (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#4ade80", fontSize: 13 }}><b>{cart.appliedCoupon.code}</b> applied</span>
                <button onClick={() => cart.setCoupon("")} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
              </div>
            )}
            {!cart.appliedCoupon && (
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {OCPNS.slice(0, 3).map((c) => (
                  <button key={c.code} onClick={() => cart.applyCoupon(c.code)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700, borderRadius: 999, background: "rgba(234, 88, 12, 0.12)", border: "1px dashed rgba(253, 186, 116, 0.3)", color: "var(--orange-300)", letterSpacing: "0.05em" }}>{c.code}</button>
                ))}
              </div>
            )}
          </div>

          <TotalsBlock />

          {tooLow && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.25)", fontSize: 13, color: "var(--yellow-300)", display: "flex", gap: 8 }}>
              ⚠️ Add £{(ORST.minOrder - cart.subtotal).toFixed(2)} more to meet the £{ORST.minOrder} minimum order.
            </div>
          )}
          {!tooLow && cart.subtotal > 0 && cart.subtotal < ORST.freeDeliveryThreshold && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(234, 88, 12, 0.08)", border: "1px solid rgba(234, 88, 12, 0.2)", fontSize: 13, color: "var(--orange-300)" }}>
              🚲 Add £{(ORST.freeDeliveryThreshold - cart.subtotal).toFixed(2)} more for free delivery.
            </div>
          )}

          <button className="btn btn-primary" style={{ width: "100%", marginTop: 18, opacity: tooLow ? 0.5 : 1, cursor: tooLow ? "not-allowed" : "pointer" }} disabled={tooLow} onClick={onNext}>
            Continue to delivery <Icon.Arrow />
          </button>
        </>
      )}

      {empty && (
        <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8 }} onClick={() => onTab("menu")}>Browse the full menu</button>
      )}
    </div>
  );
}

/* ============================================================
   STAGE 2: DETAILS
   ============================================================ */

function DetailsStage({ onBack, onNext }) {
  const cart = useCart();
  const [details, setDetails] = useState(() => {
    try { return JSON.parse(localStorage.getItem("abhi_details") || "null") || defaults(); } catch { return defaults(); }
  });
  function defaults() { return { type: "delivery", name: "", phone: "", email: "", address: "", postcode: "", time: "asap", scheduledTime: "", instructions: "" }; }

  const set = (k, v) => setDetails((d) => ({ ...d, [k]: v }));
  const valid = details.name && details.phone && details.email && (details.type === "collection" || (details.address && details.postcode));

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    localStorage.setItem("abhi_details", JSON.stringify(details));
    onNext(details);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "flex-start" }}>
      <form onSubmit={submit}>
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", marginBottom: 8 }}>
          <span className="gradient-text">Delivery</span> details.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>Tell us where to send the food.</p>

        {/* Order type */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="field-label" style={{ marginBottom: 14 }}>Order type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { id: "delivery",   icon: "🚲", title: "Delivery", sub: `£${ORST.deliveryCharge} · 35 min` },
              { id: "collection", icon: "🏪", title: "Collection", sub: "FREE · 20 min" },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
                <input className="field-input" required value={details.postcode} onChange={(e) => set("postcode", e.target.value.toUpperCase())} placeholder="S11 8ZF" />
              </div>
            </div>
          </div>
        )}

        {/* Timing */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 19, marginBottom: 16 }}>When?</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[
              { id: "asap", title: "As soon as possible", sub: details.type === "delivery" ? "~ 35 min" : "~ 20 min" },
              { id: "scheduled", title: "Schedule for later", sub: "Pick a time" },
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
            <input type="datetime-local" className="field-input" value={details.scheduledTime} onChange={(e) => set("scheduledTime", e.target.value)} />
          )}
        </div>

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
            Continue to payment <Icon.Arrow />
          </button>
        </div>
      </form>

      <div style={{ position: "sticky", top: 100 }}>
        <OrderSummaryCard />
      </div>
    </div>
  );
}

/* ============================================================
   STAGE 3: PAYMENT
   ============================================================ */

function PaymentStage({ onBack, order, onComplete }) {
  const cart = useCart();
  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");

  const valid = method !== "card" || (card.number.replace(/\s/g, "").length >= 13 && card.name && card.expiry.length >= 5 && card.cvc.length >= 3);

  const submit = (e) => {
    e.preventDefault();
    if (!valid || !agreed) return;
    setProcessing(true);
    setTimeout(() => {
      const orderId = "ABH-" + Math.floor(100000 + Math.random() * 900000);
      const eta = Math.floor((order.details.type === "delivery" ? 35 : 20) + Math.random() * 10);
      onComplete({
        ...order,
        id: orderId,
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        coupon: cart.appliedCoupon?.code,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        method,
        eta,
        placedAt: new Date().toISOString(),
      });
    }, 1600);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "flex-start" }}>
      <form onSubmit={submit}>
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", marginBottom: 8 }}>
          <span className="gradient-text">Payment</span>.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>Secured by 256-bit SSL · We never store your card details.</p>

        {/* Method selector */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="field-label" style={{ marginBottom: 14 }}>Payment method</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { id: "card",   icon: "💳", title: "Card" },
              { id: "applepay", icon: "🍎", title: "Apple Pay" },
              { id: "cash",   icon: "💷", title: "Cash on " + (order.details.type === "delivery" ? "delivery" : "collection") },
            ].map((m) => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)} style={{
                padding: 18, borderRadius: 14, textAlign: "center",
                background: method === m.id ? "rgba(234, 88, 12, 0.15)" : "rgba(20, 8, 4, 0.4)",
                border: "1px solid " + (method === m.id ? "var(--orange-500)" : "rgba(253, 186, 116, 0.1)"),
              }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Card form */}
        {method === "card" && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              Card details
              <span style={{ display: "inline-flex", gap: 4, marginLeft: "auto", opacity: 0.6 }}>
                <CardBrand brand="visa" /> <CardBrand brand="mc" /> <CardBrand brand="amex" />
              </span>
            </h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div className="field">
                <label className="field-label">Card number</label>
                <input className="field-input" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} placeholder="4242 4242 4242 4242" />
              </div>
              <div className="field">
                <label className="field-label">Name on card</label>
                <input className="field-input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Sarah Mitchell" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Expiry</label>
                  <input className="field-input" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY" />
                </div>
                <div className="field">
                  <label className="field-label">CVC</label>
                  <input className="field-input" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" />
                </div>
              </div>
            </div>
          </div>
        )}

        {method === "applepay" && (
          <div className="card" style={{ padding: 36, marginBottom: 20, textAlign: "center", background: "linear-gradient(135deg, rgba(255,255,255,0.04), transparent)" }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🍎</div>
            <h3 style={{ fontSize: 22, marginBottom: 6 }}>Pay with Apple Pay</h3>
            <p className="text-muted" style={{ fontSize: 14 }}>You'll confirm with Face ID or Touch ID when you tap Place Order.</p>
          </div>
        )}

        {method === "cash" && (
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontSize: 19, marginBottom: 8 }}>💷 Pay on {order.details.type === "delivery" ? "delivery" : "collection"}</h3>
            <p className="text-muted" style={{ fontSize: 14 }}>
              {order.details.type === "delivery"
                ? "Have £" + cart.total.toFixed(2) + " ready for the rider. Card machine available if you'd prefer."
                : "Pay at the counter when you collect. Card or contactless welcome."}
            </p>
          </div>
        )}

        {/* T&Cs */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: "rgba(20, 8, 4, 0.4)", borderRadius: 14, border: "1px solid rgba(253, 186, 116, 0.1)", marginBottom: 20, cursor: "pointer" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: "var(--orange-500)" }} />
          <span style={{ fontSize: 14, lineHeight: 1.5 }} className="text-muted">
            I confirm my order is correct, agree to Abhiruchulu's terms of service, and consent to my data being used to fulfil this order.
          </span>
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, opacity: (valid && agreed && !processing) ? 1 : 0.5, cursor: (valid && agreed && !processing) ? "pointer" : "not-allowed" }} disabled={!valid || !agreed || processing}>
            {processing ? <><Spinner /> Processing payment…</> : <>🔒 Place order · £{cart.total.toFixed(2)}</>}
          </button>
        </div>
      </form>

      <div style={{ position: "sticky", top: 100 }}>
        <OrderSummaryCard details={order.details} />
      </div>
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function CardBrand({ brand }) {
  const styles = {
    visa: { bg: "#1a1f71", text: "VISA", color: "white" },
    mc:   { bg: "#000",    text: "MC",   color: "#ff5f00" },
    amex: { bg: "#006fcf", text: "AMEX", color: "white" },
  };
  const s = styles[brand];
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", padding: "4px 8px", borderRadius: 4 }}>{s.text}</span>;
}

/* ---------- Order summary side card ---------- */

function OrderSummaryCard({ details }) {
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
      <TotalsBlock />

      {details && (
        <>
          <div className="divider" style={{ margin: "16px 0" }} />
          <div style={{ fontSize: 13 }} className="text-muted">
            <div style={{ marginBottom: 6 }}><b style={{ color: "var(--ink-dim)" }}>{details.type === "delivery" ? "🚲 Delivering to" : "🏪 Collection by"}:</b> {details.name}</div>
            {details.type === "delivery" && <div>{details.address}, {details.postcode}</div>}
            <div>{details.time === "asap" ? "ASAP" : "Scheduled: " + details.scheduledTime}</div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   STAGE 4: CONFIRMATION
   ============================================================ */

function ConfirmationView({ order, onTab, reset }) {
  const [stepIdx, setStepIdx] = useState(0);
  const trackingSteps = order.details.type === "delivery"
    ? [
        { label: "Order received", icon: "📋", time: "Just now" },
        { label: "Preparing in the kitchen", icon: "👨‍🍳", time: "~ 5 min" },
        { label: "Out for delivery", icon: "🚲", time: "~ 25 min" },
        { label: "Delivered", icon: "🎉", time: `~ ${order.eta} min` },
      ]
    : [
        { label: "Order received", icon: "📋", time: "Just now" },
        { label: "Preparing in the kitchen", icon: "👨‍🍳", time: "~ 5 min" },
        { label: "Ready for collection", icon: "🎉", time: `~ ${order.eta} min` },
      ];

  useEffect(() => {
    const t = setTimeout(() => { if (stepIdx === 0) setStepIdx(1); }, 1800);
    return () => clearTimeout(t);
  }, [stepIdx]);

  return (
    <main>
      <section style={{ padding: "60px 0" }}>
        <div className="container" style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Hero */}
          <div className="card" style={{ padding: 48, textAlign: "center", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(234, 88, 12, 0.08))", borderColor: "rgba(16, 185, 129, 0.25)", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--green-500), var(--green-400))", color: "white", marginBottom: 24, boxShadow: "0 0 0 8px rgba(16, 185, 129, 0.15), 0 0 0 16px rgba(16, 185, 129, 0.08), 0 12px 30px rgba(16, 185, 129, 0.4)" }}>
              <Icon.Check style={{ width: 36, height: 36 }} />
            </div>
            <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 14 }}>
              Order <span className="gradient-text">placed!</span>
            </h1>
            <p className="text-muted" style={{ fontSize: 18, marginBottom: 24 }}>
              Thank you, {order.details.name.split(" ")[0]}. We've sent a confirmation to <b style={{ color: "var(--ink-dim)" }}>{order.details.email}</b>.
            </p>
            <div style={{ display: "inline-flex", gap: 24, padding: "16px 32px", borderRadius: 999, background: "rgba(20, 8, 4, 0.5)", border: "1px solid rgba(253, 186, 116, 0.12)" }}>
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

          {/* Tracking */}
          <div className="card" style={{ padding: 36, marginBottom: 24 }}>
            <h3 style={{ fontSize: 24, marginBottom: 24 }}>Live tracking</h3>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 27, top: 28, bottom: 28, width: 2, background: "rgba(253, 186, 116, 0.12)" }} />
              <div style={{ position: "absolute", left: 27, top: 28, height: `calc(${stepIdx / (trackingSteps.length - 1) * 100}% - 4px)`, width: 2, background: "linear-gradient(to bottom, var(--green-500), var(--orange-500))", transition: "height 800ms ease" }} />
              {trackingSteps.map((s, i) => {
                const done = i <= stepIdx;
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

          {/* Order details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div className="card" style={{ padding: 28 }}>
              <h4 style={{ fontSize: 18, marginBottom: 16 }}>📍 {order.details.type === "delivery" ? "Delivering to" : "Collecting from"}</h4>
              {order.details.type === "delivery" ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.details.name}</div>
                  <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {order.details.address}<br/>{order.details.postcode}
                  </div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>📞 {order.details.phone}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{ORST.name}</div>
                  <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{ORST.address}</div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>Collected by: {order.details.name}</div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 28 }}>
              <h4 style={{ fontSize: 18, marginBottom: 16 }}>💳 Payment</h4>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {order.method === "card" && "Card payment"}
                {order.method === "applepay" && "Apple Pay"}
                {order.method === "cash" && `Cash on ${order.details.type}`}
              </div>
              <div className="text-muted" style={{ fontSize: 14 }}>
                {order.method === "cash" ? `Have £${order.total.toFixed(2)} ready` : "Paid in full"}
              </div>
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
              <TotalsBlock />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => { reset(); onTab("home"); }}>Back to home</button>
            <button className="btn btn-ghost" onClick={() => { reset(); onTab("menu"); }}>Order again</button>
            <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print receipt</button>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { OrderPage });
