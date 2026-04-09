// Mock data for the On-Page Agent (Agent 2)

export type DecayingPage = {
  id: string;
  url: string;
  title: string;
  trafficCurrent: number;
  trafficPrevious: number;
  changePercent: number;
  lastUpdated: string;
  topKeyword: string;
  position: number;
  status: "flagged" | "refreshing" | "resolved" | "dismissed";
};

export const decayingPages: DecayingPage[] = [
  { id: "dp-1", url: "/blog/seo-trends-2023", title: "SEO Trends to Watch in 2023", trafficCurrent: 320, trafficPrevious: 1240, changePercent: -74.2, lastUpdated: "2023-02-15", topKeyword: "seo trends 2023", position: 34, status: "flagged" },
  { id: "dp-2", url: "/blog/link-building-guide", title: "The Complete Link Building Guide", trafficCurrent: 890, trafficPrevious: 1350, changePercent: -34.1, lastUpdated: "2023-08-20", topKeyword: "link building guide", position: 12, status: "flagged" },
  { id: "dp-3", url: "/blog/keyword-research-tips", title: "10 Keyword Research Tips for Beginners", trafficCurrent: 540, trafficPrevious: 720, changePercent: -25.0, lastUpdated: "2023-11-10", topKeyword: "keyword research tips", position: 8, status: "refreshing" },
  { id: "dp-4", url: "/blog/meta-descriptions-guide", title: "How to Write Perfect Meta Descriptions", trafficCurrent: 1100, trafficPrevious: 1450, changePercent: -24.1, lastUpdated: "2024-01-05", topKeyword: "meta description guide", position: 5, status: "resolved" },
  { id: "dp-5", url: "/blog/site-speed-optimization", title: "Site Speed Optimization: A Complete Guide", trafficCurrent: 410, trafficPrevious: 680, changePercent: -39.7, lastUpdated: "2023-06-12", topKeyword: "site speed optimization", position: 18, status: "flagged" },
];

export type CannibalizationPair = {
  id: string;
  keyword: string;
  searchVolume: number;
  pages: { url: string; title: string; position: number; traffic: number }[];
  severity: "high" | "medium" | "low";
  suggestedAction: string;
  status: "active" | "resolved";
};

export const cannibalizationPairs: CannibalizationPair[] = [
  {
    id: "cn-1", keyword: "seo audit", searchVolume: 12100, severity: "high", status: "active",
    pages: [
      { url: "/services/seo-audit", title: "Professional SEO Audit Services", position: 6, traffic: 420 },
      { url: "/blog/seo-audit-checklist", title: "Free SEO Audit Checklist 2024", position: 9, traffic: 310 },
    ],
    suggestedAction: "Consolidate into a single pillar page or differentiate intent — service page targets 'seo audit services' (transactional), blog targets 'seo audit checklist' (informational).",
  },
  {
    id: "cn-2", keyword: "technical seo", searchVolume: 8100, severity: "medium", status: "active",
    pages: [
      { url: "/services/technical-seo", title: "Technical SEO Services", position: 11, traffic: 180 },
      { url: "/blog/technical-seo-best-practices", title: "Technical SEO Best Practices", position: 14, traffic: 150 },
    ],
    suggestedAction: "Add canonical from blog to service page, or rewrite blog to target 'technical seo checklist' instead.",
  },
  {
    id: "cn-3", keyword: "local seo tips", searchVolume: 4400, severity: "low", status: "resolved",
    pages: [
      { url: "/blog/local-seo-guide", title: "Local SEO Guide for 2024", position: 4, traffic: 560 },
      { url: "/blog/local-seo-small-business", title: "Local SEO for Small Business", position: 7, traffic: 280 },
    ],
    suggestedAction: "Merge articles into a comprehensive guide and 301 redirect the weaker page.",
  },
];

export type CTROpportunity = {
  id: string;
  url: string;
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  expectedCtr: number;
  currentTitle: string;
  alternatives: string[];
  status: "pending" | "testing" | "applied";
};

