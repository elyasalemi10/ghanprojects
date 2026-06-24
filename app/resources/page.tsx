import type { Metadata } from "next";
import Resources from "@/views/Resources";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Free Property Development Resources, Tools & Guides",
  description:
    "Access free property development calculators, feasibility checklists, due diligence guides, and investment resources. Professional tools for Melbourne property investors and developers.",
  path: "/resources",
});

export default function ResourcesPage() {
  return <Resources />;
}
