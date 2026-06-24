import Home from "@/views/Home";
import { getAllPosts } from "@/data/posts";

export default async function HomePage() {
  const posts = await getAllPosts();
  return <Home insights={posts.slice(0, 3)} />;
}
