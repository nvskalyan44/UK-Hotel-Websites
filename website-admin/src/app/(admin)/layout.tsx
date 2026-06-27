"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",     label: "Dashboard",    icon: "📊" },
  { href: "/pos",           label: "POS / Till",   icon: "🛒" },
  { href: "/analytics",     label: "Analytics",    icon: "📈" },
  { href: "/orders",        label: "Orders",       icon: "📦" },
  { href: "/kitchen",       label: "Kitchen",      icon: "🍳" },
  { href: "/menu",          label: "Menu",         icon: "🍽️" },
  { href: "/combos",        label: "Meal Deals",   icon: "🎁" },
  { href: "/schedule",      label: "Schedule",     icon: "📆" },
  { href: "/customers",     label: "Customers",    icon: "👥" },
  { href: "/coupons",       label: "Coupons",      icon: "🎫" },
  { href: "/reviews",       label: "Reviews",      icon: "⭐" },
  { href: "/messages",      label: "Messages",     icon: "✉️" },
  { href: "/reservations",  label: "Reservations", icon: "📅" },
  { href: "/campaigns",     label: "Campaigns",    icon: "📧" },
  { href: "/inventory",     label: "Inventory",    icon: "📋" },
  { href: "/activity",      label: "Activity Log", icon: "🕐" },
  { href: "/settings",      label: "Site Settings", icon: "⚙️" },
  { href: "/account",       label: "Account",      icon: "🔑" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [nav, setNav] = useState(NAV);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = () =>
      fetch("/api/admin/messages/unread").then(r => r.ok ? r.json() : { count: 0 }).then(d => setUnreadMsgs(d.count)).catch(() => {});
    fetchUnread();
    const t = setInterval(fetchUnread, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/admin/config/nav?site=admin")
      .then(r => r.ok ? r.json() : null)
      .then((data: typeof NAV | null) => {
        if (data && data.length > 0) setNav(data);
      })
      .catch(() => {});
  }, []);

  const pageTitle = nav.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.label ?? "Admin";
  const isSettings = pathname === "/settings";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="admin-root">
      {/* Mobile sidebar overlay */}
      <div className={"sidebar-overlay" + (sidebarOpen ? " open" : "")} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={"admin-sidebar" + (sidebarOpen ? " open" : "")}>
        <div className="admin-logo">
          <div className="admin-logo-icon">🍛</div>
          <div>
            <div className="admin-logo-name">Abhiruchi</div>
            <div className="admin-logo-sub">Sheffield · Admin</div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">Main Menu</div>
          {nav.slice(0, 7).map(n => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`admin-nav-item ${active ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
          <div className="admin-nav-section" style={{ marginTop: 12 }}>Management</div>
          {nav.slice(7).map(n => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            const badge = n.href === "/messages" && unreadMsgs > 0 ? unreadMsgs : 0;
            return (
              <Link key={n.href} href={n.href} className={`admin-nav-item ${active ? "active" : ""}`} style={{ position: "relative" }} onClick={() => setSidebarOpen(false)}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                {n.label}
                {badge > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#ef4444", color: "#fff", lineHeight: 1.4 }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="admin-user-bar">
          <div className="admin-user-info">
            <div className="admin-avatar">AD</div>
            <div>
              <div className="admin-user-name">Admin</div>
              <div className="admin-user-role">Restaurant Owner</div>
            </div>
          </div>
          <button className="admin-signout" onClick={logout}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="admin-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <line x1={3} y1={6} x2={21} y2={6} /><line x1={3} y1={12} x2={21} y2={12} /><line x1={3} y1={18} x2={21} y2={18} />
              </svg>
            </button>
            <div className="admin-topbar-left">
              <h1>{pageTitle}</h1>
            </div>
          </div>
          <div className="admin-topbar-right">
            <div className="live-badge">
              <div className="live-dot" />
              Live
            </div>
            {isSettings ? (
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="a-filter-btn"
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 14px", textDecoration: "none" }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1={10} y1={14} x2={21} y2={3} />
                </svg>
                View Site
              </a>
            ) : (
              <div className="admin-clock">Abhiruchi · Sheffield</div>
            )}
          </div>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>

      {/* App-style bottom tab bar (mobile only) */}
      <nav className="admin-bottomnav" aria-label="Primary">
        {[
          { href: "/dashboard", label: "Home",  d: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" },
          { href: "/pos",       label: "POS",   d: "M6 2 3 6v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" },
          { href: "/orders",    label: "Orders", d: "M9 11V6a3 3 0 0 1 6 0v5M4 8h16l-1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" },
          { href: "/kitchen",   label: "Kitchen", d: "M8 3v7M5 3v4a3 3 0 0 0 6 0V3M16 3c-1 0-2 4-2 7h4M16 3v18" },
        ].map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link key={t.href} href={t.href} className={"admin-bottomnav-item" + (active ? " active" : "")} onClick={() => setSidebarOpen(false)}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
              <span>{t.label}</span>
            </Link>
          );
        })}
        <button className="admin-bottomnav-item" onClick={() => setSidebarOpen(true)}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round"><line x1={4} y1={6} x2={20} y2={6} /><line x1={4} y1={12} x2={20} y2={12} /><line x1={4} y1={18} x2={20} y2={18} /></svg>
          <span>More</span>
          {unreadMsgs > 0 && <span className="admin-bottomnav-badge">{unreadMsgs > 9 ? "9+" : unreadMsgs}</span>}
        </button>
      </nav>
    </div>
  );
}
