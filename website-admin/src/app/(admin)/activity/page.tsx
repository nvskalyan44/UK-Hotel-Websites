"use client";

import { useState, useEffect } from "react";

type ActivityLog = {
  id: number;
  action: string;
  detail: string;
  entityId: string | null;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  order_status: "#3b82f6",
  review_status: "#8b5cf6",
  menu_update: "#f59e0b",
};

const ACTION_LABELS: Record<string, string> = {
  order_status: "Order",
  review_status: "Review",
  menu_update: "Menu",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then(r => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Activity Log</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>Last 100 admin actions</div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading activity…</div>}

      {!loading && (
        <div className="a-card" style={{ padding: 0, overflow: "hidden" }}>
          {logs.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--a-muted)" }}>
              No activity recorded yet.
            </div>
          )}
          {logs.map((log, idx) => {
            const color = ACTION_COLORS[log.action] ?? "#6b7280";
            const label = ACTION_LABELS[log.action] ?? log.action;
            return (
              <div
                key={log.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px",
                  borderBottom: idx < logs.length - 1 ? "1px solid var(--a-border)" : "none",
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: color,
                  flexShrink: 0, marginTop: 6,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 6,
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                      background: `${color}22`, color,
                    }}>
                      {label}
                    </span>
                    {log.entityId && (
                      <span style={{ fontSize: 11, color: "var(--a-muted)" }}>#{log.entityId}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13 }}>{log.detail}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--a-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {formatTime(log.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
