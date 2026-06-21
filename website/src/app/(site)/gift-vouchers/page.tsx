"use client";

import { useState } from "react";
import Link from "next/link";
import { useConfig } from "@/context/ConfigContext";

function Spinner() {
  return (
    <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
  );
}

export default function GiftVouchersPage() {
  const config = useConfig();
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; amount: number } | null>(null);

  const finalAmount = useCustom ? parseFloat(customAmount) || 0 : amount;
  const valid = finalAmount >= 1 && purchaserEmail && recipientEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/gift-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          purchaserName,
          purchaserEmail,
          recipientEmail,
          recipientName,
          customMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Confirmation ── */
  if (result) {
    return (
      <main>
        <section style={{ padding: "60px 0 80px" }}>
          <div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
            <div className="card" style={{
              padding: 48, textAlign: "center",
              background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(234,88,12,0.08))",
              borderColor: "rgba(16,185,129,0.25)",
            }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🎁</div>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)", marginBottom: 14 }}>
                Gift voucher <span className="gradient-text">created!</span>
              </h1>
              <p className="text-muted" style={{ fontSize: 17, marginBottom: 28 }}>
                Your gift voucher is ready. Share the code below with the lucky recipient.
              </p>
              <div style={{ display: "inline-flex", gap: 24, padding: "20px 36px", borderRadius: 999, background: "rgba(20,8,4,0.5)", border: "1px solid rgba(253,186,116,0.18)", flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
                <div>
                  <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voucher code</div>
                  <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 28, letterSpacing: "0.06em", color: "var(--orange-300)" }}>{result.code}</div>
                </div>
                <div style={{ width: 1, background: "rgba(253,186,116,0.12)" }} />
                <div>
                  <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Value</div>
                  <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 28, color: "#4ade80" }}>£{result.amount.toFixed(2)}</div>
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: 14, marginBottom: 28 }}>
                An email has been sent to <b style={{ color: "var(--ink-dim)" }}>{recipientEmail}</b> with the voucher details.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => setResult(null)}>Buy another</button>
                <Link href="/" className="btn btn-ghost">Back to home</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      {/* Hero */}
      <section style={{ padding: "60px 0 48px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎁</div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", marginBottom: 16 }}>
            Give the gift of <span className="gradient-text">great food</span>
          </h1>
          <p className="text-muted" style={{ fontSize: 18, marginBottom: 0, maxWidth: 520, margin: "0 auto" }}>
            Treat someone special to authentic South Indian cuisine. Gift vouchers can be redeemed on any order.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>

            {/* Amount */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>Choose amount</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10, marginBottom: 16 }}>
                {config.giftVoucherPresets.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmount(a); setUseCustom(false); }}
                    style={{
                      padding: "16px 8px", borderRadius: 14, textAlign: "center",
                      background: !useCustom && amount === a ? "rgba(234,88,12,0.18)" : "rgba(20,8,4,0.4)",
                      border: `1px solid ${!useCustom && amount === a ? "var(--orange-500)" : "rgba(253,186,116,0.1)"}`,
                      cursor: "pointer", transition: "all 160ms",
                    }}
                  >
                    <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 22, color: !useCustom && amount === a ? "var(--orange-300)" : "var(--ink)" }}>£{a}</div>
                  </button>
                ))}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  style={{
                    padding: "12px 20px", borderRadius: 14, width: "100%", textAlign: "left",
                    background: useCustom ? "rgba(234,88,12,0.12)" : "rgba(20,8,4,0.4)",
                    border: `1px solid ${useCustom ? "var(--orange-500)" : "rgba(253,186,116,0.1)"}`,
                    color: "var(--ink-dim)", fontSize: 15, cursor: "pointer",
                  }}
                >
                  Custom amount
                </button>
                {useCustom && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      <span style={{ padding: "10px 14px", background: "rgba(30,12,4,0.6)", border: "1px solid rgba(253,186,116,0.15)", borderRight: 0, borderRadius: "10px 0 0 10px", fontWeight: 700, color: "var(--orange-300)" }}>£</span>
                      <input
                        className="field-input"
                        type="number"
                        min="1"
                        max="500"
                        step="0.01"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        style={{ borderRadius: "0 10px 10px 0", flex: 1 }}
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </div>
              {finalAmount > 0 && (
                <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted" style={{ fontSize: 14 }}>Voucher value</span>
                  <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, color: "#4ade80" }}>£{finalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Recipient */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>Recipient details</h3>
              <div style={{ display: "grid", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Recipient name (optional)</label>
                  <input className="field-input" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Sarah Mitchell" />
                </div>
                <div className="field">
                  <label className="field-label">Recipient email *</label>
                  <input className="field-input" type="email" required value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="sarah@example.com" />
                </div>
                <div className="field">
                  <label className="field-label">Personal message (optional)</label>
                  <textarea
                    className="field-textarea"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Happy birthday! Enjoy a wonderful meal on me..."
                    style={{ minHeight: 90 }}
                  />
                </div>
              </div>
            </div>

            {/* Purchaser */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>Your details</h3>
              <div style={{ display: "grid", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Your name (optional)</label>
                  <input className="field-input" value={purchaserName} onChange={(e) => setPurchaserName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="field">
                  <label className="field-label">Your email *</label>
                  <input className="field-input" type="email" required value={purchaserEmail} onChange={(e) => setPurchaserEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", fontSize: 17, padding: "18px 28px", opacity: (!valid || submitting) ? 0.5 : 1, cursor: (!valid || submitting) ? "not-allowed" : "pointer" }}
              disabled={!valid || submitting}
            >
              {submitting ? <><Spinner /> Creating voucher…</> : <>🎁 Buy Gift Voucher · £{finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}</>}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
