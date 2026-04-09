// Mock data for the Off-Page Agent

export const clients = [
  { id: "client-1", name: "Apex Digital", domain: "apexdigital.com", logo: "A" },
  { id: "client-2", name: "BlueWave SaaS", domain: "bluewavesaas.io", logo: "B" },
  { id: "client-3", name: "Craft & Co.", domain: "craftandco.com.au", logo: "C" },
];

export type BacklinkEntry = {
  id: string;
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  status: "active" | "lost" | "toxic";
  firstSeen: string;
  lastChecked: string;
  spamScore: number;
};

export const backlinks: BacklinkEntry[] = [
  { id: "bl-1", sourceDomain: "techcrunch.com", sourceUrl: "https://techcrunch.com/2024/best-seo-tools", targetUrl: "/tools", anchorText: "best SEO tools", domainAuthority: 93, status: "active", firstSeen: "2024-01-15", lastChecked: "2024-03-28", spamScore: 1 },
  { id: "bl-2", sourceDomain: "searchenginejournal.com", sourceUrl: "https://searchenginejournal.com/agency-review", targetUrl: "/", anchorText: "Apex Digital review", domainAuthority: 88, status: "active", firstSeen: "2023-11-02", lastChecked: "2024-03-28", spamScore: 2 },
  { id: "bl-3", sourceDomain: "spam-links-farm.xyz", sourceUrl: "https://spam-links-farm.xyz/page12", targetUrl: "/services", anchorText: "cheap seo services buy now", domainAuthority: 5, status: "toxic", firstSeen: "2024-03-01", lastChecked: "2024-03-28", spamScore: 95 },
  { id: "bl-4", sourceDomain: "link-exchange-net.ru", sourceUrl: "https://link-exchange-net.ru/partners", targetUrl: "/about", anchorText: "click here for services", domainAuthority: 8, status: "toxic", firstSeen: "2024-02-20", lastChecked: "2024-03-28", spamScore: 88 },
  { id: "bl-5", sourceDomain: "moz.com", sourceUrl: "https://moz.com/blog/top-agencies-2024", targetUrl: "/case-studies", anchorText: "Apex Digital case study", domainAuthority: 91, status: "lost", firstSeen: "2023-06-10", lastChecked: "2024-03-25", spamScore: 1 },
  { id: "bl-6", sourceDomain: "hubspot.com", sourceUrl: "https://hubspot.com/resources/seo-guide", targetUrl: "/blog/seo-tips", anchorText: "SEO tips for agencies", domainAuthority: 94, status: "active", firstSeen: "2024-02-01", lastChecked: "2024-03-28", spamScore: 0 },
  { id: "bl-7", sourceDomain: "forbes.com", sourceUrl: "https://forbes.com/digital-marketing-trends", targetUrl: "/", anchorText: "digital marketing agency", domainAuthority: 95, status: "lost", firstSeen: "2023-04-22", lastChecked: "2024-03-20", spamScore: 0 },
  { id: "bl-8", sourceDomain: "casino-slots-free.bet", sourceUrl: "https://casino-slots-free.bet/links", targetUrl: "/contact", anchorText: "best services guaranteed", domainAuthority: 3, status: "toxic", firstSeen: "2024-03-15", lastChecked: "2024-03-28", spamScore: 99 },
];

export type ActionItem = {
  id: string;
  agentType: "toxic-link" | "lost-link" | "unlinked-mention" | "competitor-gap" | "outreach";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  status: "pending" | "approved" | "dismissed";
  createdAt: string;
  metadata?: Record<string, string>;
  draftEmail?: string;
};

