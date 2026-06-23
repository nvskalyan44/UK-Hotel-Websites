import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: "Inter, sans-serif", background: "var(--a-bg, #0f0a07)", color: "var(--a-text, #f5f0eb)" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: "#ea580c", marginBottom: 8 }}>404</h1>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Page not found</h2>
        <p style={{ color: "#9ca3af", fontSize: 15, marginBottom: 28 }}>
          The admin page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/dashboard" style={{ padding: "10px 24px", borderRadius: 10, background: "#ea580c", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
