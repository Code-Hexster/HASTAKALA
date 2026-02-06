"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
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
          Create account
        </h2>
        <p className="mt-2 text-[var(--color-surface-500)]">
          Join Hastakala and discover authentic Indian handicrafts
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            Full Name
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Arjun Sharma"
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] placeholder:text-[var(--color-surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            Email Address
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="arjun@example.com"
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] placeholder:text-[var(--color-surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
          />
        </div>

        {/* Role Selector */}
        <div>
          <label htmlFor="register-role" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            I want to
          </label>
          <select
            id="register-role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
          >
            <option value="CUSTOMER">Buy handicrafts</option>
            <option value="ARTISAN">Sell as an artisan</option>
          </select>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-3 pr-12 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] placeholder:text-[var(--color-surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-surface-400)] hover:text-[var(--color-surface-600)] transition-colors"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="register-confirm" className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5">
            Confirm Password
          </label>
          <input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-surface-300)] bg-white text-[var(--color-surface-900)] placeholder:text-[var(--color-surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron-500)] focus:border-transparent transition-all"
          />
        </div>

        {/* Submit */}
        <button
          id="register-submit"
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-[var(--radius-md)] gradient-saffron text-white font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isLoading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-surface-500)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--color-saffron-600)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
