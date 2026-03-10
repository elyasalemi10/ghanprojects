export interface Resource {
  id: string;
  title: string;
  desc: string;
  fullDescription: string;
  cat: string;
  type: 'PDF' | 'Tool' | 'External';
  size?: string;
  tags?: string[];
  url?: string;
  isExternal?: boolean;
  isLocked: boolean;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  features?: string[];
}

export const freeResources: Resource[] = [
  {
    id: 'ai-assistant',
    title: 'AI Assistant for Property Developers',
    desc: 'A powerful AI tool for analyzing development sites, running feasibility scenarios, and getting instant answers to property development questions.',
    fullDescription: `Our AI Assistant for Property Developers is a cutting-edge tool designed specifically for Melbourne's property development landscape. Powered by advanced artificial intelligence, this tool helps you make data-driven decisions faster than ever before.

Whether you're evaluating a potential development site, running quick feasibility calculations, or need instant answers to complex property development questions, our AI Assistant is available 24/7 to support your investment decisions.

The assistant understands Melbourne's unique zoning regulations, planning overlays, and market dynamics, providing contextually relevant insights for your specific projects.`,
    cat: 'AI Tool',
    type: 'External',
    url: 'https://cruxlogic.ai/property-development',
    isExternal: true,
    isLocked: false,
    slug: 'ai-assistant',
    seoTitle: 'Free AI Assistant for Property Developers Melbourne',
    seoDescription: 'Use our free AI-powered property development assistant. Get instant feasibility analysis, zoning advice, and development insights for Melbourne properties.',
    seoKeywords: 'AI property development, property feasibility AI, Melbourne property assistant, development site analysis, property investment AI tool',
    features: [
      'Instant feasibility scenario analysis',
      'Melbourne zoning and planning insights',
      'Development cost estimations',
      'Site potential evaluation',
      'Market trend analysis',
      '24/7 availability'
    ]
  },
  {
    id: 'rental-yield-calculator',
    title: 'Rental Yield Calculator',
    desc: 'Calculate gross and net rental yields instantly. Compare investment properties and make informed decisions with accurate yield projections.',
    fullDescription: `Our Rental Yield Calculator is an essential tool for property investors looking to evaluate the income potential of investment properties in Melbourne and beyond.

This calculator goes beyond simple gross yield calculations. It factors in all the costs that eat into your rental returns—property management fees, maintenance, insurance, council rates, and vacancy periods—to give you a true picture of your net rental yield.

Use this tool to compare multiple properties side-by-side and identify which investments will deliver the strongest cash flow for your portfolio.`,
    cat: 'Calculator',
    type: 'Tool',
    isLocked: false,
    slug: 'rental-yield-calculator',
    seoTitle: 'Free Rental Yield Calculator Melbourne | Property Investment Tool',
    seoDescription: 'Calculate gross and net rental yields for Melbourne investment properties. Free calculator to compare properties and project investment returns accurately.',
    seoKeywords: 'rental yield calculator, property investment calculator, gross rental yield, net rental yield Melbourne, investment property returns',
    features: [
      'Gross and net yield calculations',
      'Factor in all ownership costs',
      'Compare multiple properties',
      'Vacancy rate adjustments',
      'Cash flow projections',
      'Export results for records'
    ]
  },
  {
    id: 'stamp-duty-calculator',
    title: 'Stamp Duty Calculator',
    desc: 'Calculate Victorian stamp duty instantly. Includes first home buyer exemptions, foreign purchaser surcharge, and off-the-plan concessions.',
    fullDescription: `Understanding your stamp duty obligations is crucial when budgeting for a property purchase in Victoria. Our Stamp Duty Calculator provides accurate calculations based on the latest Victorian State Revenue Office rates and thresholds.

The calculator automatically applies relevant concessions and exemptions based on your circumstances—whether you're a first home buyer, purchasing off-the-plan, or an investor. It also calculates the foreign purchaser additional duty if applicable.

Get instant clarity on one of the largest upfront costs in property purchases and plan your finances with confidence.`,
    cat: 'Calculator',
    type: 'Tool',
    isLocked: false,
    slug: 'stamp-duty-calculator',
    seoTitle: 'Victorian Stamp Duty Calculator 2024 | Free Property Tax Calculator',
    seoDescription: 'Calculate Victorian stamp duty for property purchases. Includes first home buyer exemptions, foreign purchaser surcharge, and off-the-plan concessions.',
    seoKeywords: 'stamp duty calculator Victoria, Victorian stamp duty, property transfer duty, first home buyer stamp duty, Melbourne property taxes',
    features: [
      'Up-to-date Victorian rates',
      'First home buyer exemptions',
      'Off-the-plan concessions',
      'Foreign purchaser surcharge',
      'Pensioner exemptions',
      'Principal residence vs investment'
    ]
  },
  {
    id: 'subdivision-checker',
    title: 'Can My Block Be Subdivided?',
    desc: 'Discover your property\'s subdivision potential. Check zoning, minimum lot sizes, and planning overlays to assess development opportunities.',
    fullDescription: `Wondering if your property can be subdivided? Our Subdivision Checker tool helps you understand the development potential of your land by analyzing key planning factors.

This tool examines your property against Victorian planning scheme requirements, including residential zone minimum lot sizes, overlay restrictions, and council-specific policies that affect subdivision approvals.

While this tool provides a preliminary assessment, subdivision potential depends on many factors. Use this as a starting point to understand whether your property warrants further investigation with a town planner or our development team.`,
    cat: 'Tool',
    type: 'Tool',
    isLocked: false,
    slug: 'subdivision-checker',
    seoTitle: 'Can My Block Be Subdivided? | Free Melbourne Subdivision Checker',
    seoDescription: 'Check if your Melbourne property can be subdivided. Free tool to assess zoning, minimum lot sizes, and planning overlays for subdivision potential.',
    seoKeywords: 'subdivision checker Melbourne, can I subdivide my block, property subdivision Victoria, minimum lot size Melbourne, subdivision potential',
    features: [
      'Zoning analysis',
      'Minimum lot size requirements',
      'Planning overlay checks',
      'Council policy insights',
      'Preliminary feasibility indication',
      'Next steps guidance'
    ]
  }
];

