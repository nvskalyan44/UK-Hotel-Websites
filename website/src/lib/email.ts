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

const FROM = process.env.SMTP_FROM ?? "Abhiruchulu <noreply@abhiruchulu.co.uk>";
const RESTAURANT_EMAIL = process.env.RESTAURANT_EMAIL ?? "orders@abhiruchulu.co.uk";

interface OrderEmailData {
  id: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  estimatedMinutes?: number;
}

function itemRows(items: OrderEmailData["items"]) {
  return items.map(i =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #2a1a0e">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #2a1a0e;text-align:right">×${i.qty}</td><td style="padding:6px 0;border-bottom:1px solid #2a1a0e;text-align:right">£${(i.price * i.qty).toFixed(2)}</td></tr>`
  ).join("");
}

export async function sendOrderConfirmation(order: OrderEmailData) {
  const transport = getTransport();
  if (!transport) {
    console.log(`[email] Order confirmation for ${order.customerEmail} (SMTP not configured)`);
    return;
  }
  const eta = order.estimatedMinutes ?? (order.orderType === "delivery" ? 45 : 20);
  const html = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#100a04;color:#f5f0eb;padding:32px 24px;border-radius:16px">
  <h1 style="color:#fb923c;font-size:28px;margin:0 0 4px">Order confirmed! 🎉</h1>
  <p style="color:#a0917e;font-size:15px;margin:0 0 24px">Hi ${order.customerName}, we've received your order and we're on it.</p>
  <div style="background:#1c120a;border-radius:12px;padding:20px;margin-bottom:20px">
    <div style="font-size:13px;color:#a0917e;margin-bottom:4px">Order ID</div>
    <div style="font-weight:700;font-size:17px">#${order.id}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
    <thead><tr><th style="text-align:left;padding-bottom:8px;color:#a0917e">Item</th><th style="text-align:right;padding-bottom:8px;color:#a0917e">Qty</th><th style="text-align:right;padding-bottom:8px;color:#a0917e">Price</th></tr></thead>
    <tbody>${itemRows(order.items)}</tbody>
  </table>
  <div style="text-align:right;font-size:14px;color:#a0917e;margin-bottom:4px">Subtotal: £${order.subtotal.toFixed(2)}</div>
  ${order.discountAmount > 0 ? `<div style="text-align:right;font-size:14px;color:#34d399;margin-bottom:4px">Discount: −£${order.discountAmount.toFixed(2)}</div>` : ""}
  ${order.deliveryFee > 0 ? `<div style="text-align:right;font-size:14px;color:#a0917e;margin-bottom:4px">Delivery: £${order.deliveryFee.toFixed(2)}</div>` : `<div style="text-align:right;font-size:14px;color:#34d399;margin-bottom:4px">Delivery: FREE</div>`}
  <div style="text-align:right;font-size:20px;font-weight:800;color:#fb923c;margin-bottom:24px">Total: £${order.total.toFixed(2)}</div>
  <div style="background:#1c120a;border-radius:12px;padding:16px;font-size:14px;margin-bottom:20px">
    <b>${order.orderType === "delivery" ? "Delivery" : "Collection"}</b><br/>
    ${order.orderType === "delivery" && order.deliveryAddress ? `<span style="color:#a0917e">${order.deliveryAddress}</span><br/>` : ""}
    <span style="color:#fb923c">Estimated time: ~${eta} minutes</span>
  </div>
  ${order.specialInstructions ? `<div style="background:#1c120a;border-radius:12px;padding:16px;font-size:14px;color:#a0917e;margin-bottom:20px">Instructions: ${order.specialInstructions}</div>` : ""}
  <p style="color:#a0917e;font-size:13px;margin-top:24px">Questions? Call us or reply to this email.<br/>Thank you for choosing Abhiruchulu! 🍛</p>
</div>`;

  await transport.sendMail({
    from: FROM,
    to: order.customerEmail,
    subject: `Order confirmed #${order.id} — Abhiruchulu`,
    html,
  });
}

export async function sendNewOrderAlert(order: OrderEmailData) {
  const transport = getTransport();
  if (!transport) {
    console.log(`[email] New order alert #${order.id} (SMTP not configured)`);
    return;
  }
  const html = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#100a04;color:#f5f0eb;padding:32px 24px;border-radius:16px">
  <h1 style="color:#fb923c;font-size:24px;margin:0 0 8px">🔔 New Order #${order.id}</h1>
  <p style="color:#a0917e;font-size:14px;margin:0 0 20px">${order.orderType.toUpperCase()} · ${order.paymentMethod} · ${new Date().toLocaleString("en-GB")}</p>
  <div style="background:#1c120a;border-radius:12px;padding:16px;margin-bottom:16px">
    <b>${order.customerName}</b> &lt;${order.customerEmail}&gt;
    ${order.deliveryAddress ? `<br/><span style="color:#a0917e;font-size:13px">${order.deliveryAddress}</span>` : ""}
    ${order.specialInstructions ? `<br/><em style="color:#f59e0b;font-size:13px">Note: ${order.specialInstructions}</em>` : ""}
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
    <tbody>${itemRows(order.items)}</tbody>
  </table>
  <div style="text-align:right;font-size:20px;font-weight:800;color:#fb923c">£${order.total.toFixed(2)}</div>
</div>`;

  await transport.sendMail({
    from: FROM,
    to: RESTAURANT_EMAIL,
    subject: `🔔 New ${order.orderType} order #${order.id} — £${order.total.toFixed(2)}`,
    html,
  });
}
