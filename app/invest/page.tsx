import type { Metadata } from "next";
import Invest from "@/views/Invest";

export const metadata: Metadata = {
  title: "Property Investment Opportunities Melbourne",
  description:
    "Explore current Melbourne property investment opportunities with Ghan Projects. Off-market deals, joint ventures, and strategic developments - request an investment pack today.",
  alternates: { canonical: "/invest" },
};

export default function InvestPage() {
  return <Invest />;
}
