import type { Metadata } from "next";
import Home from "@/views/Home";
import { getAllPosts } from "@/data/posts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Property Development & Investment in Melbourne",
  description:
    "Ghan Projects helps Australians invest in property, from joint-venture developments to getting started with as little as a few thousand dollars. Expert advisory, feasibility and strategy.",
  path: "/",
  image: "/images/hero-home.webp",
});

export default async function HomePage() {
  const posts = await getAllPosts();
  return <Home insights={posts.slice(0, 3)} />;
}
