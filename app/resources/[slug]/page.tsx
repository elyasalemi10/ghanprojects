import type { Metadata } from "next";
import ResourcePage from "@/views/ResourcePage";

export const metadata: Metadata = {
  title: "Property Resources & Tools",
  description:
    "Free property development tools, calculators, and guides from Ghan Projects.",
};

export default function ResourceDetailPage() {
  return <ResourcePage />;
}
