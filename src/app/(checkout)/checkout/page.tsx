"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRazorpay } from "@/hooks/useRazorpay";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();
  const { openPayment, isLoaded } = useRazorpay();

  const [cart, setCart] = useState<{ items: CartItem[]; subtotal: number }>({
    items: [],
    subtotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"address" | "review">("address");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  const [address, setAddress] = useState<ShippingAddress>({
    name: user?.name || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
      if (data.data.items.length === 0) router.push("/products");
    } catch {
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [isAuthenticated, fetchCart, router]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    setError("");

    // Validate address
    if (!address.name || !address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
      setError("Please fill in all required address fields");
      return;
    }

    setProcessing(true);
    try {
      // Create order on backend
      const res = await fetch(`${apiUrl}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shippingAddress: address }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create order");
        setProcessing(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = data.data;

      if (paymentMethod === "razorpay") {
        // Open Razorpay payment modal
        openPayment({
          key: keyId,
          amount,
          currency,
          name: "Hastakala",
          description: "Handcrafted with love",
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: address.phone,
          },
          theme: { color: "#ff8000" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            // Verify payment on backend
            try {
              const verifyRes = await fetch(`${apiUrl}/orders/verify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...response,
                  orderId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                router.push(`/buyer/orders?success=${orderId}`);
              } else {
                setError("Payment verification failed");
              }
            } catch {
              setError("Payment verification failed — contact support");
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: () => setProcessing(false),
          },
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-saffron-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)]">
      <div className="container-hastakala py-8 lg:py-12">
        <h1 className="text-3xl font-bold text-[var(--color-surface-900)] font-[var(--font-display)] mb-8">
          Checkout
        </h1>

        {error && (
          <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left Column: Form ────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step Indicator */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setStep("address")}
                className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all ${
                  step === "address"
                    ? "gradient-saffron text-white"
                    : "bg-[var(--color-surface-200)] text-[var(--color-surface-600)]"
                }`}
              >
                1. Shipping Address
              </button>
              <button
                onClick={() => setStep("review")}
                className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all ${
                  step === "review"
                    ? "gradient-saffron text-white"
                    : "bg-[var(--color-surface-200)] text-[var(--color-surface-600)]"
                }`}
              >
                2. Review & Pay
              </button>
            </div>

            {step === "address" && (
              <div className="card p-6 space-y-5">
                <h2 className="text-lg font-semibold text-[var(--color-surface-900)]">Shipping Address</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-name" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">Full Name *</label>
                    <input id="checkout-name" name="name" value={address.name} onChange={handleAddressChange} className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-line1" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">Address Line 1 *</label>
                    <input id="checkout-line1" name="line1" value={address.line1} onChange={handleAddressChange} placeholder="House/Flat no., Street" className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-line2" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">Address Line 2</label>
                    <input id="checkout-line2" name="line2" value={address.line2} onChange={handleAddressChange} placeholder="Landmark (optional)" className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="checkout-city" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">City *</label>
                    <input id="checkout-city" name="city" value={address.city} onChange={handleAddressChange} className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="checkout-state" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">State *</label>
                    <select id="checkout-state" name="state" value={address.state} onChange={handleAddressChange} className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="checkout-pincode" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">PIN Code *</label>
                    <input id="checkout-pincode" name="pincode" value={address.pincode} onChange={handleAddressChange} maxLength={6} className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1">Phone *</label>
                    <input id="checkout-phone" name="phone" type="tel" value={address.phone} onChange={handleAddressChange} className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent outline-none transition-all" />
                  </div>
                </div>

                <button
                  onClick={() => setStep("review")}
                  className="w-full py-3 gradient-saffron text-white font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-all mt-4"
                >
                  Continue to Review
                </button>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6">
                {/* Payment Method */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-[var(--color-surface-900)] mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-4 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all ${paymentMethod === "razorpay" ? "border-[var(--color-saffron-500)] bg-[var(--color-saffron-50)]" : "border-[var(--color-surface-200)]"}`}>
                      <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} className="accent-[var(--color-saffron-500)]" />
                      <div>
                        <p className="font-medium text-[var(--color-surface-900)]">Pay with Razorpay</p>
                        <p className="text-xs text-[var(--color-surface-500)]">UPI, Cards, Net Banking, Wallets</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-[var(--color-saffron-500)] bg-[var(--color-saffron-50)]" : "border-[var(--color-surface-200)]"}`}>
                      <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-[var(--color-saffron-500)]" />
                      <div>
                        <p className="font-medium text-[var(--color-surface-900)]">Cash on Delivery</p>
                        <p className="text-xs text-[var(--color-surface-500)]">Pay when your order arrives</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Shipping summary */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-[var(--color-surface-900)] mb-3">Shipping To</h2>
                  <div className="text-sm text-[var(--color-surface-600)] space-y-1">
                    <p className="font-medium text-[var(--color-surface-900)]">{address.name}</p>
                    <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                    <p>{address.city}, {address.state} — {address.pincode}</p>
                    <p>📞 {address.phone}</p>
                  </div>
                  <button onClick={() => setStep("address")} className="text-sm text-[var(--color-saffron-600)] hover:underline mt-3">
                    Edit address
                  </button>
                </div>

                <button
                  id="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={processing || (!isLoaded && paymentMethod === "razorpay")}
                  className="w-full py-4 gradient-saffron text-white font-bold text-lg rounded-[var(--radius-md)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {processing ? "Processing…" : `Pay ₹${cart.subtotal.toLocaleString("en-IN")}`}
                </button>
              </div>
            )}
          </div>

          {/* ── Right Column: Order Summary ─────────────── */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-[var(--color-surface-900)] mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-[var(--radius-sm)] bg-[var(--color-surface-200)] overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🎨</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-surface-900)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--color-surface-500)]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-surface-900)]">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--color-surface-200)] mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-surface-500)]">Subtotal</span>
                  <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-surface-500)]">Shipping</span>
                  <span className="text-[var(--color-success)]">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-[var(--color-surface-200)]">
                  <span>Total</span>
                  <span className="text-[var(--color-saffron-600)]">₹{cart.subtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
