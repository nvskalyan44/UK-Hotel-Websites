/* ============================================================
   App — routing + layout
   ============================================================ */

function App() {
  const [tab, setTab] = React.useState(() => {
    const h = window.location.hash.replace("#", "");
    return TABS.find((t) => t.id === h) ? h : "home";
  });

  React.useEffect(() => {
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);

  React.useEffect(() => {
    const handler = (e) => {
      const target = e.detail;
      if (TABS.find((t) => t.id === target)) setTab(target);
    };
    document.addEventListener("nav", handler);
    return () => document.removeEventListener("nav", handler);
  }, []);

  return (
    <CartProvider>
      <div className="app-bg" />
      <Header tab={tab} onTab={setTab} />
      <CartDrawer onCheckout={() => setTab("order")} />
      <ToastHost />

      {tab === "home" && <HomePage onTab={setTab} />}
      {tab === "menu" && <MenuPage onTab={setTab} />}
      {tab === "order" && <OrderPage onTab={setTab} />}
      {tab === "offers" && <OffersPage onTab={setTab} />}
      {tab === "about" && <AboutPage onTab={setTab} />}
      {tab === "contact" && <ContactPage />}

      <Footer onTab={setTab} />
    </CartProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
