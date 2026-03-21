"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface OrderDetails {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { product: { name: string; imageUrl?: string }; quantity: number; price: number }[];
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("success");
  const { token } = useAuthStore();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !token) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setOrder(data.data);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-saffron-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] flex items-center justify-center p-6">
      <div className="card p-8 sm:p-12 max-w-lg w-full text-center">
        {/* Success animation */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-surface-900)] font-[var(--font-display)] mb-2">
          Order Confirmed!
        </h1>
        <p className="text-[var(--color-surface-500)] mb-6">
          Thank you for supporting Indian artisans. Your order has been placed successfully.
        </p>

        {order && (
          <div className="bg-[var(--color-surface-50)] rounded-[var(--radius-md)] p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-surface-500)]">Order ID</span>
              <span className="font-mono text-xs text-[var(--color-surface-700)]">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-surface-500)]">Status</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {order.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-surface-500)]">Total</span>
              <span className="font-bold text-[var(--color-saffron-600)]">
                ₹{order.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="border-t border-[var(--color-surface-200)] pt-3 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[var(--color-surface-700)]">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/buyer/orders"
            className="flex-1 py-3 px-4 rounded-[var(--radius-md)] gradient-saffron text-white font-semibold hover:opacity-90 transition-all text-center"
          >
            View My Orders
          </Link>
          <Link
            href="/products"
            className="flex-1 py-3 px-4 rounded-[var(--radius-md)] border-2 border-[var(--color-surface-300)] text-[var(--color-surface-700)] font-semibold hover:bg-[var(--color-surface-100)] transition-all text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
