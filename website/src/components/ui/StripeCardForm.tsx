"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export const stripeReady = !!publishableKey;

export interface StripeCardFormHandle {
  confirmPayment: (amount: number) => Promise<string>; // resolves with paymentIntentId
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#f5f0eb",
      fontFamily: "Inter, sans-serif",
      fontSize: "15px",
      "::placeholder": { color: "#6b5c4e" },
      iconColor: "#fb923c",
    },
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
};

function InnerForm(_props: object, ref: React.Ref<StripeCardFormHandle>) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState("");

  useImperativeHandle(ref, () => ({
    confirmPayment: async (amount: number) => {
      if (!stripe || !elements) throw new Error("Stripe not ready");
      setCardError("");

      const intentRes = await fetch("/api/payment/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.clientSecret) {
        throw new Error(intentData.error || "Failed to initialise payment");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });
      if (error) {
        setCardError(error.message ?? "Card declined");
        throw new Error(error.message ?? "Card declined");
      }
      return paymentIntent!.id;
    },
  }));

  return (
    <div>
      <div style={{
        padding: "14px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(253,186,116,0.15)",
      }}>
        <CardElement options={CARD_ELEMENT_OPTIONS} onChange={() => setCardError("")} />
      </div>
      {cardError && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#f87171" }}>{cardError}</div>
      )}
      <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Secured by Stripe · 256-bit SSL</span>
        <svg viewBox="0 0 60 25" width={38} height={16} style={{ opacity: 0.6 }}><path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 2.98-1.49 3.6-1.22v3.79c-.64-.28-2.54-.49-3.3.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 01-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 01-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.5 0 3 .28 4.45.9v3.86a9.23 9.23 0 00-4.45-1.22c-.88 0-1.4.06-1.4.92 0 1.8 5.56.85 5.56 5.86z" fill="#635bff"/></svg>
      </div>
    </div>
  );
}

const StripeInnerForm = forwardRef<StripeCardFormHandle, object>(InnerForm as any);

export const StripeCardForm = forwardRef<StripeCardFormHandle, object>((props, ref) => {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise}>
      <StripeInnerForm ref={ref} />
    </Elements>
  );
});
StripeCardForm.displayName = "StripeCardForm";
