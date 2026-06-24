import type { Metadata } from "next";
import Portfolio from "@/views/Portfolio";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Property Development Portfolio Melbourne",
  description:
    "Explore our successful property development projects across Melbourne. Townhouse developments, subdivisions, residential and commercial property investments delivered with strategic expertise.",
  path: "/portfolio",
  image: "/images/townhouse-berwick.webp",
});

export default function PortfolioPage() {
  return <Portfolio />;
}
