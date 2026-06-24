import type { Metadata } from "next";
import Portfolio from "@/views/Portfolio";

export const metadata: Metadata = {
  title: "Property Development Portfolio Melbourne",
  description:
    "Explore our successful property development projects across Melbourne. Townhouse developments, subdivisions, residential and commercial property investments delivered with strategic expertise.",
  alternates: { canonical: "/portfolio" },
  openGraph: { images: ["/images/townhouse-berwick.webp"] },
};

export default function PortfolioPage() {
  return <Portfolio />;
}
