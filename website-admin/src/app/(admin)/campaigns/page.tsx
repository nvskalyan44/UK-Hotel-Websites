"use client";

import { useState, useEffect } from "react";

type Campaign = {
  id: number;
  subject: string;
  body: string;
  targetGroup: string;
  sentCount: number;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

const FALLBACK_SEGMENTS = [
  { value: "all",             label: "All Customers" },
  { value: "active_last_30d", label: "Active Last 30 Days" },
  { value: "top_spenders",    label: "Top Spenders (£100+)" },
  { value: "new_customers",   label: "New Customers (last 30 days)" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:  { label: "Draft",  color: "#6b7280" },
  sent:   { label: "Sent",   color: "#10b981" },
  failed: { label: "Failed", color: "#ef4444" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [segments, setSegments] = useState(FALLBACK_SEGMENTS);
  const [submitting, setSubmitting] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [recipientEst, setRecipientEst] = useState<Record<string, number>>({});

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");

  useEffect(() => {
    fetch("/api/admin/campaigns")
      .then(r => r.ok ? r.json() : [])
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));

    fetch("/api/admin/config/campaign-segments")
      .then(r => r.ok ? r.json() : null)
      .then((data: { value: string; label: string }[] | null) => {
        if (data && data.length > 0) setSegments(data);
      })
      .catch(() => {});

    // Fetch estimated recipient counts
    fetch("/api/admin/customers")
      .then(r => r.ok ? r.json() : [])
      .then((data: { status?: string; lastOrderAt?: string; totalSpent?: number; joinedAt?: string }[]) => {
        if (!Array.isArray(data)) return;
        const now = Date.now();
        const day30 = 30 * 24 * 60 * 60 * 1000;
        const all = data.filter(c => c.status === "active").length;
        const active30 = data.filter(c => c.status === "active" && c.lastOrderAt && now - new Date(c.lastOrderAt).getTime() <= day30).length;
        const top = data.filter(c => c.status === "active" && (c.totalSpent ?? 0) >= 100).length;
        const newC = data.filter(c => c.status === "active" && c.joinedAt && now - new Date(c.joinedAt).getTime() <= day30).length;
        setRecipientEst({ all, active_last_30d: active30, top_spenders: top, new_customers: newC });
      })
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setSubject("");
    setBody("");
    setTargetGroup("all");
    setError("");
  };

  const submit = async (action: "draft" | "send") => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setSubmitting(action);
    setError("");
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, targetGroup, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save campaign.");
        return;
      }
      setCampaigns(prev => [data, ...prev]);
      setSuccessMsg(action === "send"
        ? `Campaign sent to ${data.sentCount} recipient${data.sentCount !== 1 ? "s" : ""}!`
        : "Draft saved successfully."
      );
      setTimeout(() => setSuccessMsg(""), 5000);
      resetForm();
      setShowForm(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const sentCampaigns = campaigns.filter(c => c.status === "sent");
  const totalSent = sentCampaigns.reduce((s, c) => s + c.sentCount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#1e293b", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 10,
          padding: "12px 18px", fontSize: 13, fontWeight: 600, color: "#4ade80",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="a-grid-3col" style={{ gap: 16 }}>
        {[
          { label: "Total Campaigns", value: campaigns.length, color: "#ea580c" },
          { label: "Sent",            value: sentCampaigns.length, color: "#10b981" },
          { label: "Emails Sent",     value: totalSent, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 28 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header + New Campaign button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Campaigns</div>
        <button
          className="admin-action-btn"
          style={{ fontSize: 13 }}
          onClick={() => { setShowForm(true); setError(""); }}
        >
          + New Campaign
        </button>
      </div>

      {/* New Campaign Form */}
      {showForm && (
        <div className="a-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>New Campaign</div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 6 }}>Subject</label>
            <input
              type="text"
              placeholder="Email subject…"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--a-border)", borderRadius: 8,
                color: "var(--a-text)", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 6 }}>
              Body <span style={{ fontWeight: 400 }}>(HTML supported)</span>
            </label>
            <textarea
              placeholder="<p>Dear customer, we have exciting news…</p>"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              style={{
                width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--a-border)", borderRadius: 8,
                color: "var(--a-text)", fontSize: 13, outline: "none", boxSizing: "border-box",
                resize: "vertical", fontFamily: "monospace", lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 6 }}>Target Group</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {segments.map(g => (
                <label key={g.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 8, background: targetGroup === g.value ? "rgba(234,88,12,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${targetGroup === g.value ? "rgba(234,88,12,0.4)" : "var(--a-border)"}` }}>
                  <input
                    type="radio"
                    name="targetGroup"
                    value={g.value}
                    checked={targetGroup === g.value}
                    onChange={() => setTargetGroup(g.value)}
                    style={{ accentColor: "#ea580c" }}
                  />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{g.label}</span>
                  {recipientEst[g.value] !== undefined && (
                    <span style={{ fontSize: 12, color: "var(--a-muted)" }}>
                      ~{recipientEst[g.value]} recipient{recipientEst[g.value] !== 1 ? "s" : ""}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#f87171" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              className="a-filter-btn"
              onClick={() => { setShowForm(false); resetForm(); }}
              disabled={submitting !== null}
              style={{ fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              className="a-filter-btn"
              onClick={() => submit("draft")}
              disabled={submitting !== null}
              style={{ fontSize: 13, opacity: submitting !== null ? 0.6 : 1 }}
            >
              {submitting === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              className="admin-action-btn"
              onClick={() => submit("send")}
              disabled={submitting !== null}
              style={{ fontSize: 13, opacity: submitting !== null ? 0.6 : 1 }}
            >
              {submitting === "send" ? "Sending…" : `📧 Send Now${recipientEst[targetGroup] !== undefined ? ` (${recipientEst[targetGroup]})` : ""}`}
            </button>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading campaigns…</div>}

      {/* Campaigns list */}
      {!loading && (
        <div className="a-card" style={{ overflowX: "auto" }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Target</th>
                <th>Status</th>
                <th>Sent To</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const sMeta = STATUS_META[c.status] ?? STATUS_META.draft;
                const tLabel = segments.find(g => g.value === c.targetGroup)?.label ?? c.targetGroup;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.subject}</td>
                    <td style={{ color: "var(--a-muted)", fontSize: 13 }}>{tLabel}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                        background: `${sMeta.color}18`, border: `1px solid ${sMeta.color}40`, color: sMeta.color,
                      }}>
                        {sMeta.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.status === "sent" ? c.sentCount : "—"}</td>
                    <td style={{ color: "var(--a-muted)", fontSize: 13 }}>
                      {c.sentAt ? formatDate(c.sentAt) : formatDate(c.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--a-muted)" }}>
              No campaigns yet. Create your first one!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
