"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartData {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { token, isAuthenticated } = useAuthStore();
  const [cart, setCart] = useState<CartData>({ items: [], itemCount: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, isAuthenticated]);

  useEffect(() => {
    if (isOpen) fetchCart();
  }, [isOpen, fetchCart]);

  const updateQty = async (productId: string, quantity: number) => {
    try {
      const res = await fetch(`${apiUrl}/cart/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch { /* ignore */ }
  };

  const removeItem = async (productId: string) => {
    try {
      const res = await fetch(`${apiUrl}/cart/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch { /* ignore */ }
  };

  const clearAll = async () => {
    try {
      const res = await fetch(`${apiUrl}/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch { /* ignore */ }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-surface-200)]">
          <h2 className="text-xl font-bold text-[var(--color-surface-900)]">
            Shopping Cart
            {cart.itemCount > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-surface-500)]">
                ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-100)] text-[var(--color-surface-600)] transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-3 border-[var(--color-saffron-500)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-[var(--color-surface-600)] font-medium">Your cart is empty</p>
              <p className="text-sm text-[var(--color-surface-400)] mt-1">
                Discover handcrafted treasures from artisans across India
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="mt-6 px-6 py-2.5 gradient-saffron text-white rounded-[var(--radius-md)] font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-50)] border border-[var(--color-surface-200)]"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-surface-200)] flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-surface-900)] truncate">{item.name}</p>
                    <p className="text-sm text-[var(--color-saffron-600)] font-semibold mt-0.5">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => item.quantity > 1 ? updateQty(item.productId, item.quantity - 1) : removeItem(item.productId)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--color-surface-300)] text-sm hover:bg-[var(--color-surface-200)] transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--color-surface-300)] text-sm hover:bg-[var(--color-surface-200)] transition-colors"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear cart */}
              <button
                onClick={clearAll}
                className="text-sm text-[var(--color-surface-500)] hover:text-red-600 transition-colors"
              >
                Clear entire cart
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-[var(--color-surface-200)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-surface-600)]">Subtotal</span>
              <span className="text-xl font-bold text-[var(--color-surface-900)]">
                ₹{cart.subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs text-[var(--color-surface-400)]">
              Shipping & taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full py-3 text-center gradient-saffron text-white font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
