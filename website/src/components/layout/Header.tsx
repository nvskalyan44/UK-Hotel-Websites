"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useConfig } from "@/context/ConfigContext";
import { CartIcon } from "@/components/ui/Icons";
import { TABS } from "@/lib/data";

type NavItem = { id: string; label: string; href: string };

const FALLBACK_NAV: NavItem[] = TABS.map(t => ({
  id: t.id,
  label: t.label,
  href: t.id === "home" ? "/" : `/${t.id}`,
}));

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const { user, logout } = useUser();
  const config = useConfig();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK_NAV);

  useEffect(() => {
    fetch("/api/config/nav")
      .then(r => r.ok ? r.json() : null)
      .then((data: { id: string; href: string; label: string }[] | null) => {
        if (data && data.length > 0) {
          setNavItems(data.map(n => ({ id: n.id, label: n.label, href: n.href })));
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    cart.clear();
    await logout();
    router.push("/");
  };

  return (
    <header className="site-header">
      {/* Mobile menu overlay */}
      <div className={"mobile-menu-overlay" + (mobileOpen ? " open" : "")} onClick={() => setMobileOpen(false)} />

      {/* Mobile menu panel */}
      <div className={"mobile-menu" + (mobileOpen ? " open" : "")}>
        <div className="mobile-menu-header">
          <Link href="/" className="brand" style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
            <div className="brand-logo">🍛</div>
            <div>
              <div className="brand-name">{config.name}</div>
            </div>
          </Link>
          <button className="mobile-menu-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>
        {navItems.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link key={t.id} href={t.href} className={"mobile-nav-link" + (active ? " active" : "")} onClick={() => setMobileOpen(false)}>
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="container nav-row">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-logo">🍛</div>
          <div>
            <div className="brand-name">{config.name}</div>
            <div className="brand-sub">Sheffield · Est. {config.est}</div>
          </div>
        </Link>

        <nav className="nav-tabs">
          {navItems.map((t) => {
            const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link key={t.id} href={t.href} className={"nav-tab" + (active ? " active" : "")} style={{ textDecoration: "none" }}>
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Hamburger — mobile only */}
          <button className="nav-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <line x1={3} y1={6} x2={21} y2={6} /><line x1={3} y1={12} x2={21} y2={12} /><line x1={3} y1={18} x2={21} y2={18} />
            </svg>
          </button>

          {/* Cart button */}
          <button className="icon-btn cart-btn" onClick={() => cart.setOpen(true)}>
            <CartIcon /> <span className="cart-label">Cart</span>
            {cart.count > 0 && <span className="cart-count">{cart.count}</span>}
          </button>

          {/* Auth: logged in */}
          {user ? (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px",
                  background: "rgba(234,88,12,0.12)", border: "1px solid rgba(253,186,116,0.2)",
                  borderRadius: 999, cursor: "pointer", color: "var(--ink)",
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--orange-500), var(--orange-600))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12, color: "white", flexShrink: 0,
                }}>
                  {user.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name.split(" ")[0]}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>▾</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 200, zIndex: 200,
                  background: "rgba(20, 8, 4, 0.95)", border: "1px solid rgba(253,186,116,0.15)",
                  borderRadius: 14, padding: 8, backdropFilter: "blur(12px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid rgba(253,186,116,0.08)", marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                    <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{user.email}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                      <div>
                        <span className="text-orange" style={{ fontWeight: 700, fontSize: 15 }}>{user.loyaltyPoints.toLocaleString()}</span>
                        <span className="text-muted" style={{ fontSize: 11, marginLeft: 4 }}>pts</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{user.totalOrders}</span>
                        <span className="text-muted" style={{ fontSize: 11, marginLeft: 4 }}>orders</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, fontSize: 14, color: "var(--ink)", textDecoration: "none" }}
                    className="dropdown-item"
                  >
                    👤 My account & orders
                  </Link>
                  <Link
                    href="/order"
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, fontSize: 14, color: "var(--ink)", textDecoration: "none" }}
                    className="dropdown-item"
                  >
                    🍛 Order now
                  </Link>
                  <div style={{ height: 1, background: "rgba(253,186,116,0.08)", margin: "4px 0" }} />
                  <button
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, fontSize: 14, color: "#f87171", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                    className="dropdown-item"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Auth: not logged in */
            <Link
              href="/login"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 13, padding: "7px 16px" }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
