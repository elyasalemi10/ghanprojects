import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  noindex?: boolean;
  keywords?: string;
}

const SITE_NAME = 'PDCON';
const DEFAULT_TITLE = 'PDCON | Property Development & Investment Consulting Melbourne';
const DEFAULT_DESCRIPTION = "Melbourne's leading property development and investment consulting firm. Expert property advisory, joint venture structuring, buyer's agent services, and strategic property investment guidance.";
const DEFAULT_IMAGE = 'https://pdcon.com.au/images/pdcon-logo.webp';
const BASE_URL = 'https://pdcon.com.au';
const DEFAULT_KEYWORDS = 'property development Melbourne, property investment consulting, property advisory Melbourne, joint venture property development, buyer\'s agent Melbourne, PDCON, property consulting Melbourne';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  author = 'PDCON',
  noindex = false,
  keywords = DEFAULT_KEYWORDS,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_AU" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Article specific (for blog posts) */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Additional SEO */}
      <meta name="author" content={author} />
      <meta name="geo.region" content="AU-VIC" />
      <meta name="geo.placename" content="Melbourne" />
    </Helmet>
  );
}
