"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

type Tab = "email" | "phone";
type Mode = "login" | "register";
type ResetStep = "idle" | "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useUser();
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email/password fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneReg, setPhoneReg] = useState("");

  // Phone/OTP fields
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  // Password reset
  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetDemoOtp, setResetDemoOtp] = useState("");

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send reset code"); return; }
      setResetDemoOtp(data.demo_otp ?? "");
      setResetStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", email: resetEmail, otp: resetOtp, newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reset password"); return; }
      setResetStep("idle");
      setError("");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { name, email, password, phone: phoneReg || undefined } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      refresh();
      router.push("/account");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) { setError("Enter your phone number"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      setOtpSent(true);
      setDemoOtp(data.demo_otp ?? "");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: phone.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid OTP"); return; }
      refresh();
      router.push("/account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🍛</div>
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>
            {mode === "register" ? "Create account" : <><span className="gradient-text">Welcome</span> back</>}
          </h1>
          <p className="text-muted" style={{ fontSize: 16 }}>
            {mode === "register" ? "Track orders and earn loyalty points." : "Sign in to view your orders and loyalty points."}
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Tab switcher */}
          {mode === "login" && (
            <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(20, 8, 4, 0.5)", borderRadius: 999, border: "1px solid rgba(253, 186, 116, 0.08)", marginBottom: 28 }}>
              <button onClick={() => { setTab("email"); setError(""); }} className={"nav-tab" + (tab === "email" ? " active" : "")} style={{ flex: 1, padding: "9px 0", fontSize: 14, textAlign: "center" }}>
                📧 Email & Password
              </button>
              <button onClick={() => { setTab("phone"); setError(""); setOtpSent(false); setDemoOtp(""); }} className={"nav-tab" + (tab === "phone" ? " active" : "")} style={{ flex: 1, padding: "9px 0", fontSize: 14, textAlign: "center" }}>
                📱 Phone & OTP
              </button>
            </div>
          )}

          {/* Forgot password — reset form */}
          {tab === "email" && mode === "login" && resetStep !== "idle" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={() => { setResetStep("idle"); setError(""); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>←</button>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Reset password</h2>
              </div>

              {resetStep === "email" && (
                <form onSubmit={handleResetRequest} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="field">
                    <label className="field-label">Email address</label>
                    <input className="field-input" type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  {error && <div style={{ fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
                  <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 14, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                    {loading ? "Sending…" : "Send reset code"}
                  </button>
                </form>
              )}

              {resetStep === "otp" && (
                <form onSubmit={handleResetConfirm} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {resetDemoOtp && (
                    <div style={{ padding: "12px 16px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12, fontSize: 13 }}>
                      <div style={{ color: "var(--yellow-300)", fontWeight: 600, marginBottom: 4 }}>Demo mode</div>
                      <div className="text-muted">Your reset code is <b style={{ color: "var(--orange-300)", letterSpacing: "0.15em", fontSize: 16 }}>{resetDemoOtp}</b></div>
                    </div>
                  )}
                  <div className="field">
                    <label className="field-label">Reset code</label>
                    <input className="field-input" required value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" style={{ letterSpacing: "0.25em", fontSize: 20, textAlign: "center" }} />
                  </div>
                  <div className="field">
                    <label className="field-label">New password</label>
                    <input className="field-input" type="password" required value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                  </div>
                  {error && <div style={{ fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
                  <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 14, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                    {loading ? "Resetting…" : "Reset password"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Email / Register form */}
          {(tab === "email" || mode === "register") && resetStep === "idle" && (
            <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {mode === "register" && (
                <>
                  <div className="field">
                    <label className="field-label">Full name</label>
                    <input className="field-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Mitchell" />
                  </div>
                  <div className="field">
                    <label className="field-label">Phone number <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                    <input className="field-input" type="tel" value={phoneReg} onChange={e => setPhoneReg(e.target.value)} placeholder="+44 7700 900000" />
                  </div>
                </>
              )}
              <div className="field">
                <label className="field-label">Email address</label>
                <input className="field-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <input className="field-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                {mode === "login" && (
                  <button type="button" onClick={() => { setResetEmail(email); setResetStep("email"); setError(""); }} style={{ background: "none", border: "none", color: "var(--orange-300)", fontSize: 12, cursor: "pointer", textAlign: "right", marginTop: 6, padding: 0 }}>
                    Forgot password?
                  </button>
                )}
              </div>

              {error && <div style={{ fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 14, marginTop: 4, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
              </button>
            </form>
          )}

          {/* Phone / OTP form */}
          {tab === "phone" && mode === "login" && (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Mobile number</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    className="field-input"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setOtpSent(false); setDemoOtp(""); }}
                    placeholder="+44 7700 900000"
                    disabled={otpSent}
                    style={{ flex: 1 }}
                  />
                  {!otpSent && (
                    <button type="button" className="btn btn-ghost btn-sm" style={{ whiteSpace: "nowrap" }} onClick={handleSendOtp} disabled={loading}>
                      {loading ? "…" : "Send OTP"}
                    </button>
                  )}
                </div>
              </div>

              {demoOtp && (
                <div style={{ padding: "12px 16px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12, fontSize: 13 }}>
                  <div style={{ color: "var(--yellow-300)", fontWeight: 600, marginBottom: 4 }}>🧪 Demo mode</div>
                  <div className="text-muted">Your OTP is <b style={{ color: "var(--orange-300)", letterSpacing: "0.15em", fontSize: 16 }}>{demoOtp}</b></div>
                  <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>In production this would be sent via SMS.</div>
                </div>
              )}

              {otpSent && (
                <div className="field">
                  <label className="field-label">6-digit OTP</label>
                  <input className="field-input" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" style={{ letterSpacing: "0.25em", fontSize: 20, textAlign: "center" }} />
                </div>
              )}

              {error && <div style={{ fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

              {otpSent && (
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 14, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                  {loading ? "Verifying…" : "Verify & Sign in"}
                </button>
              )}

              {otpSent && (
                <button type="button" onClick={() => { setOtpSent(false); setDemoOtp(""); setOtp(""); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", textAlign: "center" }}>
                  Change number
                </button>
              )}
            </form>
          )}

          {/* Toggle login / register */}
          {resetStep === "idle" && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(253, 186, 116, 0.08)", textAlign: "center", fontSize: 14 }}>
              {mode === "login" ? (
                <span className="text-muted">
                  New customer?{" "}
                  <button onClick={() => { setMode("register"); setError(""); }} style={{ background: "none", border: "none", color: "var(--orange-300)", fontWeight: 600, cursor: "pointer" }}>
                    Create an account
                  </button>
                </span>
              ) : (
                <span className="text-muted">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "var(--orange-300)", fontWeight: 600, cursor: "pointer" }}>
                    Sign in
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/" className="text-muted" style={{ fontSize: 13 }}>← Back to home</Link>
        </div>
      </div>
    </main>
  );
}
