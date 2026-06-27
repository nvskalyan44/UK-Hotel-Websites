import { ConfigProvider } from "@/context/ConfigContext";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ToastHost } from "@/components/ui/Toast";
import { CookieBanner } from "@/components/ui/CookieBanner";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <UserProvider>
        <CartProvider>
          <div className="app-bg" />
          <Header />
          <CartDrawer />
          <ToastHost />
          <div className="app-shell" style={{ minHeight: "100vh" }}>{children}</div>
          <Footer />
          <BottomNav />
          <CookieBanner />
        </CartProvider>
      </UserProvider>
    </ConfigProvider>
  );
}
