import type { Metadata } from "next";

import type { BlogPost } from "@/data/posts";

// Single source of truth for SEO constants + structured-data (JSON-LD) builders.
export const SITE_URL = "https://ghanprojects.com.au";
export const SITE_NAME = "Ghan Projects";
export const DEFAULT_OG_IMAGE = "/images/ghan-projects-logo-blue.webp";
const SITE_DESCRIPTION =
  "Melbourne's property development and investment consulting firm. Property advisory, joint-venture structuring, and strategic property investment guidance.";

/** Resolve a path or relative URL to an absolute one for structured data / OG. */
export function abs(pathOrUrl: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Build a page's Metadata with a canonical URL plus complete Open Graph and
 * Twitter cards, so every page is shareable and not just the blog posts. When
 * a child segment sets `openGraph`, Next replaces (not deep-merges) the root
 * layout's, so each page must supply the full block — this keeps them DRY.
 *
 * `title` is the page-specific part; Next's title.template appends the brand
 * suffix for the document title. We mirror that suffix into the OG/Twitter
 * titles so social cards read the same as the tab.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
}): Metadata {
  const ogTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_AU",
      url: path,
      title: ogTitle,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [image],
    },
  };
}

const publisher = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: abs(DEFAULT_OG_IMAGE) },
};

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: abs(DEFAULT_OG_IMAGE),
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "Country", name: "Australia" },
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function blogPostingLd(post: BlogPost) {
  const url = `${SITE_URL}/insights/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [abs(post.thumbnail || DEFAULT_OG_IMAGE)],
    datePublished: post.date,
    dateModified: post.updated,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(post.category ? { articleSection: post.category } : {}),
  };
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}
