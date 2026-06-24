import type { Metadata } from "next";
import ResourcePage from "@/views/ResourcePage";
import { getResourceBySlug } from "@/data/resources";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const resource = getResourceBySlug(params.slug);
  return pageMetadata({
    title:
      resource?.seoTitle || resource?.title || "Property Resources & Tools",
    description:
      resource?.seoDescription ||
      resource?.desc ||
      "Free property development tools, calculators, and guides from Ghan Projects.",
    path: `/resources/${params.slug}`,
    keywords: resource?.seoKeywords,
  });
}

export default function ResourceDetailPage() {
  return <ResourcePage />;
}
