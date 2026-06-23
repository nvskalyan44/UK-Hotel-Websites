/**
 * SMS alert helper using Twilio.
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 * Falls back to console.log if Twilio is not configured.
 */

export async function sendSmsAlert(
  toNumber: string,
  orderId: string,
  customerName: string,
  total: number
): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  const body =
    `New order at Abhiruchi!\n` +
    `Order: ${orderId}\n` +
    `Customer: ${customerName}\n` +
    `Total: £${total.toFixed(2)}\n` +
    `Log in to review: https://admin.abhiruchi.co.uk/orders`;

  if (!sid || !token || !from) {
    console.log("[SMS alert] Twilio not configured — would have sent:", body);
    return;
  }

  try {
    // Dynamic import so the app doesn't break if twilio isn't installed
    const twilio = await import("twilio").then(m => m.default ?? m);
    const client = twilio(sid, token);
    await client.messages.create({ body, from, to: toNumber });
    console.log(`[SMS alert] Sent to ${toNumber} for order ${orderId}`);
  } catch (err) {
    console.error("[SMS alert] Failed to send:", err);
  }
}
