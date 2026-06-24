import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InsightPost from "@/views/InsightPost";
import { getPostBySlug, getAllSlugs } from "@/data/posts";

// ISR: re-render at most every 60s, and on-demand when the admin app pings
// /api/revalidate after a publish.
export const revalidate = 60;

// Pre-render published posts at build; new slugs render on first request
// (blocking) and are cached thereafter.
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Article Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/insights/${post.slug}` },
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
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();
  return <InsightPost post={post} />;
}
