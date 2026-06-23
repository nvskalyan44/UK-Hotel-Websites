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
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const token = await getAccessToken();

    const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "GBP",
              value: (amount as number).toFixed(2),
            },
            description: "Abhiruchi food order",
          },
        ],
      }),
    });

    const order = await res.json();

    if (!res.ok) {
      throw new Error(order.message || "Failed to create PayPal order");
    }

    return NextResponse.json({ orderID: order.id });
  } catch (err: any) {
    console.error("[paypal/create-order]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
