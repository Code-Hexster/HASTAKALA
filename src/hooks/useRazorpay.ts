"use client";

import { useEffect, useState, useCallback } from "react";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

/**
 * Hook to load the Razorpay checkout.js script and provide
 * a function to open the payment modal.
 */
export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // If already loaded
    if (typeof window !== "undefined" && window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Failed to load Razorpay script");
    document.body.appendChild(script);

    return () => {
      // Cleanup only if we appended it
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const openPayment = useCallback(
    (options: RazorpayOptions) => {
      if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
        console.error("Razorpay SDK not loaded");
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    [isLoaded]
  );

  return { isLoaded, openPayment };
}