export const actionItems: ActionItem[] = [
  {
    id: "act-1",
    agentType: "toxic-link",
    severity: "critical",
    title: "3 toxic backlinks detected from spam domains",
    description: "Incoming links from spam-links-farm.xyz, link-exchange-net.ru, and casino-slots-free.bet are flagged with spam scores above 85. A Google Disavow File has been compiled.",
    status: "pending",
    createdAt: "2024-03-28T09:15:00Z",
    metadata: { toxicCount: "3", disavowReady: "true" },
  },
  {
    id: "act-2",
    agentType: "lost-link",
    severity: "high",
    title: "High-authority backlink lost from moz.com",
    description: "The page at moz.com/blog/top-agencies-2024 that linked to /case-studies has been removed or the link was dropped. This was a DA 91 link. Recovery outreach email has been drafted.",
    status: "pending",
    createdAt: "2024-03-27T14:30:00Z",
    metadata: { lostDA: "91", sourceDomain: "moz.com" },
    draftEmail: `Subject: Quick question about your Top Agencies 2024 article\n\nHi [Editor Name],\n\nI noticed that our case study link was recently removed from your excellent "Top Agencies 2024" article. We really valued being featured alongside other industry leaders.\n\nWould you be open to re-adding the link? Our case study page is fully updated with 2024 results that your readers would find valuable.\n\nHappy to discuss — thanks for your time!\n\nBest,\n[Your Name]`,
  },
  {
    id: "act-3",
    agentType: "lost-link",
    severity: "high",
    title: "Forbes backlink lost — DA 95 link equity at risk",
    description: "The linking page at forbes.com/digital-marketing-trends no longer contains the backlink to your homepage. This was one of your highest-authority referring domains.",
    status: "pending",
    createdAt: "2024-03-26T11:00:00Z",
    metadata: { lostDA: "95", sourceDomain: "forbes.com" },
    draftEmail: `Subject: Broken link in your Digital Marketing Trends piece\n\nHi [Editor Name],\n\nI'm reaching out because I noticed the link to Apex Digital was removed from your "Digital Marketing Trends" article. We've been a trusted resource for your readers and would love to continue being referenced.\n\nOur homepage has been updated with fresh 2024 insights that align perfectly with the article's theme.\n\nWould love to reconnect — thanks!\n\nBest,\n[Your Name]`,
  },
  {
    id: "act-4",
    agentType: "unlinked-mention",
    severity: "medium",
    title: "Unlinked brand mention found on MarketingProfs",
    description: "MarketingProfs.com mentioned 'Apex Digital' in their latest agency roundup article but did not include a hyperlink. Outreach email drafted to request link addition.",
    status: "pending",
    createdAt: "2024-03-25T16:45:00Z",
    metadata: { mentionUrl: "https://marketingprofs.com/articles/2024/agency-roundup", publisher: "MarketingProfs" },
    draftEmail: `Subject: Thanks for the mention — small request!\n\nHi [Author Name],\n\nThanks so much for including Apex Digital in your recent agency roundup — we're honoured! I noticed our name was mentioned without a hyperlink.\n\nWould you be open to adding a quick link to apexdigital.com? It would help your readers find us easily and we'd be happy to share the article with our audience.\n\nCheers,\n[Your Name]`,
  },
  {
    id: "act-5",
    agentType: "competitor-gap",
    severity: "medium",
    title: "Competitor backlink gap: 12 high-DA domains linking to competitors but not you",
    description: "Analysis of top 3 competitors reveals 12 domains with DA 70+ that link to at least one competitor but not to your site. Key targets include entrepreneur.com, inc.com, and adweek.com.",
    status: "pending",
    createdAt: "2024-03-24T10:00:00Z",
    metadata: { gapCount: "12", topTarget: "entrepreneur.com" },
  },
  {
    id: "act-6",
    agentType: "outreach",
    severity: "low",
    title: "Broken link opportunity found on Search Engine Land",
    description: "Search Engine Land's 'Best Tools for SEO' article contains a dead link to a competitor's defunct page. An outreach pitch has been drafted to suggest replacing it with your /tools page.",
    status: "pending",
    createdAt: "2024-03-23T08:20:00Z",
    metadata: { targetSite: "searchengineland.com", brokenUrl: "https://defunct-competitor.com/tools" },
    draftEmail: `Subject: Found a broken link in your Best Tools article\n\nHi [Editor Name],\n\nI was reading your excellent "Best Tools for SEO" article and noticed that the link to [Defunct Competitor] appears to be broken — the page returns a 404.\n\nWe have a comprehensive, up-to-date tools page at apexdigital.com/tools that could be a great replacement for your readers.\n\nHappy to help — thanks for considering!\n\nBest,\n[Your Name]`,
  },
];

export const backlinkVelocityData = [
  { month: "Oct", gained: 12, lost: 3 },
  { month: "Nov", gained: 18, lost: 2 },
  { month: "Dec", gained: 8, lost: 5 },
  { month: "Jan", gained: 22, lost: 4 },
  { month: "Feb", gained: 15, lost: 7 },
  { month: "Mar", gained: 11, lost: 9 },
];

export const toxicityBreakdown = [
  { name: "Clean (0-20)", value: 142, fill: "hsl(var(--chart-1))" },
  { name: "Low Risk (21-40)", value: 28, fill: "hsl(var(--chart-2))" },
  { name: "Medium Risk (41-60)", value: 8, fill: "hsl(var(--chart-3))" },
  { name: "High Risk (61-80)", value: 4, fill: "hsl(var(--chart-4))" },
  { name: "Toxic (81-100)", value: 3, fill: "hsl(var(--chart-5))" },
];

export const kpiData = {
  organicTraffic: { value: 24580, change: 12.4 },
  seoHealth: { value: 87, change: 3.2 },
  topKeywords: { value: 42, change: -2.1 },
  domainAuthority: { value: 58, change: 1.5 },
  totalBacklinks: { value: 185, change: 8.7 },
  toxicLinks: { value: 3, change: 50 },
  lostLinks: { value: 2, change: -33 },
  referringDomains: { value: 112, change: 5.2 },
};
