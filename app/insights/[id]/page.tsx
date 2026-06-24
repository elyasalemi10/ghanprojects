import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InsightPost from "@/views/InsightPost";
import { getPostById, getAllPosts } from "@/data/posts";

// To enable ISR once posts come from a database, uncomment:
// export const revalidate = 60;

// Pre-render known posts at build time (optional; safe to keep with a DB too).
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPostById(params.id);
  if (!post) return { title: "Article Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/insights/${post.id}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: post.thumbnail ? [post.thumbnail] : undefined,
    },
  };
}

export default async function InsightPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostById(params.id);
  if (!post) notFound();
  return <InsightPost post={post} />;
}