export const lockedResources: Resource[] = [
  {
    id: 'feasibility-checklist',
    title: 'Development Feasibility Checklist',
    desc: 'The essential 50-point checklist we use to evaluate every development site in Melbourne.',
    fullDescription: `Our Development Feasibility Checklist is the same 50-point framework our team uses to evaluate every potential development site across Melbourne.

This comprehensive checklist covers everything from initial site assessment and planning controls to construction feasibility and profit margin analysis. It's designed to help you systematically evaluate opportunities and avoid costly mistakes.

Each item includes guidance notes explaining why it matters and what red flags to watch for. This checklist has saved our team from numerous poor investments over the years.`,
    cat: 'Development',
    type: 'PDF',
    size: '1.2 MB',
    tags: ['Feasibility', 'Risk Management'],
    isLocked: true,
    slug: 'development-feasibility-checklist',
    seoTitle: 'Development Feasibility Checklist | Property Development Guide Melbourne',
    seoDescription: 'Download our 50-point development feasibility checklist. The essential framework for evaluating Melbourne development sites and avoiding costly mistakes.',
    seoKeywords: 'development feasibility checklist, property development assessment, site evaluation Melbourne, development risk management, feasibility analysis'
  },
  {
    id: 'due-diligence-checklist',
    title: 'Due Diligence Checklist',
    desc: "Don't miss a thing. A comprehensive guide to property due diligence for residential and commercial assets.",
    fullDescription: `Due diligence can make or break a property investment. Our comprehensive Due Diligence Checklist ensures you never miss a critical item when assessing a potential acquisition.

This checklist covers legal, financial, physical, and planning aspects of property due diligence. It's suitable for both residential and commercial property purchases, with specific sections for each property type.

Use this checklist to coordinate your solicitor, accountant, building inspector, and other advisors—ensuring nothing falls through the cracks before settlement.`,
    cat: 'Investment',
    type: 'PDF',
    size: '0.8 MB',
    tags: ['Acquisition', 'Legal'],
    isLocked: true,
    slug: 'due-diligence-checklist',
    seoTitle: 'Property Due Diligence Checklist | Investment Property Guide',
    seoDescription: 'Comprehensive property due diligence checklist for residential and commercial assets. Never miss a critical item in your property acquisition process.',
    seoKeywords: 'property due diligence, due diligence checklist, property acquisition, investment property checklist, Melbourne property purchase'
  },
  {
    id: 'jv-partnership-guide',
    title: 'JV Partnership Guide',
    desc: 'Learn how we structure joint ventures that protect both capital and equity partners.',
    fullDescription: `Joint ventures can be powerful vehicles for property development, but they must be structured correctly to protect all parties. Our JV Partnership Guide shares the frameworks we use to structure successful partnerships.

This guide covers different JV structures, profit-sharing arrangements, decision-making protocols, exit mechanisms, and dispute resolution processes. It includes template clauses and real-world examples from our own developments.

Whether you're contributing capital, expertise, or land to a joint venture, this guide will help you understand the key terms and protect your interests.`,
    cat: 'Finance',
    type: 'PDF',
    size: '2.4 MB',
    tags: ['Joint Ventures', 'Contracts'],
    isLocked: true,
    slug: 'jv-partnership-guide',
    seoTitle: 'Joint Venture Partnership Guide | Property Development JV Structure',
    seoDescription: 'Learn how to structure property development joint ventures. Comprehensive guide covering profit sharing, decision making, and partner protection.',
    seoKeywords: 'property joint venture, JV partnership guide, development partnership structure, property JV agreement, joint venture property development'
  },
  {
    id: 'melbourne-investor-guide',
    title: 'Melbourne Investor Starter Guide',
    desc: 'New to the market? This guide covers the basics of Melbourne property cycles and investment strategy.',
    fullDescription: `Melbourne's property market has unique characteristics that every investor should understand. Our Melbourne Investor Starter Guide provides the foundational knowledge you need to invest confidently in Australia's second-largest property market.

This guide covers Melbourne's property cycles, the drivers of capital growth across different suburbs, rental market dynamics, and emerging areas to watch. It's designed for investors new to Melbourne or those looking to refresh their market understanding.

We update this guide regularly to reflect current market conditions and opportunities.`,
    cat: 'Investment',
    type: 'PDF',
    size: '3.1 MB',
    tags: ['Strategy', 'Education'],
    isLocked: true,
    slug: 'melbourne-investor-starter-guide',
    seoTitle: 'Melbourne Property Investment Guide | Beginner Investor Resource',
    seoDescription: 'Essential guide for Melbourne property investors. Learn about property cycles, growth drivers, and investment strategies for the Melbourne market.',
    seoKeywords: 'Melbourne property investment, property investment guide, Melbourne property market, investment strategy Melbourne, property cycles Australia'
  },
  {
    id: 'off-market-guide',
    title: 'Off-Market Buying Guide',
    desc: 'The insider secrets to finding and securing high-value property before it goes to auction.',
    fullDescription: `The best property deals often never hit the public market. Our Off-Market Buying Guide reveals the strategies we use to source high-value properties before they go to auction or public listing.

This guide covers how to build relationships with agents, identify motivated sellers, structure compelling offers, and negotiate effectively in off-market situations. It includes scripts and templates you can use in your own property search.

Access to off-market opportunities can give you a significant edge in competitive markets—learn how to tap into this hidden inventory.`,
    cat: 'Strategy',
    type: 'PDF',
    size: '1.5 MB',
    tags: ['Off-Market', 'Negotiation'],
    isLocked: true,
    slug: 'off-market-buying-guide',
    seoTitle: 'Off-Market Property Buying Guide | Find Properties Before Auction',
    seoDescription: 'Discover how to find and secure off-market properties. Insider strategies for accessing high-value property deals before they go public.',
    seoKeywords: 'off-market property, off-market buying guide, pre-market property, property negotiation, Melbourne off-market deals'
  }
];

export const allResources = [...freeResources, ...lockedResources];

export const getResourceBySlug = (slug: string): Resource | undefined => {
  return allResources.find(r => r.slug === slug);
};

export const getToolResources = (): Resource[] => {
  return allResources.filter(r => r.type === 'Tool' || r.type === 'External');
};