export const ctrOpportunities: CTROpportunity[] = [
  {
    id: "ctr-1", url: "/services/seo-audit", keyword: "seo audit services", position: 4, impressions: 8200, clicks: 328, ctr: 4.0, expectedCtr: 8.5,
    currentTitle: "SEO Audit Services | Apex Digital",
    alternatives: [
      "🔍 Free SEO Audit in 24 Hours — Find Hidden Traffic Leaks | Apex Digital",
      "SEO Audit Services: We Found $240K in Lost Revenue for Clients Like You",
      "Professional SEO Audit — 147-Point Checklist Used by Top Agencies",
    ],
    status: "pending",
  },
  {
    id: "ctr-2", url: "/blog/link-building-guide", keyword: "link building guide", position: 3, impressions: 5400, clicks: 378, ctr: 7.0, expectedCtr: 11.2,
    currentTitle: "The Complete Link Building Guide",
    alternatives: [
      "Link Building in 2024: The Only Guide You'll Ever Need (With Templates)",
      "How We Built 500+ Backlinks in 90 Days — A Step-by-Step Guide",
      "Link Building Guide: 12 Strategies That Actually Work in 2024",
    ],
    status: "testing",
  },
  {
    id: "ctr-3", url: "/case-studies", keyword: "seo case studies", position: 2, impressions: 3100, clicks: 341, ctr: 11.0, expectedCtr: 14.8,
    currentTitle: "Case Studies | Apex Digital",
    alternatives: [
      "SEO Case Studies: How We Grew Organic Traffic 312% in 6 Months",
      "Real SEO Results — Case Studies from Apex Digital Agency",
      "Our Clients' Success Stories: SEO Case Studies with Real ROI Data",
    ],
    status: "pending",
  },
];

export type OrphanedPage = {
  id: string;
  url: string;
  title: string;
  internalLinksTo: number;
  internalLinksFrom: number;
  traffic: number;
  suggestedLinks: { fromUrl: string; fromTitle: string; anchorText: string }[];
  status: "orphaned" | "linked";
};

export const orphanedPages: OrphanedPage[] = [
  {
    id: "op-1", url: "/blog/schema-markup-guide", title: "Schema Markup Guide for Beginners", internalLinksTo: 0, internalLinksFrom: 2, traffic: 45,
    suggestedLinks: [
      { fromUrl: "/blog/technical-seo-best-practices", fromTitle: "Technical SEO Best Practices", anchorText: "schema markup guide" },
      { fromUrl: "/services/seo-audit", fromTitle: "SEO Audit Services", anchorText: "structured data implementation" },
    ],
    status: "orphaned",
  },
  {
    id: "op-2", url: "/blog/voice-search-optimization", title: "Voice Search Optimization in 2024", internalLinksTo: 1, internalLinksFrom: 0, traffic: 22,
    suggestedLinks: [
      { fromUrl: "/blog/seo-trends-2024", fromTitle: "SEO Trends 2024", anchorText: "voice search optimization" },
      { fromUrl: "/blog/local-seo-guide", fromTitle: "Local SEO Guide", anchorText: "optimizing for voice queries" },
      { fromUrl: "/services", fromTitle: "Our Services", anchorText: "voice search SEO" },
    ],
    status: "orphaned",
  },
  {
    id: "op-3", url: "/resources/seo-glossary", title: "SEO Glossary: 200+ Terms Explained", internalLinksTo: 0, internalLinksFrom: 1, traffic: 180,
    suggestedLinks: [
      { fromUrl: "/blog/keyword-research-tips", fromTitle: "Keyword Research Tips", anchorText: "SEO glossary" },
      { fromUrl: "/blog/seo-audit-checklist", fromTitle: "SEO Audit Checklist", anchorText: "glossary of SEO terms" },
    ],
    status: "orphaned",
  },
];

export const onPageKpis = {
  decayingPages: { value: 4, change: 33.3 },
  cannibalizationIssues: { value: 2, change: -50 },
  ctrGap: { value: 5.2, change: -12.1 },
  orphanedPages: { value: 3, change: 0 },
};

export const trafficTrendData = [
  { month: "Oct", organic: 18200, target: 20000 },
  { month: "Nov", organic: 19800, target: 21000 },
  { month: "Dec", organic: 17500, target: 22000 },
  { month: "Jan", organic: 22100, target: 23000 },
  { month: "Feb", organic: 21400, target: 24000 },
  { month: "Mar", organic: 24580, target: 25000 },
];
