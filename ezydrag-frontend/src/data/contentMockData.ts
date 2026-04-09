// Mock data for the Content Creation Agent (Agent 4)

export type DiscoveredTopic = {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: "low" | "medium" | "high";
  difficultyScore: number;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  currentRank: number | null;
  suggestedTitle: string;
  status: "new" | "drafting" | "drafted" | "published" | "dismissed";
};

export const discoveredTopics: DiscoveredTopic[] = [
  { id: "tp-1", keyword: "seo audit checklist 2024", searchVolume: 4400, difficulty: "low", difficultyScore: 22, intent: "informational", currentRank: null, suggestedTitle: "The Ultimate SEO Audit Checklist for 2024 (Free Template)", status: "new" },
  { id: "tp-2", keyword: "how to recover from google penalty", searchVolume: 2900, difficulty: "medium", difficultyScore: 45, intent: "informational", currentRank: null, suggestedTitle: "Google Penalty Recovery: A Step-by-Step Guide for 2024", status: "drafting" },
  { id: "tp-3", keyword: "local seo for small business", searchVolume: 6600, difficulty: "medium", difficultyScore: 38, intent: "commercial", currentRank: 42, suggestedTitle: "Local SEO for Small Business: 15 Tactics That Actually Work", status: "drafted" },
  { id: "tp-4", keyword: "technical seo best practices", searchVolume: 3200, difficulty: "high", difficultyScore: 67, intent: "informational", currentRank: 28, suggestedTitle: "Technical SEO Best Practices: The Complete Developer Guide", status: "new" },
  { id: "tp-5", keyword: "ecommerce seo strategy", searchVolume: 5100, difficulty: "medium", difficultyScore: 51, intent: "commercial", currentRank: null, suggestedTitle: "E-Commerce SEO Strategy: How to Drive Organic Revenue in 2024", status: "new" },
  { id: "tp-6", keyword: "schema markup generator", searchVolume: 8100, difficulty: "low", difficultyScore: 19, intent: "transactional", currentRank: null, suggestedTitle: "Free Schema Markup Generator: Create JSON-LD in Seconds", status: "published" },
];

export type ContentDraft = {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  wordCount: number;
  readingTime: number;
  keywordDensity: number;
  headings: string[];
  excerpt: string;
  body: string;
  internalLinks: { anchorText: string; targetUrl: string }[];
  status: "draft" | "review" | "approved" | "published";
  createdAt: string;
  seoScore: number;
};

