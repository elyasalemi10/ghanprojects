import type { Metadata } from "next";
import Home from "@/views/Home";
import { getAllPosts } from "@/data/posts";

export const metadata: Metadata = {
  title: "Property Development & Investment in Melbourne",
  description:
    "Ghan Projects helps Australians invest in property — from joint-venture developments to getting started with as little as a few thousand dollars. Expert advisory, feasibility and strategy.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const posts = await getAllPosts();
  return <Home insights={posts.slice(0, 3)} />;
}
