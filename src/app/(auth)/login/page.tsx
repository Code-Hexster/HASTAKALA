"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      setAuth(data.user, data.token);
      router.push("/");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-surface-900)] font-[var(--font-display)]">
          Welcome back
        </h2>
        <p className="mt-2 text-[var(--color-surface-500)]">
          Sign in to continue exploring handcrafted treasures
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            Email Address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="arjun@example.com"
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] placeholder:text-[var(--color-surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 pr-12 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] placeholder:text-[var(--color-surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-surface-400)] hover:text-[var(--color-surface-600)] transition-colors text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[var(--color-surface-600)] cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-[var(--color-surface-300)] text-[var(--color-saffron-500)] focus:ring-[var(--color-saffron-500)]"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--color-saffron-600)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-[var(--radius-md)] gradient-saffron text-white font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isLoading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-surface-200)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[var(--color-surface-50)] text-[var(--color-surface-400)] uppercase tracking-wider">
            New here?
          </span>
        </div>
      </div>

      <Link
        href="/register"
        className="block w-full py-3 px-4 text-center rounded-[var(--radius-md)] border-2 border-[var(--color-saffron-500)] text-[var(--color-saffron-600)] font-semibold hover:bg-[var(--color-saffron-50)] transition-all"
      >
        Create an Account
      </Link>
    </>
  );
}
