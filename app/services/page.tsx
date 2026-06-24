import type { Metadata } from "next";
import Services from "@/views/Services";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Property Development & Investment Services",
  description:
    "Comprehensive property development consulting services in Melbourne. Property advisory, buyer's agent services, joint venture structuring, and project delivery management for investors and developers.",
  path: "/services",
});

export default function ServicesPage() {
  return <Services />;
}
