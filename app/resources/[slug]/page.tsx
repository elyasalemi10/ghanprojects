import type { Metadata } from "next";
import ResourcePage from "@/views/ResourcePage";
import { getResourceBySlug } from "@/data/resources";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const resource = getResourceBySlug(params.slug);
  return {
    title: resource?.seoTitle || resource?.title || "Property Resources & Tools",
    description:
      resource?.seoDescription ||
      resource?.desc ||
      "Free property development tools, calculators, and guides from Ghan Projects.",
    keywords: resource?.seoKeywords,
    alternates: { canonical: `/resources/${params.slug}` },
  };
}

export default function ResourceDetailPage() {
  return <ResourcePage />;
}
