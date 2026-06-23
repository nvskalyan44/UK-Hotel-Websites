"use client";

import { useState, useEffect } from "react";
import { ArrowIcon, PinIcon, PhoneIcon, MailIcon, ClockIcon } from "@/components/ui/Icons";
import { useConfig } from "@/context/ConfigContext";

type Subject = "Reservation" | "Catering enquiry" | "Feedback" | "General question";

type FormState = {
  name: string; email: string; subject: Subject; message: string;
  reservationDate: string; reservationTime: string; partySize: string;
  eventDate: string; eventGuests: string; eventType: string;
};

const EMPTY: FormState = {
  name: "", email: "", subject: "Reservation", message: "",
  reservationDate: "", reservationTime: "", partySize: "",
  eventDate: "", eventGuests: "", eventType: "",
};

export default function ContactPage() {
  const config = useConfig();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
  ]);
  const [eventTypes, setEventTypes] = useState<string[]>([
    "Birthday", "Anniversary", "Wedding", "Corporate", "Family gathering", "Other",
  ]);

  useEffect(() => {
    fetch("/api/config/time-slots").then(r => r.ok ? r.json() : null)
      .then((data: { time: string }[] | null) => { if (data) setTimeSlots(data.map(s => s.time)); })
      .catch(() => {});
    fetch("/api/config/event-types").then(r => r.ok ? r.json() : null)
      .then((data: { name: string }[] | null) => { if (data) setEventTypes(data.map(e => e.name)); })
      .catch(() => {});
  }, []);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: Record<string, string | number> = {
        name: form.name, email: form.email, subject: form.subject, message: form.message,
      };
      if (form.subject === "Reservation") {
        if (!form.reservationDate || !form.reservationTime || !form.partySize) {
          setSubmitError("Please fill in the date, time and party size for your reservation.");
          return;
        }
        payload.reservationDate = form.reservationDate;
        payload.reservationTime = form.reservationTime;
        payload.partySize = parseInt(form.partySize);
      }
      if (form.subject === "Catering enquiry") {
        if (!form.eventDate || !form.eventGuests) {
          setSubmitError("Please fill in the event date and estimated guest count.");
          return;
        }
        payload.eventDate = form.eventDate;
        payload.eventGuests = parseInt(form.eventGuests);
        payload.eventType = form.eventType;
      }
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Failed to send message"); return; }
      setSent(true);
      setTimeout(() => { setSent(false); setForm(EMPTY); }, 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const infoCards = [
    { icon: <PinIcon />, label: "Visit", value: config.address, sub: config.contactAddressNote },
    { icon: <PhoneIcon />, label: "Call", value: config.phone, sub: config.contactPhoneNote },
    { icon: <MailIcon />, label: "Email", value: config.email, sub: config.contactEmailNote },
    { icon: <ClockIcon />, label: "Hours", value: null, sub: null, hours: true },
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <main>
      <section style={{ padding: "60px 0 32px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="pill" style={{ marginBottom: 24 }}><PinIcon /> Visit us on Ecclesall Road</span>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", marginBottom: 18 }}>
            <span className="gradient-text">Find us, call us,</span> book a table.
          </h1>
          <p className="text-muted" style={{ fontSize: 18, maxWidth: 580, margin: "0 auto 48px" }}>
            {config.contactIntroText}
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 80 }}>
        <div className="container grid-contact">
          {/* Info cards */}
          <div style={{ display: "grid", gap: 16 }}>
            {infoCards.map((c) => (
              <div key={c.label} className="card card-hover" style={{ padding: 26, display: "flex", gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, var(--orange-500), var(--orange-600))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                  {c.value && <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{c.value}</div>}
                  {c.sub && <div className="text-muted" style={{ fontSize: 13 }}>{c.sub}</div>}
                  {c.hours && (
                    <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                      {config.hours.map((h) => (
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

          {/* Map + form */}
          <div style={{ display: "grid", gap: 24 }}>
            {/* Google Maps embed */}
            <div className="card" style={{ height: 280, overflow: "hidden", position: "relative", padding: 0 }}>
              <iframe
                title="Abhiruchi location"
                src={config.mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={config.mapsLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 12, padding: "6px 12px", borderRadius: 8, textDecoration: "none", fontWeight: 600, backdropFilter: "blur(4px)" }}
              >
                Open in Google Maps ↗
              </a>
            </div>

            {/* Contact form */}
            <div className="card" style={{ padding: 32 }}>
              {sent ? (
                <div style={{ padding: 32, textAlign: "center", background: "rgba(16,185,129,0.1)", borderRadius: 16, border: "1px solid rgba(16,185,129,0.25)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {form.subject === "Reservation" ? "🍽️" : form.subject === "Catering enquiry" ? "🎉" : "✉️"}
                  </div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                    {form.subject === "Reservation" ? "Reservation request received!" : "Message received!"}
                  </div>
                  <p className="text-muted" style={{ fontSize: 14 }}>
                    {form.subject === "Reservation"
                      ? `We'll confirm your table for ${form.partySize} on ${form.reservationDate} at ${form.reservationTime} within a few hours.`
                      : `We'll reply to ${form.email} within four hours.`}
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
                  {/* Subject selector — first so conditional fields below respond immediately */}
                  <div className="field">
                    <label className="field-label">What is this about?</label>
                    <div className="grid-2col" style={{ gap: 8 }}>
                      {(["Reservation", "Catering enquiry", "Feedback", "General question"] as Subject[]).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, subject: s }))}
                          style={{
                            padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
                            background: form.subject === s ? "rgba(234,88,12,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${form.subject === s ? "rgba(234,88,12,0.5)" : "rgba(253,186,116,0.12)"}`,
                            color: form.subject === s ? "var(--orange-300)" : "var(--muted)",
                          }}
                        >
                          {s === "Reservation" && "🍽️ "}
                          {s === "Catering enquiry" && "🎉 "}
                          {s === "Feedback" && "💬 "}
                          {s === "General question" && "❓ "}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reservation fields */}
                  {form.subject === "Reservation" && (
                    <div style={{ padding: "16px 20px", background: "rgba(234,88,12,0.06)", borderRadius: 14, border: "1px solid rgba(234,88,12,0.15)", display: "grid", gap: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange-300)", marginBottom: -4 }}>Reservation details</div>
                      <div className="grid-2col" style={{ gap: 12 }}>
                        <div className="field">
                          <label className="field-label">Date *</label>
                          <input className="field-input" type="date" required min={minDate} value={form.reservationDate} onChange={set("reservationDate")} />
                        </div>
                        <div className="field">
                          <label className="field-label">Time *</label>
                          <select className="field-select" required value={form.reservationTime} onChange={set("reservationTime")}>
                            <option value="">Select a time</option>
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="field">
                        <label className="field-label">Party size *</label>
                        <select className="field-select" required value={form.partySize} onChange={set("partySize")}>
                          <option value="">How many guests?</option>
                          {Array.from({ length: config.maxPartySize }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                          <option value="11">11+ guests (large group)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Catering fields */}
                  {form.subject === "Catering enquiry" && (
                    <div style={{ padding: "16px 20px", background: "rgba(139,92,246,0.06)", borderRadius: 14, border: "1px solid rgba(139,92,246,0.18)", display: "grid", gap: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#c4b5fd", marginBottom: -4 }}>Event details</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="field">
                          <label className="field-label">Event date *</label>
                          <input className="field-input" type="date" required min={minDate} value={form.eventDate} onChange={set("eventDate")} />
                        </div>
                        <div className="field">
                          <label className="field-label">Estimated guests *</label>
                          <input className="field-input" type="number" min={10} max={500} required value={form.eventGuests} onChange={set("eventGuests")} placeholder="e.g. 50" />
                        </div>
                      </div>
                      <div className="field">
                        <label className="field-label">Event type</label>
                        <select className="field-select" value={form.eventType} onChange={set("eventType")}>
                          <option value="">Select event type</option>
                          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Name / Email */}
                  <div className="grid-2col" style={{ gap: 14 }}>
                    <div className="field">
                      <label className="field-label">Name *</label>
                      <input className="field-input" required value={form.name} onChange={set("name")} placeholder="Your name" />
                    </div>
                    <div className="field">
                      <label className="field-label">Email *</label>
                      <input className="field-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="field">
                    <label className="field-label">
                      {form.subject === "Reservation" ? "Any dietary requirements or special requests?" : "Message *"}
                    </label>
                    <textarea
                      className="field-textarea"
                      required={form.subject !== "Reservation"}
                      value={form.message}
                      onChange={set("message")}
                      placeholder={
                        form.subject === "Reservation" ? "Allergies, high chair needed, birthday surprise…" :
                        form.subject === "Catering enquiry" ? "Tell us about your event, location, and any dietary requirements…" :
                        form.subject === "Feedback" ? "Share your experience…" :
                        "How can we help?"
                      }
                      style={{ minHeight: 100 }}
                    />
                  </div>

                  {submitError && (
                    <div style={{ fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ marginTop: 4, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                    {submitting ? "Sending…" : form.subject === "Reservation" ? <>Request table <ArrowIcon /></> : <>Send message <ArrowIcon /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
