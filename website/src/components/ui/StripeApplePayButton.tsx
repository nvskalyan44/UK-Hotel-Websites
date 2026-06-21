"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { loadStripe, type Stripe, type PaymentRequest } from "@stripe/stripe-js";
import { ApplePayMark } from "@/components/ui/Icons";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

interface Props {
  amount: number;
  agreed: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  onProcessingChange?: (processing: boolean) => void;
}

type Availability = "loading" | "available" | "unavailable" | "unconfigured";

export function StripeApplePayButton({ amount, agreed, onSuccess, onError, onProcessingChange }: Props) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [pr, setPr] = useState<PaymentRequest | null>(null);
  const [availability, setAvailability] = useState<Availability>("loading");
  const amountRef = useRef(amount);
  amountRef.current = amount;

  // Load Stripe once
  useEffect(() => {
    if (!publishableKey) { setAvailability("unconfigured"); return; }
    loadStripe(publishableKey).then(s => {
      if (!s) { setAvailability("unconfigured"); return; }
      setStripe(s);
    });
  }, []);

  // Build payment request when stripe is ready
  useEffect(() => {
    if (!stripe) return;
    const paymentRequest = stripe.paymentRequest({
      country: "GB",
      currency: "gbp",
      total: { label: "Abhiruchulu Restaurant", amount: Math.round(amount * 100) },
      requestPayerName: false,
      requestPayerEmail: false,
    });
    paymentRequest.canMakePayment().then(result => {
      if (result?.applePay) {
        setPr(paymentRequest);
        setAvailability("available");
      } else {
        setAvailability("unavailable");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe]);

  // Update payment request amount when cart total changes
  useEffect(() => {
    if (!pr) return;
    pr.update({ total: { label: "Abhiruchulu Restaurant", amount: Math.round(amount * 100) } });
  }, [pr, amount]);

  // Payment handler — wired on each render so it always sees latest callbacks
  const handlePaymentMethod = useCallback(async (ev: any) => {
    onProcessingChange?.(true);
    try {
      const res = await fetch("/api/payment/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountRef.current }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        ev.complete("fail");
        onError(data.error || "Could not initialise payment");
        return;
      }

      const { error, paymentIntent } = await stripe!.confirmCardPayment(
        data.clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );

      if (error) {
        ev.complete("fail");
        onError(error.message ?? "Payment declined");
      } else {
        ev.complete("success");
        onSuccess(paymentIntent!.id);
      }
    } catch (err: any) {
      ev.complete("fail");
      onError(err.message || "Payment failed. Please try again.");
    } finally {
      onProcessingChange?.(false);
    }
  }, [stripe, onSuccess, onError, onProcessingChange]);

  useEffect(() => {
    if (!pr) return;
    pr.on("paymentmethod", handlePaymentMethod);
    return () => { pr.off("paymentmethod", handlePaymentMethod); };
  }, [pr, handlePaymentMethod]);

  if (availability === "unconfigured") {
    return (
      <div style={{ padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 14, color: "#f87171" }}>
        Apple Pay is not available — payment provider is not configured. Please choose another payment method.
      </div>
    );
  }

  if (availability === "loading") {
    return <div className="text-muted" style={{ fontSize: 13 }}>Checking Apple Pay availability…</div>;
  }

  if (availability === "unavailable") {
    return (
      <div style={{ padding: 16, borderRadius: 12, background: "rgba(253,186,116,0.06)", border: "1px solid rgba(253,186,116,0.1)", fontSize: 14, color: "var(--muted)" }}>
        Apple Pay is not available on this device or browser. Please switch to Safari, or choose another payment method.
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!agreed}
      onClick={() => { if (agreed) pr?.show(); }}
      style={{
        width: "100%",
        padding: "16px 24px",
        borderRadius: 14,
        background: agreed ? "#000" : "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: agreed ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: agreed ? 1 : 0.45,
        transition: "opacity 160ms",
      }}
    >
      <ApplePayMark size={28} />
    </button>
  );
}
