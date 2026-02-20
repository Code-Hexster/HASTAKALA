import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — Hastakala",
  description: "Complete your purchase of authentic Indian handicrafts.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
