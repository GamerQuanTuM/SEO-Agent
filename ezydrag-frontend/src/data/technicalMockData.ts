// Mock data for the Technical Agent (Agent 1)

export type CrawlLogEntry = {
  id: string;
  url: string;
  statusCode: number;
  botType: "Googlebot" | "Bingbot" | "Other";
  crawledAt: string;
  responseTime: number; // ms
  isLowValue: boolean;
  suggestedAction?: string;
};

export const crawlLogEntries: CrawlLogEntry[] = [
  { id: "cl-1", url: "/wp-admin/admin-ajax.php", statusCode: 200, botType: "Googlebot", crawledAt: "2024-03-28T08:12:00Z", responseTime: 420, isLowValue: true, suggestedAction: "Disallow /wp-admin/ in robots.txt" },
  { id: "cl-2", url: "/tag/old-campaign-2019", statusCode: 200, botType: "Googlebot", crawledAt: "2024-03-28T07:55:00Z", responseTime: 310, isLowValue: true, suggestedAction: "Disallow /tag/ in robots.txt" },
  { id: "cl-3", url: "/search?q=test&page=47", statusCode: 200, botType: "Googlebot", crawledAt: "2024-03-28T07:30:00Z", responseTime: 890, isLowValue: true, suggestedAction: "Disallow /search in robots.txt" },
  { id: "cl-4", url: "/services/seo-audit", statusCode: 200, botType: "Googlebot", crawledAt: "2024-03-28T06:45:00Z", responseTime: 180, isLowValue: false },
  { id: "cl-5", url: "/blog/seo-trends-2024", statusCode: 200, botType: "Googlebot", crawledAt: "2024-03-28T06:20:00Z", responseTime: 210, isLowValue: false },
  { id: "cl-6", url: "/blog/duplicate-page-v2", statusCode: 200, botType: "Bingbot", crawledAt: "2024-03-28T05:10:00Z", responseTime: 540, isLowValue: true, suggestedAction: "Add canonical tag or noindex" },
  { id: "cl-7", url: "/case-studies/client-a", statusCode: 200, botType: "Googlebot", crawledAt: "2024-03-28T04:50:00Z", responseTime: 195, isLowValue: false },
  { id: "cl-8", url: "/print/services-page", statusCode: 200, botType: "Other", crawledAt: "2024-03-28T04:15:00Z", responseTime: 670, isLowValue: true, suggestedAction: "Disallow /print/ in robots.txt" },
];

export type BrokenPage = {
  id: string;
  url: string;
  statusCode: 404 | 410 | 500;
  inboundLinks: number;
  topReferrer: string;
  suggestedRedirect: string;
  redirectCode: string;
  status: "pending" | "applied" | "dismissed";
};

export const brokenPages: BrokenPage[] = [
  { id: "bp-1", url: "/services/old-seo-package", statusCode: 404, inboundLinks: 14, topReferrer: "searchenginejournal.com", suggestedRedirect: "/services/seo-audit", redirectCode: "Redirect 301 /services/old-seo-package /services/seo-audit", status: "pending" },
  { id: "bp-2", url: "/blog/google-update-2022", statusCode: 404, inboundLinks: 8, topReferrer: "moz.com", suggestedRedirect: "/blog/google-update-2024", redirectCode: "Redirect 301 /blog/google-update-2022 /blog/google-update-2024", status: "pending" },
  { id: "bp-3", url: "/team/john-doe", statusCode: 410, inboundLinks: 3, topReferrer: "linkedin.com", suggestedRedirect: "/about", redirectCode: "Redirect 301 /team/john-doe /about", status: "applied" },
  { id: "bp-4", url: "/resources/whitepaper-v1", statusCode: 404, inboundLinks: 22, topReferrer: "hubspot.com", suggestedRedirect: "/resources/whitepaper-2024", redirectCode: "Redirect 301 /resources/whitepaper-v1 /resources/whitepaper-2024", status: "pending" },
  { id: "bp-5", url: "/landing/ppc-campaign-q3", statusCode: 404, inboundLinks: 5, topReferrer: "direct", suggestedRedirect: "/services", redirectCode: "Redirect 301 /landing/ppc-campaign-q3 /services", status: "dismissed" },
];

