import { NextResponse } from "next/server";

function baseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET_KEY;
  const creds = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || "Failed to get PayPal access token");
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: Request) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET_KEY;

  if (!clientId || !secret) {
    return NextResponse.json({ error: "PayPal not configured" }, { status: 503 });
  }

  try {
    const { orderID } = await req.json();

    if (!orderID) {
      return NextResponse.json({ error: "Missing orderID" }, { status: 400 });
    }

    const token = await getAccessToken();

    const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await res.json();

    if (!res.ok || captureData.status !== "COMPLETED") {
      const msg = captureData.details?.[0]?.description || captureData.message || "Payment capture failed";
      throw new Error(msg);
    }

    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    return NextResponse.json({ success: true, captureID: captureId, status: captureData.status });
  } catch (err: any) {
    console.error("[paypal/capture-order]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
