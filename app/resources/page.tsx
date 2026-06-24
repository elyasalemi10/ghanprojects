import type { Metadata } from "next";
import Resources from "@/views/Resources";

export const metadata: Metadata = {
  title: "Free Property Development Resources, Tools & Guides",
  description:
    "Access free property development calculators, feasibility checklists, due diligence guides, and investment resources. Professional tools for Melbourne property investors and developers.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return <Resources />;
}
