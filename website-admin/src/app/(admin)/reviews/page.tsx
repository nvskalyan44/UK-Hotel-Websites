"use client";

import { useState, useEffect } from "react";

type Review = {
  id: string;
  customer: string;
  avatar: string;
  rating: number;
  status: string;
  text: string;
  date: string;
  item: string;
  helpful: number;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then(r => r.json())
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews.filter(r => filter === "all" || r.status === filter);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "published" ? "pending" : "published";
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: next } : r));
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Reviews",    value: reviews.length,                                        color: "#ea580c" },
          { label: "Published",        value: reviews.filter(r => r.status === "published").length,  color: "#10b981" },
          { label: "Pending Approval", value: reviews.filter(r => r.status === "pending").length,    color: "#f59e0b" },
          { label: "Avg Rating",       value: `${avgRating} ★`,                                      color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "all", l: "All Reviews" }, { v: "published", l: "Published" }, { v: "pending", l: "Pending" }].map(f => (
          <button key={f.v} className={`a-filter-btn ${filter === f.v ? "active" : ""}`} onClick={() => setFilter(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading reviews…</div>}

      {/* Review cards */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--a-muted)" }}>No reviews match this filter.</div>
          )}
          {filtered.map(r => (
            <div key={r.id} className="a-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="admin-avatar" style={{ width: 40, height: 40, fontSize: 13 }}>{r.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.customer}</div>
                    <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 2 }}>
                      {r.date}{r.item ? ` · ${r.item}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{ color: s <= r.rating ? "#f59e0b" : "rgba(255,255,255,0.15)", fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  <span className={`status-badge ${r.status === "published" ? "status-active" : "status-preparing"}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--a-text)", lineHeight: 1.65, marginBottom: 16 }}>{r.text}</p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  className="admin-action-btn"
                  style={{ fontSize: 11, padding: "6px 14px", background: r.status === "published" ? "rgba(239,68,68,0.15)" : undefined, borderColor: r.status === "published" ? "rgba(239,68,68,0.3)" : undefined }}
                  onClick={() => toggleStatus(r.id, r.status)}
                >
                  {r.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  className="a-filter-btn"
                  style={{ fontSize: 11, padding: "6px 12px", color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }}
                  onClick={() => deleteReview(r.id)}
                >
                  Delete
                </button>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--a-muted)" }}>
                  👍 {r.helpful} found helpful
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
