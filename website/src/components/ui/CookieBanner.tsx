"use client";

import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("abhi_cookies_accepted")) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const accept = () => {
    try { localStorage.setItem("abhi_cookies_accepted", "1"); } catch {}
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "rgba(14, 5, 2, 0.97)",
      borderTop: "1px solid rgba(253, 186, 116, 0.15)",
      padding: "18px 24px",
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      backdropFilter: "blur(12px)",
      boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
    }}>
      <p style={{ flex: 1, fontSize: 14, color: "var(--ink-dim)", lineHeight: 1.6, margin: 0 }}>
        We use cookies to improve your experience. By continuing, you accept our use of cookies.
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          type="button"
          onClick={dismiss}
          style={{ background: "none", border: "1px solid rgba(253,186,116,0.2)", color: "var(--muted)", fontSize: 13, padding: "8px 18px", borderRadius: 999, cursor: "pointer" }}
        >
          Learn more
        </button>
        <button
          type="button"
          onClick={accept}
          className="btn btn-primary btn-sm"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