export type CoreWebVital = {
  metric: "LCP" | "FID" | "CLS" | "INP" | "TTFB";
  label: string;
  value: number;
  unit: string;
  rating: "good" | "needs-improvement" | "poor";
  threshold: { good: number; poor: number };
  culprit?: string;
};

export const coreWebVitals: CoreWebVital[] = [
  { metric: "LCP", label: "Largest Contentful Paint", value: 3.2, unit: "s", rating: "needs-improvement", threshold: { good: 2.5, poor: 4.0 }, culprit: "Hero image /images/hero-banner.webp (1.8 MB uncompressed)" },
  { metric: "INP", label: "Interaction to Next Paint", value: 180, unit: "ms", rating: "needs-improvement", threshold: { good: 200, poor: 500 } },
  { metric: "CLS", label: "Cumulative Layout Shift", value: 0.08, unit: "", rating: "good", threshold: { good: 0.1, poor: 0.25 } },
  { metric: "TTFB", label: "Time to First Byte", value: 0.6, unit: "s", rating: "good", threshold: { good: 0.8, poor: 1.8 } },
  { metric: "FID", label: "First Input Delay", value: 45, unit: "ms", rating: "good", threshold: { good: 100, poor: 300 } },
];

export type SchemaIssue = {
  id: string;
  pageUrl: string;
  schemaType: string;
  issue: string;
  severity: "error" | "warning";
  fix: string;
  status: "open" | "fixed";
};

export const schemaIssues: SchemaIssue[] = [
  { id: "si-1", pageUrl: "/services/seo-audit", schemaType: "Service", issue: "Missing 'provider' property — required for rich snippets", severity: "error", fix: "Add \"provider\": { \"@type\": \"Organization\", \"name\": \"Apex Digital\" }", status: "open" },
  { id: "si-2", pageUrl: "/blog/seo-trends-2024", schemaType: "Article", issue: "Invalid 'datePublished' format — uses MM/DD/YYYY instead of ISO 8601", severity: "error", fix: "Change datePublished to \"2024-01-15T00:00:00Z\"", status: "open" },
  { id: "si-3", pageUrl: "/", schemaType: "Organization", issue: "Missing 'logo' property", severity: "warning", fix: "Add \"logo\": { \"@type\": \"ImageObject\", \"url\": \"https://apexdigital.com/logo.png\" }", status: "open" },
  { id: "si-4", pageUrl: "/blog/case-study-roi", schemaType: "Article", issue: "Missing 'author' property", severity: "warning", fix: "Add \"author\": { \"@type\": \"Person\", \"name\": \"Author Name\" }", status: "fixed" },
];

export const crawlBudgetStats = {
  totalCrawls24h: 342,
  wastedCrawls: 87,
  wastedPercent: 25.4,
  avgResponseTime: 340,
  robotsTxtRules: 4,
};

export const technicalKpis = {
  crawlEfficiency: { value: 74.6, change: -3.2 },
  brokenPages: { value: 5, change: 25 },
  avgPageSpeed: { value: 2.1, change: -8.5 },
  schemaErrors: { value: 2, change: -50 },
};

export const crawlTrendData = [
  { day: "Mon", valuable: 48, wasted: 15 },
  { day: "Tue", valuable: 52, wasted: 18 },
  { day: "Wed", valuable: 45, wasted: 22 },
  { day: "Thu", valuable: 55, wasted: 12 },
  { day: "Fri", valuable: 50, wasted: 14 },
  { day: "Sat", valuable: 30, wasted: 8 },
  { day: "Sun", valuable: 25, wasted: 6 },
];
