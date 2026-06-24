// ---------------------------------------------------------------------------
// Blog posts data source
//
// Posts are authored in the admin app (capital.ghanprojects.com.au/admin/blog)
// and stored in the shared Supabase `blog_posts` table. This file reads them
// with the anon key (published rows only, enforced by RLS) and maps the DB
// rows to the BlogPost shape the views consume.
//
// ISR: app/insights/page.tsx and app/insights/[slug]/page.tsx export a
// `revalidate` and the admin app pings /api/revalidate on publish so changes
// appear within seconds. If Supabase isn't configured (e.g. local dev without
// env vars) we fall back to a couple of example posts so the layout still
// renders.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface BlogAttachment {
  file_name: string;
  file_url: string;
  content_type: string | null;
  size_bytes: number | null;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  thumbnail: string;
  date: string; // ISO date string (published_at) — datePublished
  updated: string; // ISO date string (updated_at) — dateModified
  read_time: string;
  excerpt: string;
  content: string; // sanitised HTML
  attachments: BlogAttachment[];
}

type PostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  read_time: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
};

function rowToPost(row: PostRow, attachments: BlogAttachment[] = []): BlogPost {
  const published = row.published_at ?? row.created_at;
  return {
    slug: row.slug,
    title: row.title,
    category: row.category ?? "Insights",
    thumbnail: row.thumbnail_url ?? "",
    date: published,
    updated: row.updated_at ?? published,
    read_time: row.read_time ?? "",
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    attachments,
  };
}

const POST_COLUMNS =
  "slug, title, excerpt, content, category, read_time, thumbnail_url, published_at, created_at, updated_at";

/**
 * Returns all published posts, newest first. Falls back to example posts if
 * Supabase isn't configured.
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  if (!supabase) return fallbackPosts();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) {
    console.error("[blog] getAllPosts failed:", error.message);
    return [];
  }
  return (data as PostRow[]).map((r) => rowToPost(r));
}

/**
 * Returns a single published post by slug (with its attachments), or null.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!supabase) return fallbackPosts().find((p) => p.slug === slug) ?? null;

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`id, ${POST_COLUMNS}`)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !post) {
    if (error) console.error("[blog] getPostBySlug failed:", error.message);
    return null;
  }

  const { data: attachments } = await supabase
    .from("blog_post_attachments")
    .select("file_name, file_url, content_type, size_bytes, sort_order")
    .eq("post_id", (post as { id: string }).id)
    .order("sort_order", { ascending: true });

  return rowToPost(
    post as PostRow,
    (attachments ?? []).map((a) => ({
      file_name: a.file_name,
      file_url: a.file_url,
      content_type: a.content_type,
      size_bytes: a.size_bytes,
    })),
  );
}

/** Slugs for generateStaticParams (pre-render published posts at build). */
export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.slug);
}

// --- Local fallback so the blog renders without a database connection -------
function fallbackPosts(): BlogPost[] {
  return [
    {
      slug: "how-to-assess-a-development-site-in-melbourne",
      title: "How to Assess a Development Site in Melbourne",
      category: "Strategy",
      date: "2024-05-12",
      updated: "2024-05-12",
      read_time: "6 min read",
      excerpt:
        "Identifying the right site is the most critical step in property development. Here are the key factors we analyse before committing capital to a feasibility study.",
      thumbnail: "/images/property-analysis.webp",
      attachments: [],
      content: `<p>Choosing the right site is the single biggest determinant of a development project's success.</p>`,
    },
  ];
}
