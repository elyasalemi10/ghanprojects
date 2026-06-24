import type { Metadata } from "next";
import Insights from "@/views/Insights";
import { getAllPosts } from "@/data/posts";

// To enable ISR once posts come from a database, uncomment:
// export const revalidate = 60;

export const metadata: Metadata = {
  title: "Property Development & Investment Insights",
  description:
    "Expert property development insights, market analysis, and investment guides for Melbourne. Strategic advice on property investment, development feasibility, and market trends.",
  alternates: { canonical: "/insights" },
};

export default async function InsightsPage() {
  const posts = await getAllPosts();
  return <Insights posts={posts} />;
}