export const contentDrafts: ContentDraft[] = [
  {
    id: "draft-1",
    topicId: "tp-3",
    title: "Local SEO for Small Business: 15 Tactics That Actually Work",
    slug: "local-seo-small-business-tactics",
    wordCount: 2840,
    readingTime: 12,
    keywordDensity: 1.8,
    headings: [
      "H1: Local SEO for Small Business: 15 Tactics That Actually Work",
      "H2: Why Local SEO Matters in 2024",
      "H2: 1. Claim & Optimize Your Google Business Profile",
      "H2: 2. Build Consistent NAP Citations",
      "H2: 3. Generate Authentic Customer Reviews",
      "H2: 4. Create Location-Specific Landing Pages",
      "H2: 5. Optimize for 'Near Me' Searches",
      "H3: Mobile-First Local Strategy",
      "H2: Measuring Local SEO Success",
      "H2: Conclusion & Next Steps",
    ],
    excerpt: "Discover 15 proven local SEO tactics that help small businesses dominate local search results and drive foot traffic in 2024.",
    body: `# Local SEO for Small Business: 15 Tactics That Actually Work

Local SEO is no longer optional for small businesses. With **46% of all Google searches** having local intent, showing up in local results can be the difference between thriving and closing your doors.

## Why Local SEO Matters in 2024

The local search landscape has evolved dramatically. Google's local algorithm now weighs **proximity, relevance, and prominence** more heavily than ever. Small businesses that invest in local SEO see an average **23% increase in foot traffic** within the first six months.

## 1. Claim & Optimize Your Google Business Profile

Your Google Business Profile (GBP) is the foundation of local SEO. Businesses with complete GBP listings are **2.7x more likely** to be considered reputable by consumers.

**Key optimization steps:**
- Complete every section of your profile
- Add high-quality photos weekly
- Post updates and offers regularly
- Respond to all reviews within 24 hours

## 2. Build Consistent NAP Citations

NAP (Name, Address, Phone) consistency across the web signals trustworthiness to search engines. Audit your listings on major directories like Yelp, Yellow Pages, and industry-specific platforms.

## 3. Generate Authentic Customer Reviews

Reviews are the #1 local ranking factor. Implement a systematic review generation strategy...`,
    internalLinks: [
      { anchorText: "SEO audit checklist", targetUrl: "/blog/seo-audit-checklist-2024" },
      { anchorText: "technical SEO guide", targetUrl: "/services/seo-audit" },
      { anchorText: "our case studies", targetUrl: "/case-studies" },
    ],
    status: "review",
    createdAt: "2024-03-27T10:00:00Z",
    seoScore: 88,
  },
  {
    id: "draft-2",
    topicId: "tp-2",
    title: "Google Penalty Recovery: A Step-by-Step Guide for 2024",
    slug: "google-penalty-recovery-guide",
    wordCount: 1920,
    readingTime: 8,
    keywordDensity: 2.1,
    headings: [
      "H1: Google Penalty Recovery: A Step-by-Step Guide",
      "H2: Types of Google Penalties",
      "H2: How to Identify a Penalty",
      "H2: Step 1: Audit Your Backlink Profile",
      "H2: Step 2: Remove Toxic Links",
      "H2: Step 3: Submit a Reconsideration Request",
      "H2: Prevention Strategies",
    ],
    excerpt: "Learn how to identify, diagnose, and recover from Google penalties with our comprehensive step-by-step recovery framework.",
    body: `# Google Penalty Recovery: A Step-by-Step Guide

If your organic traffic has suddenly dropped, you may be dealing with a Google penalty. This guide walks you through the complete recovery process...`,
    internalLinks: [
      { anchorText: "toxic link analysis", targetUrl: "/services/link-audit" },
      { anchorText: "backlink monitoring", targetUrl: "/tools" },
    ],
    status: "draft",
    createdAt: "2024-03-28T14:30:00Z",
    seoScore: 72,
  },
];

export type CMSConnection = {
  id: string;
  platform: "wordpress" | "webflow" | "shopify" | "custom";
  label: string;
  siteUrl: string;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  postsPublished: number;
};

export const cmsConnections: CMSConnection[] = [
  { id: "cms-1", platform: "wordpress", label: "Apex Digital Blog", siteUrl: "https://apexdigital.com/blog", status: "connected", lastSync: "2024-03-28T08:00:00Z", postsPublished: 34 },
  { id: "cms-2", platform: "webflow", label: "BlueWave Knowledge Base", siteUrl: "https://bluewavesaas.io/kb", status: "connected", lastSync: "2024-03-27T22:15:00Z", postsPublished: 12 },
  { id: "cms-3", platform: "shopify", label: "Craft & Co. Journal", siteUrl: "https://craftandco.com.au/journal", status: "disconnected", lastSync: "2024-03-15T10:00:00Z", postsPublished: 8 },
];

export const contentKpis = {
  topicsDiscovered: { value: 24, change: 15.3 },
  draftsGenerated: { value: 8, change: 33.3 },
  postsPublished: { value: 3, change: 50 },
  avgSeoScore: { value: 82, change: 4.1 },
};

export const contentPipelineData = [
  { stage: "Discovered", count: 24 },
  { stage: "Drafting", count: 6 },
  { stage: "In Review", count: 4 },
  { stage: "Approved", count: 2 },
  { stage: "Published", count: 3 },
];
