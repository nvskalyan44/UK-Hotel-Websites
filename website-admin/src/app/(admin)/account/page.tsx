"use client";

import { useState, useEffect } from "react";

type StaffAccount = { id: number; username: string; updatedAt: string };

type TotpSetup = { secret: string; qrUrl: string } | null;

export default function AccountPage() {
  const [username, setUsername] = useState("admin");
  const [form, setForm] = useState({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [newStaff, setNewStaff] = useState({ username: "", password: "" });
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState("");

  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TotpSetup>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpMsg, setTotpMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [totpWorking, setTotpWorking] = useState(false);

  useEffect(() => {
    fetch("/api/admin/account")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.username) setUsername(d.username); })
      .catch(() => {});
    fetch("/api/admin/staff").then(r => r.ok ? r.json() : []).then(setStaff).catch(() => {});
    fetch("/api/admin/auth/totp?action=status")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTotpEnabled(d.enabled); })
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMsg({ text: "New passwords do not match", ok: false });
      return;
    }
    if (!form.newUsername.trim() && !form.newPassword.trim()) {
      setMsg({ text: "Enter a new username or password to update", ok: false });
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newUsername: form.newUsername.trim() || undefined,
        newPassword: form.newPassword.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      if (data.username) setUsername(data.username);
      setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
      setMsg({ text: "Credentials updated successfully", ok: true });
    } else {
      setMsg({ text: data.error ?? "Failed to update credentials", ok: false });
    }
  };

  const addStaff = async () => {
    setStaffError("");
    if (!newStaff.username.trim() || !newStaff.password.trim()) { setStaffError("Username and password required"); return; }
    setStaffSaving(true);
    try {
      const res = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStaff) });
      const data = await res.json();
      if (!res.ok) { setStaffError(data.error || "Failed"); return; }
      setStaff(prev => [...prev, data]);
      setNewStaff({ username: "", password: "" });
    } finally { setStaffSaving(false); }
  };

  const removeStaff = async (id: number) => {
    if (!confirm("Remove this staff account?")) return;
    const res = await fetch("/api/admin/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed"); return; }
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const startTotpSetup = async () => {
    setTotpWorking(true);
    setTotpMsg(null);
    try {
      const res = await fetch("/api/admin/auth/totp?action=setup", { method: "POST" });
      const d = await res.json();
      if (!res.ok) { setTotpMsg({ text: d.error ?? "Failed", ok: false }); return; }
      setTotpSetup(d);
      setTotpCode("");
    } finally { setTotpWorking(false); }
  };

  const confirmTotp = async () => {
    if (!totpSetup || totpCode.length !== 6) { setTotpMsg({ text: "Enter the 6-digit code from your authenticator app", ok: false }); return; }
    setTotpWorking(true);
    setTotpMsg(null);
    try {
      const res = await fetch("/api/admin/auth/totp?action=verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode, secret: totpSetup.secret }),
      });
      const d = await res.json();
      if (!res.ok) { setTotpMsg({ text: d.error ?? "Invalid code", ok: false }); return; }
      setTotpEnabled(true);
      setTotpSetup(null);
      setTotpCode("");
      setTotpMsg({ text: "Two-factor authentication enabled successfully", ok: true });
    } finally { setTotpWorking(false); }
  };

  const disableTotp = async () => {
    if (!confirm("Disable two-factor authentication?")) return;
    setTotpWorking(true);
    setTotpMsg(null);
    try {
      const res = await fetch("/api/admin/auth/totp?action=disable", { method: "POST" });
      const d = await res.json();
      if (!res.ok) { setTotpMsg({ text: d.error ?? "Failed", ok: false }); return; }
      setTotpEnabled(false);
      setTotpSetup(null);
      setTotpMsg({ text: "Two-factor authentication has been disabled", ok: true });
    } finally { setTotpWorking(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

      {/* Left — Account info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="a-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #f59e0b, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🔑</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Admin Account</div>
              <div style={{ fontSize: 13, color: "var(--a-muted)", marginTop: 4 }}>
                Logged in as <span style={{ color: "var(--a-orange-l)", fontWeight: 700 }}>{username}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "👤", label: "Username", value: username },
              { icon: "🔒", label: "Password", value: "••••••••" },
              { icon: "🏢", label: "Role", value: "Restaurant Owner" },
              { icon: "🌐", label: "Access", value: "Full admin access" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--a-border)" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{row.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="a-card" style={{ padding: 20, background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div style={{ fontSize: 13, color: "var(--a-muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--a-text)" }}>Security tip:</strong> Use a strong password with at least 8 characters, including numbers and special characters. Change your credentials regularly.
            </div>
          </div>
        </div>
      </div>

      {/* Right — Change credentials form */}
      <div className="a-card" style={{ padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Change Credentials</div>

        {msg && (
          <div style={{ background: msg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${msg.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: msg.ok ? "#34d399" : "#f87171", marginBottom: 20 }}>
            {msg.ok ? "✓ " : "✕ "}{msg.text}
          </div>
        )}

        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="a-field">
            <label>Current Password <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="password" value={form.currentPassword} onChange={set("currentPassword")} placeholder="Required to make any changes" required />
          </div>

          <div style={{ height: 1, background: "var(--a-border)" }} />

          <div className="a-field">
            <label>New Username <span style={{ color: "var(--a-muted)", fontWeight: 400, fontSize: 11 }}>(leave blank to keep current)</span></label>
            <input value={form.newUsername} onChange={set("newUsername")} placeholder={username} />
          </div>
          <div className="a-field">
            <label>New Password <span style={{ color: "var(--a-muted)", fontWeight: 400, fontSize: 11 }}>(leave blank to keep current)</span></label>
            <input type="password" value={form.newPassword} onChange={set("newPassword")} placeholder="New password" />
          </div>
          <div className="a-field">
            <label>Confirm New Password</label>
            <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Confirm new password" />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="submit" className="admin-action-btn" disabled={saving} style={{ flex: 1, justifyContent: "center", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Update Credentials"}
            </button>
            <button type="button" className="a-filter-btn" style={{ padding: "10px 18px" }}
              onClick={() => setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" })}>
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Two-Factor Authentication */}
    <div className="a-card" style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>🔐</span>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Two-Factor Authentication (2FA)</div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
          background: totpEnabled ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.08)",
          color: totpEnabled ? "#34d399" : "#f87171",
          border: `1px solid ${totpEnabled ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          {totpEnabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--a-muted)", marginBottom: 20 }}>
        Secure your account with a time-based one-time password (TOTP) authenticator app such as Google Authenticator or Authy.
      </div>

      {totpMsg && (
        <div style={{
          background: totpMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${totpMsg.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
          borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600,
          color: totpMsg.ok ? "#34d399" : "#f87171", marginBottom: 20,
        }}>
          {totpMsg.ok ? "✓ " : "✕ "}{totpMsg.text}
        </div>
      )}

      {!totpEnabled && !totpSetup && (
        <button className="admin-action-btn" onClick={startTotpSetup} disabled={totpWorking} style={{ opacity: totpWorking ? 0.7 : 1 }}>
          {totpWorking ? "Setting up…" : "Enable 2FA"}
        </button>
      )}

      {totpEnabled && !totpSetup && (
        <button className="a-filter-btn" onClick={disableTotp} disabled={totpWorking} style={{ color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)", opacity: totpWorking ? 0.7 : 1 }}>
          {totpWorking ? "Disabling…" : "Disable 2FA"}
        </button>
      )}

      {totpSetup && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 10 }}>1. Scan this QR code with your authenticator app</div>
              <img
                src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(totpSetup.qrUrl)}`}
                alt="TOTP QR Code"
                width={200}
                height={200}
                style={{ borderRadius: 8, border: "4px solid #fff", display: "block" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 8 }}>
                Or enter this secret manually:
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 13, padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid var(--a-border)", letterSpacing: "0.1em", marginBottom: 20 }}>
                {totpSetup.secret}
              </div>
              <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 8 }}>
                2. Enter the 6-digit code from your app to confirm
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  style={{ padding: "10px 14px", width: 120, background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 20, textAlign: "center", letterSpacing: "0.2em" }}
                />
                <button className="admin-action-btn" onClick={confirmTotp} disabled={totpWorking || totpCode.length !== 6} style={{ opacity: (totpWorking || totpCode.length !== 6) ? 0.7 : 1 }}>
                  {totpWorking ? "Verifying…" : "Confirm & Enable"}
                </button>
                <button className="a-filter-btn" onClick={() => { setTotpSetup(null); setTotpCode(""); }} style={{ padding: "10px 14px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Staff accounts management */}
    <div className="a-card" style={{ padding: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Staff Accounts</div>
      <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 20 }}>Manage who can log in to this admin panel</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {staff.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--a-border)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #f59e0b, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0 }}>
              {s.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.username}</div>
              <div style={{ fontSize: 11, color: "var(--a-muted)" }}>Last updated {new Date(s.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
            {s.username === username && <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Current</span>}
            {s.username !== username && (
              <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 10px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }} onClick={() => removeStaff(s.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--a-border)", paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 10 }}>Add staff account</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="a-field" style={{ margin: 0 }}>
            <label>Username</label>
            <input value={newStaff.username} onChange={e => setNewStaff(p => ({ ...p, username: e.target.value }))} placeholder="staff_name" />
          </div>
          <div className="a-field" style={{ margin: 0 }}>
            <label>Password</label>
            <input type="password" value={newStaff.password} onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" />
          </div>
          <button className="admin-action-btn" onClick={addStaff} disabled={staffSaving || !newStaff.username.trim() || !newStaff.password.trim()} style={{ opacity: staffSaving ? 0.7 : 1, height: 38 }}>
            Add
          </button>
        </div>
        {staffError && <div style={{ fontSize: 12, color: "var(--a-red)", marginTop: 8 }}>{staffError}</div>}
      </div>
    </div>
    </div>
  );
}
