"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";

type Tab = { id: string; label: string; href: string; icon: React.ReactNode; badge?: boolean };

function Icon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// App-style bottom tab bar — primary navigation on mobile only.
export function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();
  const { user } = useUser();

  const tabs: Tab[] = [
    { id: "home",   label: "Home",   href: "/",       icon: <Icon d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /> },
    { id: "menu",   label: "Menu",   href: "/menu",   icon: <Icon d="M4 3v18M4 7h6M7 3v8M16 3c-1.5 0-2.5 1.8-2.5 5s1 5 2.5 5m4-10v18" /> },
    { id: "order",  label: "Order",  href: "/order",  icon: <Icon d="M6 2 3 6v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />, badge: true },
    { id: "offers", label: "Offers", href: "/offers", icon: <Icon d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6ZM7.5 7.5h.01" /> },
    { id: "account", label: user ? "Account" : "Sign in", href: user ? "/account" : "/login", icon: <Icon d="M19 21a7 7 0 0 0-14 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /> },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.id} href={t.href} className={"bottom-nav-item" + (active ? " active" : "")}>
            <span className="bottom-nav-icon">
              {t.icon}
              {t.badge && cart.count > 0 && <span className="bottom-nav-badge">{cart.count > 9 ? "9+" : cart.count}</span>}
            </span>
            <span className="bottom-nav-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
