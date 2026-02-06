import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hastakala — Sign In",
  description: "Access your Hastakala account to explore authentic Indian handicrafts.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left: Branding Panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center gradient-saffron">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative z-10 text-center text-white px-12">
          <Link href="/" className="block mb-8">
            <h1 className="text-5xl font-bold font-[var(--font-display)] tracking-tight">
              हस्तकला
            </h1>
            <p className="text-xl mt-2 opacity-90 tracking-wide">HASTAKALA</p>
          </Link>
          <p className="text-lg opacity-80 leading-relaxed max-w-md mx-auto">
            Empowering Indian artisans by connecting their timeless craft with the world.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 opacity-70 text-sm">
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p>Artisans</p>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-bold">50+</p>
              <p>GI Tags</p>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-bold">28</p>
              <p>States</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form Area ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--color-surface-50)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-bold text-[var(--color-saffron-600)] font-[var(--font-display)]">
                हस्तकला
              </h1>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
