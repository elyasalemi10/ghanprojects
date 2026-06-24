import type { Metadata } from "next";
import Invest from "@/views/Invest";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Property Investment Opportunities Melbourne",
  description:
    "Explore current Melbourne property investment opportunities with Ghan Projects. Off-market deals, joint ventures, and strategic developments. Request an investment pack today.",
  path: "/invest",
  image: "/images/hero-about.webp",
});

export default function InvestPage() {
  return <Invest />;
}
