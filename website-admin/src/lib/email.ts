import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT ?? "587"),
    secure: parseInt(SMTP_PORT ?? "587") === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const FROM = process.env.SMTP_FROM ?? "Abhiruchi <noreply@abhiruchi.co.uk>";

const STATUS_LABELS: Record<string, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  preparing:         "Preparing",
  "out-for-delivery": "Out for Delivery",
  delivered:         "Delivered",
  ready:             "Ready for Collection",
  collected:         "Collected",
  cancelled:         "Cancelled",
};

const STATUS_ICONS: Record<string, string> = {
  pending:           "🕐",
  confirmed:         "✅",
  preparing:         "👨‍🍳",
  "out-for-delivery": "🚲",
  delivered:         "🎉",
  ready:             "🏪",
  collected:         "🎉",
  cancelled:         "❌",
};

const STATUS_COLORS: Record<string, string> = {
  pending:           "#6b7280",
  confirmed:         "#3b82f6",
  preparing:         "#f59e0b",
  "out-for-delivery": "#06b6d4",
  delivered:         "#10b981",
  ready:             "#10b981",
  collected:         "#10b981",
  cancelled:         "#ef4444",
};

export interface StatusUpdateOrder {
  id: string;
  customerEmail: string;
  customerName: string;
  status: string;
  estimatedMinutes?: number | null;
}

export async function sendStatusUpdate(order: StatusUpdateOrder): Promise<void> {
  const transport = getTransport();
  const label   = STATUS_LABELS[order.status] ?? order.status;
  const icon    = STATUS_ICONS[order.status]  ?? "📦";
  const color   = STATUS_COLORS[order.status] ?? "#ea580c";

  if (!transport) {
    console.log(`[email] Status update for order #${order.id} → ${label} (SMTP not configured)`);
    return;
  }

  const etaLine = order.estimatedMinutes
    ? `<p style="margin:0 0 16px;font-size:15px;color:#a0917e;">Estimated time: <span style="color:#fb923c;font-weight:700;">~${order.estimatedMinutes} minutes</span></p>`
    : "";

  const ctaLine = order.status !== "cancelled"
    ? `<a href="${process.env.SITE_URL ?? "http://localhost:3002"}/order/${order.id}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ea580c;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Track your order →</a>`
    : "";

  const html = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#100a04;color:#f5f0eb;padding:32px 24px;border-radius:16px">
  <h1 style="font-size:26px;margin:0 0 4px;color:#fb923c;">Order update</h1>
  <p style="color:#a0917e;font-size:15px;margin:0 0 28px;">Hi ${order.customerName.split(" ")[0]}, here&apos;s a status update on your order.</p>
  <div style="background:#1c120a;border-radius:12px;padding:20px 24px;margin-bottom:20px;border-left:4px solid ${color}">
    <div style="font-size:13px;color:#a0917e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.1em">Order #${order.id}</div>
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:30px">${icon}</span>
      <span style="font-weight:700;font-size:22px;color:${color}">${label}</span>
    </div>
  </div>
  ${etaLine}
  ${ctaLine}
  <p style="color:#a0917e;font-size:13px;margin-top:28px;border-top:1px solid #2a1a0e;padding-top:20px">
    Questions? Reply to this email or call us.<br/>
    Thank you for choosing Abhiruchi 🍛
  </p>
</div>`;

  await transport.sendMail({
    from: FROM,
    to: order.customerEmail,
    subject: `${icon} Order #${order.id} update: ${label} — Abhiruchi`,
    html,
  });
}
