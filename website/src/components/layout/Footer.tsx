"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TABS } from "@/lib/data";
import { useConfig } from "@/context/ConfigContext";

type ContentMap = Record<string, string>;

const DEFAULT_FOOTER_CONTENT: ContentMap = {
  footer_description: "Authentic Hyderabadi and Andhra cuisine, served fresh on Ecclesall Road since 2000.",
};

export function Footer() {
  const config = useConfig();
  const [content, setContent] = useState<ContentMap>(DEFAULT_FOOTER_CONTENT);

  useEffect(() => {
    fetch("/api/content")
      .then(r => r.ok ? r.json() : null)
      .then((data: ContentMap | null) => { if (data) setContent(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  return (
    <footer style={{ padding: "60px 0 32px", borderTop: "1px solid rgba(253, 186, 116, 0.08)", marginTop: 80 }}>
      <div className="container grid-footer">
        <div>
          <div className="brand" style={{ marginBottom: 18 }}>
            <div className="brand-logo">🍛</div>
            <div>
              <div className="brand-name">{config.name}</div>
              <div className="brand-sub">Sheffield · Est. {config.est}</div>
            </div>
          </div>
          <p className="text-muted" style={{ maxWidth: 360, fontSize: 14 }}>
            {content.footer_description}
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "var(--orange-300)" }}>Explore</div>
          {TABS.map((t) => (
            <div key={t.id} style={{ marginBottom: 10 }}>
              <Link href={t.id === "home" ? "/" : `/${t.id}`} className="text-muted" style={{ fontSize: 14, textDecoration: "none" }}>{t.label}</Link>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "var(--orange-300)" }}>Visit</div>
          <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
            {config.address}<br />
            {config.phone}<br />
            {config.email}
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "var(--orange-300)" }}>Hours</div>
          {config.hours.map((h) => (
            <div key={h.day} className="text-muted" style={{ fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--ink-dim)" }}>{h.day}</span><br />{h.time}
            </div>
          ))}
        </div>
      </div>
      <div className="container" style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(253, 186, 116, 0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, color: "var(--faint)", fontSize: 13 }}>
        <span>© {new Date().getFullYear()} Abhiruchi. All rights reserved.</span>
        <span>Made with 🌶️ in Sheffield</span>
      </div>
    </footer>
  );
}
