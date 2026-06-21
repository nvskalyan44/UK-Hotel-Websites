interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
}

export function SectionHeader({ eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
      <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 18 }}>{title}</h2>
      {lead && <p className="text-muted" style={{ fontSize: 18, lineHeight: 1.6 }}>{lead}</p>}
    </div>
  );
}
