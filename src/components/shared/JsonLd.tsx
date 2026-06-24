// Renders a JSON-LD <script> for structured data. Server-rendered into the
// page HTML so crawlers see it without executing JS.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
