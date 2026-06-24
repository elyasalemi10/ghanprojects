import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InsightPost from "@/views/InsightPost";
import { getPostBySlug, getAllSlugs } from "@/data/posts";
import { JsonLd } from "@/components/shared/JsonLd";
import {
  blogPostingLd,
  breadcrumbLd,
  abs,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";

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

  // Always have a description: excerpt, else a snippet from the body text.
  const description =
    post.excerpt ||
    post.content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  const image = abs(post.thumbnail || DEFAULT_OG_IMAGE);

  return {
    title: post.title,
    description,
    keywords: post.category || undefined,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/insights/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated,
      section: post.category || undefined,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
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
  return (
    <>
      <JsonLd data={blogPostingLd(post)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
          { name: post.title, path: `/insights/${post.slug}` },
        ])}
      />
      <InsightPost post={post} />
    </>
  );
}
