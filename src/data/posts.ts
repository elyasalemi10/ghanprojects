// ---------------------------------------------------------------------------
// Blog posts data source
//
// This is the ONLY place the blog reads its data from. Right now it returns
// hard-coded example posts so you can see the blog layout working locally.
//
// To go live with a database + ISR:
//   1. Replace the bodies of getAllPosts() / getPostById() below with your
//      Supabase (or other) queries - keep the same return shapes.
//   2. In app/insights/page.tsx and app/insights/[id]/page.tsx add:
//        export const revalidate = 60   // seconds (ISR)
//      and (optionally) a generateStaticParams() in the [id] route.
// Nothing else in the app needs to change.
// ---------------------------------------------------------------------------

export interface BlogPost {
  id: number;
  title: string;
  category: string;
  thumbnail: string;
  date: string; // ISO date string e.g. "2024-05-01"
  read_time: string;
  excerpt: string;
  content: string; // HTML
}

const examplePosts: BlogPost[] = [
  {
    id: 1,
    title: "How to Assess a Development Site in Melbourne",
    category: "Strategy",
    date: "2024-05-12",
    read_time: "6 min read",
    excerpt:
      "Identifying the right site is the most critical step in property development. Here are the key factors we analyse before committing capital to a feasibility study.",
    thumbnail: "/images/property-analysis.webp",
    content: `
      <p>Choosing the right site is the single biggest determinant of a development project's success. Get it right and the numbers do the heavy lifting; get it wrong and no amount of clever design or marketing will rescue the feasibility. At Ghan Projects we run every potential acquisition through the same disciplined checklist before we spend a dollar on detailed due diligence.</p>

      <h2>1. Zoning and Planning Overlays</h2>
      <p>Before anything else, we confirm what the land actually permits. Zoning sets the baseline for what can be built, while overlays - heritage, vegetation, flooding, bushfire - can quietly erode your developable area or add six figures of unexpected cost.</p>
      <blockquote>A site that looks cheap on a price-per-square-metre basis is often expensive once the overlays are accounted for.</blockquote>

      <h2>2. Site Dimensions and Orientation</h2>
      <p>Frontage, depth, fall, and aspect drive your yield. We model indicative layouts early to confirm a site can physically accommodate the product we intend to build - townhouses, apartments, or a subdivision - at a density that makes the economics work.</p>
      <ul>
        <li><strong>Frontage:</strong> wider frontages unlock more efficient layouts and better street appeal.</li>
        <li><strong>Fall:</strong> steep sites add retaining and excavation costs fast.</li>
        <li><strong>Orientation:</strong> north-facing living areas materially improve saleability.</li>
      </ul>

      <h2>3. The Feasibility Numbers</h2>
      <p>Once the site passes the physical and planning filters, we build a feasibility model: land cost, construction cost, professional fees, finance, contingency, and a realistic gross realisation based on comparable sales. We want to see a margin that survives a downside scenario, not just the optimistic case.</p>

      <h3>What "good" looks like</h3>
      <p>As a rule of thumb we look for a development margin that comfortably absorbs a softening in end values and a lift in build costs. If the deal only works in a perfect market, it isn't a deal.</p>

      <h2>The Bottom Line</h2>
      <p>Site assessment is where discipline pays off. By the time we present an opportunity to our investor network, it has already cleared every hurdle above. If you'd like us to review a site you're considering, we'd be glad to help.</p>
    `,
  },
  {
    id: 2,
    title: "JV Property Development: How Profit Splits Work",
    category: "Finance",
    date: "2024-04-28",
    read_time: "8 min read",
    excerpt:
      "Joint ventures are a powerful way to combine capital and expertise. We break down the standard structures and how to negotiate a split that's fair to everyone.",
    thumbnail: "/images/glen-waverley.webp",
    content: `
      <p>Joint ventures let landowners, capital partners, and developers pool what each does best. But the difference between a great JV and a painful one almost always comes down to how the structure and the profit split were set up at the start.</p>
      <h2>Common JV Structures</h2>
      <p>The two most common models we use are equity splits and preferred-return structures. Each suits a different appetite for risk and reward.</p>
      <h2>Aligning Incentives</h2>
      <p>The best splits reward the party taking the most risk while keeping everyone motivated to deliver. We document responsibilities, decision rights, and exit mechanics up front so there are no surprises later.</p>
      <blockquote>A fair deal is one both parties would happily sign again on the next project.</blockquote>
      <p>If you're weighing up a joint venture, talk to us before you sign anything - the structure is far easier to get right at the beginning than to fix later.</p>
    `,
  },
  {
    id: 3,
    title: "Feasibility Basics: Costs, Risks, and Returns",
    category: "Investment",
    date: "2024-04-15",
    read_time: "5 min read",
    excerpt:
      "Before a shovel hits the ground, the numbers have to stack up. Here are the fundamental metrics every property investor should understand.",
    thumbnail: "/images/commercial-richmond.webp",
    content: `
      <p>A feasibility study is the financial backbone of any development. It translates a vision into numbers and tells you whether a project is worth pursuing.</p>
      <h2>The Core Inputs</h2>
      <p>Every feasibility starts with three buckets: acquisition cost, delivery cost, and gross realisation. Around those we layer finance costs, professional fees, and a contingency for the unexpected.</p>
      <h2>Reading the Output</h2>
      <p>We focus on development margin and return on cost, then stress-test both against rising build costs and softening sale prices. A robust project stays profitable even when conditions turn.</p>
      <p>Understanding these basics puts you in a far stronger position to evaluate any opportunity that crosses your desk.</p>
    `,
  },
];

/**
 * Returns all blog posts, newest first.
 * TODO: replace with a database query when you wire up persistence.
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  return [...examplePosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Returns a single post by id, or null if not found.
 * TODO: replace with a database query when you wire up persistence.
 */
export async function getPostById(id: string | number): Promise<BlogPost | null> {
  const numId = Number(id);
  return examplePosts.find((p) => p.id === numId) ?? null;
}
