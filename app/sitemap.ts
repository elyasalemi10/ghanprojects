import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";
import { getAllPosts } from "@/data/posts";
import { allResources } from "@/data/resources";

// Regenerate alongside the blog ISR window so newly published posts appear.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/services", priority: 0.8, changeFrequency: "monthly" },
    { path: "/invest", priority: 0.9, changeFrequency: "monthly" },
    { path: "/portfolio", priority: 0.8, changeFrequency: "monthly" },
    { path: "/insights", priority: 0.8, changeFrequency: "daily" },
    { path: "/resources", priority: 0.7, changeFrequency: "monthly" },
    { path: "/book-consultation", priority: 0.6, changeFrequency: "yearly" },
  ];

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const posts = await getAllPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/insights/${p.slug}`,
    lastModified: new Date(p.updated || p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const resourceEntries: MetadataRoute.Sitemap = allResources.map((r) => ({
    url: `${SITE_URL}/resources/${r.slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticEntries, ...postEntries, ...resourceEntries];
}
