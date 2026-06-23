"use client";

import { useState, useEffect } from "react";

type DayHours = { open: string; close: string; closed: boolean };
type HoursMap = Record<string, DayHours>;

type DeliveryZone = { prefix: string; fee: number; active: boolean };

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_HOURS: HoursMap = {
  mon: { open: "12:00", close: "22:00", closed: false },
  tue: { open: "12:00", close: "22:00", closed: false },
  wed: { open: "12:00", close: "22:00", closed: false },
  thu: { open: "12:00", close: "22:00", closed: false },
  fri: { open: "12:00", close: "23:00", closed: false },
  sat: { open: "12:00", close: "23:00", closed: false },
  sun: { open: "12:00", close: "21:30", closed: false },
};

type Form = {
  name: string; tagline: string; address: string; phone: string;
  email: string; minOrder: string; deliveryCharge: string; freeDeliveryThreshold: string;
};

const DEFAULTS: Form = {
  name: "Abhiruchi", tagline: "Authentic South Indian Cuisine in the Heart of Sheffield",
  address: "142 Ecclesall Road, Sheffield, S11 8JD", phone: "+44 114 267 8899",
  email: "hello@abhiruchi.co.uk", minOrder: "15", deliveryCharge: "2.99",
  freeDeliveryThreshold: "35",
};

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Delivery zones
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZone, setNewZone] = useState<{ prefix: string; fee: string }>({ prefix: "", fee: "" });
  const [zonesSaving, setZonesSaving] = useState(false);
  const [zonesSaved, setZonesSaved] = useState(false);

  // Auto-print
  const [autoPrint, setAutoPrint] = useState(false);

  // SMS alerts
  const [smsPhone, setSmsPhone] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsSaved, setSmsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => {
        const { openingHours, delivery_zones, auto_print, sms_alerts, ...rest } = data;
        setForm(prev => ({ ...prev, ...rest }));
        if (openingHours) {
          try {
            const parsed = JSON.parse(openingHours);
            setHours({ ...DEFAULT_HOURS, ...parsed });
          } catch {}
        }
        if (delivery_zones) {
          try { setZones(JSON.parse(delivery_zones)); } catch {}
        }
        // auto_print: prefer localStorage but fall back to DB
        const localAp = typeof window !== "undefined" ? localStorage.getItem("admin_auto_print") : null;
        if (localAp !== null) {
          setAutoPrint(localAp === "true");
        } else if (auto_print) {
          setAutoPrint(auto_print === "true");
        }
        if (sms_alerts && sms_alerts !== "false") {
          setSmsEnabled(true);
          setSmsPhone(sms_alerts);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const setDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => {
      const updated = { ...prev, [day]: { ...prev[day], [field]: value } };
      // Auto-save immediately when closed checkbox is toggled
      if (field === "closed") {
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openingHours: JSON.stringify(updated) }),
        });
      }
      return updated;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, openingHours: JSON.stringify(hours) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveZones = async () => {
    setZonesSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivery_zones: JSON.stringify(zones) }),
    });
    setZonesSaving(false);
    setZonesSaved(true);
    setTimeout(() => setZonesSaved(false), 3000);
  };

  const addZone = () => {
    const prefix = newZone.prefix.trim().toUpperCase();
    const fee = parseFloat(newZone.fee);
    if (!prefix || isNaN(fee)) return;
    setZones(prev => [...prev, { prefix, fee, active: true }]);
    setNewZone({ prefix: "", fee: "" });
  };

  const removeZone = (i: number) => setZones(prev => prev.filter((_, idx) => idx !== i));

  const toggleZoneActive = (i: number) =>
    setZones(prev => prev.map((z, idx) => idx === i ? { ...z, active: !z.active } : z));

  const toggleAutoPrint = (v: boolean) => {
    setAutoPrint(v);
    if (typeof window !== "undefined") localStorage.setItem("admin_auto_print", String(v));
    fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_print: String(v) }),
    }).catch(() => {});
  };

  const saveSms = async () => {
    setSmsSaving(true);
    const value = smsEnabled && smsPhone.trim() ? smsPhone.trim() : "false";
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_alerts: value }),
    });
    setSmsSaving(false);
    setSmsSaved(true);
    setTimeout(() => setSmsSaved(false), 3000);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--a-muted)" }}>Loading…</div>;

  return (
    <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {saved && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, color: "#34d399", fontWeight: 600 }}>
          ✓ Settings saved successfully
        </div>
      )}

      {/* Main grid: two columns */}
      <div className="a-grid-2col" style={{ gap: 20, alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Restaurant Info */}
          <div className="a-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>⚙️</span>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Restaurant Configuration</div>
              </div>
              <button type="submit" className="admin-action-btn" disabled={saving} style={{ opacity: saving ? 0.7 : 1, fontSize: 13 }}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
            <div className="a-grid-2col" style={{ gap: 16 }}>
              <Field label="Restaurant Name" value={form.name} onChange={set("name")} />
              <Field label="Tagline" value={form.tagline} onChange={set("tagline")} />
              <Field label="Address" value={form.address} onChange={set("address")} style={{ gridColumn: "span 2" }} />
              <Field label="Phone" value={form.phone} onChange={set("phone")} />
              <Field label="Email" type="email" value={form.email} onChange={set("email")} />
            </div>
          </div>

          {/* Order Settings */}
          <div className="a-card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🛵 Order Settings</div>
            <div className="a-grid-2col" style={{ gap: 16 }}>
              <Field label="Min Order (£)" type="number" step="0.01" value={form.minOrder} onChange={set("minOrder")} />
              <Field label="Delivery Charge (£)" type="number" step="0.01" value={form.deliveryCharge} onChange={set("deliveryCharge")} />
              <Field label="Free Delivery Above (£)" type="number" step="0.01" value={form.freeDeliveryThreshold} onChange={set("freeDeliveryThreshold")} style={{ gridColumn: "span 2" }} />
            </div>
          </div>
        </div>

        {/* Right column — Opening Hours */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🕐 Opening Hours</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DAYS.map(({ key, label }) => {
              const day = hours[key] ?? DEFAULT_HOURS[key];
              return (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 80px", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: day.closed ? "var(--a-muted)" : "var(--a-text)" }}>{label}</div>
                  <div className="a-field" style={{ margin: 0 }}>
                    <input
                      type="time"
                      value={day.open}
                      onChange={e => setDay(key, "open", e.target.value)}
                      disabled={day.closed}
                      style={{ opacity: day.closed ? 0.4 : 1, fontSize: 13, padding: "7px 10px" }}
                    />
                  </div>
                  <div className="a-field" style={{ margin: 0 }}>
                    <input
                      type="time"
                      value={day.close}
                      onChange={e => setDay(key, "close", e.target.value)}
                      disabled={day.closed}
                      style={{ opacity: day.closed ? 0.4 : 1, fontSize: 13, padding: "7px 10px" }}
                    />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--a-muted)", cursor: "pointer", justifyContent: "center" }}>
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={e => setDay(key, "closed", e.target.checked)}
                      style={{ width: 14, height: 14 }}
                    />
                    Closed
                  </label>
                </div>
              );
            })}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--a-border)", display: "flex", gap: 20, fontSize: 11, color: "var(--a-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--a-orange-l)", opacity: 0.7 }} />
                Open hours (24h format)
              </span>
              <span>Tick "Closed" to mark a day as closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="a-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🗺️</span>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Delivery Zones</div>
          </div>
          <button type="button" className="admin-action-btn" disabled={zonesSaving} onClick={saveZones} style={{ fontSize: 13, opacity: zonesSaving ? 0.7 : 1 }}>
            {zonesSaving ? "Saving…" : zonesSaved ? "✓ Saved" : "💾 Save Zones"}
          </button>
        </div>

        {zones.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--a-muted)", marginBottom: 16 }}>No zones configured yet. Add a postcode prefix below.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {zones.map((z, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto auto", gap: 10, alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--a-border)" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: z.active ? "var(--a-text)" : "var(--a-muted)" }}>{z.prefix}</div>
              <div style={{ fontSize: 14 }}>£{z.fee.toFixed(2)}</div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--a-muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={z.active} onChange={() => toggleZoneActive(i)} style={{ width: 14, height: 14 }} />
                Active
              </label>
              <button type="button" className="a-filter-btn" style={{ fontSize: 11, padding: "4px 10px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }} onClick={() => removeZone(i)}>
                Delete
              </button>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--a-border)", paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 10 }}>Add zone</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div className="a-field" style={{ margin: 0 }}>
              <label>Postcode prefix (e.g. S10)</label>
              <input value={newZone.prefix} onChange={e => setNewZone(p => ({ ...p, prefix: e.target.value }))} placeholder="S10" />
            </div>
            <div className="a-field" style={{ margin: 0 }}>
              <label>Delivery fee (£)</label>
              <input type="number" step="0.01" min="0" value={newZone.fee} onChange={e => setNewZone(p => ({ ...p, fee: e.target.value }))} placeholder="2.50" />
            </div>
            <button type="button" className="admin-action-btn" onClick={addZone} disabled={!newZone.prefix.trim() || !newZone.fee.trim()} style={{ height: 38 }}>
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Auto-print + SMS Notifications */}
      <div className="a-grid-2col" style={{ gap: 20 }}>

        {/* Auto-print */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🖨️ Auto-Print Orders</div>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div
              onClick={() => toggleAutoPrint(!autoPrint)}
              style={{
                width: 44, height: 24, borderRadius: 12, background: autoPrint ? "#ea580c" : "rgba(255,255,255,0.1)",
                position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: autoPrint ? 23 : 3, width: 18, height: 18,
                borderRadius: "50%", background: "#fff", transition: "left 0.2s",
              }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Auto-print new orders</div>
              <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>
                When enabled, a print dialog opens automatically when a new order arrives.
              </div>
            </div>
          </label>
          <div style={{ marginTop: 12, fontSize: 12, color: autoPrint ? "#34d399" : "var(--a-muted)" }}>
            {autoPrint ? "✓ Auto-print is ON" : "Auto-print is off"}
          </div>
        </div>

        {/* SMS / WhatsApp notifications */}
        <div className="a-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📱 Notifications</div>
            <button type="button" className="admin-action-btn" disabled={smsSaving} onClick={saveSms} style={{ fontSize: 13, opacity: smsSaving ? 0.7 : 1 }}>
              {smsSaving ? "Saving…" : smsSaved ? "✓ Saved" : "💾 Save"}
            </button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 14 }}>
            <div
              onClick={() => setSmsEnabled(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, background: smsEnabled ? "#ea580c" : "rgba(255,255,255,0.1)",
                position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: smsEnabled ? 23 : 3, width: 18, height: 18,
                borderRadius: "50%", background: "#fff", transition: "left 0.2s",
              }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>SMS/WhatsApp on new order</div>
          </label>
          {smsEnabled && (
            <div className="a-field" style={{ margin: 0 }}>
              <label>Restaurant phone number (E.164, e.g. +447700900000)</label>
              <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="+447700900000" />
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--a-muted)" }}>
            Requires Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM) in website .env
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", step, style }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; step?: string; style?: React.CSSProperties;
}) {
  return (
    <div className="a-field" style={style}>
      <label>{label}</label>
      <input type={type} step={step} value={value} onChange={onChange} />
    </div>
  );
}
