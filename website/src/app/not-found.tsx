import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 16px" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 96, marginBottom: 16, lineHeight: 1 }}>🍛</div>
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8 }}>404</h1>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Page not found</h2>
        <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
          Looks like this page has gone missing — just like the last piece of dosa at the table.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/menu" className="btn btn-ghost">View our menu</Link>
        </div>
      </div>
    </main>
  );
}
