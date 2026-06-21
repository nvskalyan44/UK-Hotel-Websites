import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
    const { amount, currency = "gbp", metadata } = await req.json();

    if (!amount || amount < 30) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // pence
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: metadata ?? {},
    });

    return NextResponse.json({ clientSecret: intent.client_secret, id: intent.id });
  } catch (err: any) {
    console.error("[payment/intent]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
