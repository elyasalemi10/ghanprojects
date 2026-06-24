import type { Metadata } from "next";
import Insights from "@/views/Insights";
import { getAllPosts } from "@/data/posts";
import { pageMetadata } from "@/lib/seo";

// ISR: re-render at most every 60s, and on-demand when the admin app pings
// /api/revalidate after a publish.
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Property Development & Investment Insights",
  description:
    "Expert property development insights, market analysis, and investment guides for Melbourne. Strategic advice on property investment, development feasibility, and market trends.",
  path: "/insights",
  image: "/images/property-analysis.webp",
});

export default async function InsightsPage() {
  const posts = await getAllPosts();
  return <Insights posts={posts} />;
}
