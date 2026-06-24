// In the Next.js app, per-page SEO is handled by the `metadata` export in each
// route's `page.tsx` (server-rendered). This component is a no-op kept only so
// the ported page views can keep their existing <SEO .../> usage unchanged.
interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
  noindex?: boolean;
  keywords?: string;
}

export function SEO(_props: SEOProps) {
  return null;
}
