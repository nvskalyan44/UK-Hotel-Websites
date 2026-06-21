"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: {
          layout?: string;
          color?: string;
          shape?: string;
          label?: string;
          height?: number;
        };
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
        onCancel?: () => void;
      }) => { render: (el: HTMLElement) => Promise<void>; isEligible: () => boolean };
    };
  }
}

interface PayPalButtonsProps {
  amount: number;
  disabled?: boolean;
  onApprove: (paypalOrderId: string) => Promise<void>;
  onError?: (msg: string) => void;
  onCancel?: () => void;
}

export function PayPalButtons({ amount, disabled, onApprove, onError, onCancel }: PayPalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onApproveRef = useRef(onApprove);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);
  const [sdkReady, setSdkReady] = useState(false);
  const clientId = (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "").trim();

  // Keep callback refs current without re-rendering buttons
  useEffect(() => { onApproveRef.current = onApprove; }, [onApprove]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);

  // Check if SDK was already loaded (e.g. navigating back to payment step)
  useEffect(() => {
    if (window.paypal) setSdkReady(true);
  }, []);

  // Render PayPal buttons once SDK is ready or amount changes
  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "pay",
        height: 50,
      },
      createOrder: async () => {
        const res = await fetch("/api/payment/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create PayPal order");
        return data.orderID as string;
      },
      onApprove: async (data) => {
        await onApproveRef.current(data.orderID);
      },
      onError: (err) => {
        onErrorRef.current?.(String(err));
      },
      onCancel: () => {
        onCancelRef.current?.();
      },
    }).render(containerRef.current);
  }, [sdkReady, amount]);

  if (!clientId) return null;

  return (
    <>
      {/* next/script handles deduplication and React Strict Mode safely */}
      <Script
        id="paypal-js-sdk"
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=GBP`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => onErrorRef.current?.("Failed to load PayPal SDK. Please check your connection and refresh.")}
      />
      <div style={{ position: "relative" }}>
        <div ref={containerRef} style={{ minHeight: 50 }} />
        {disabled && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(12, 5, 2, 0.75)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(3px)",
            zIndex: 10,
          }}>
            <span style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
              Please agree to the terms above to continue
            </span>
          </div>
        )}
      </div>
    </>
  );
}
