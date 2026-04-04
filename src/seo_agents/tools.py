"""
SEO Data Collection — Orchestrates real API services.

Collects data from:
  - Site Crawler (httpx + BeautifulSoup) — no API key
  - Google PageSpeed Insights API — GOOGLE_API_KEY
  - Google Search Console API — GSC service account JSON
  - Backlink Provider (auto-detected from env vars):
      → DataForSEO  (DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD)
      → Semrush     (SEMRUSH_API_KEY)
      → Ahrefs      (AHREFS_API_KEY)

Each service gracefully degrades if credentials are missing,
returning an error dict instead of crashing.
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

from rich.console import Console

from src.seo_agents.services.crawler import crawl_site
from src.seo_agents.services.pagespeed import get_core_web_vitals
from src.seo_agents.services.search_console import get_search_analytics

# Import all three backlink providers
from src.seo_agents.services import dataforseo as dfs_service
from src.seo_agents.services import semrush as semrush_service
from src.seo_agents.services import ahrefs as ahrefs_service

console = Console()


# ── Backlink Provider Detection ─────────────────────────────────────────────


def _detect_backlink_provider() -> str | None:
    """Auto-detect which backlink API provider has valid credentials.

    Checks env vars in this priority order:
      1. DataForSEO (cheapest, most developer-friendly)
      2. Semrush    (mid-tier, requires Business plan)
      3. Ahrefs     (premium, requires Enterprise plan)

    Returns:
        Provider name string or None if no credentials found.
    """
    if os.getenv("DATAFORSEO_LOGIN") and os.getenv("DATAFORSEO_PASSWORD"):
        return "dataforseo"
    if os.getenv("SEMRUSH_API_KEY"):
        return "semrush"
    if os.getenv("AHREFS_API_KEY"):
        return "ahrefs"
    return None


def _get_backlink_functions(provider: str | None):
    """Return the (get_backlink_profile, get_competitor_backlink_gap) functions
    for the detected provider.

    Returns:
        Tuple of (profile_fn, gap_fn) or (None, None) if no provider.
    """
    if provider == "dataforseo":
        return dfs_service.get_backlink_profile, dfs_service.get_competitor_backlink_gap
    elif provider == "semrush":
        return semrush_service.get_backlink_profile, semrush_service.get_competitor_backlink_gap
    elif provider == "ahrefs":
        return ahrefs_service.get_backlink_profile, ahrefs_service.get_competitor_backlink_gap
    return None, None


# ── Domain Helper ───────────────────────────────────────────────────────────


def _extract_domain(url: str) -> str:
    """Extract bare domain from a URL (e.g., 'example.com')."""
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    return domain.replace("www.", "")


# ── Data Collection Functions ───────────────────────────────────────────────


def get_crawl_data(website_url: str, max_pages: int = 50) -> dict:
    """Crawl the website and collect technical SEO data.

    Services used:
      1. Site Crawler (built-in, no API key) — broken pages, schema, links
      2. Google PageSpeed Insights API — Core Web Vitals

    Args:
        website_url: Target website URL.
        max_pages: Max pages to crawl.

    Returns:
        Combined crawl + PageSpeed data dict.
    """
    console.print("\n[bold blue]📡 Collecting Technical Data...[/bold blue]")

    # 1. Crawl the site
    crawl_results = crawl_site(website_url, max_pages=max_pages)

    # 2. Get Core Web Vitals for the homepage
    pagespeed_data = get_core_web_vitals(website_url)

    # 3. Also get CWV for a few key pages if we found them
    additional_vitals = []
    important_pages = crawl_results.get("all_pages", [])[:3]
    for page in important_pages:
        if page["url"] != website_url:
            vitals = get_core_web_vitals(page["url"])
            additional_vitals.append(vitals)

    crawl_results["core_web_vitals"] = {
        "homepage": pagespeed_data,
        "key_pages": additional_vitals,
    }

    return crawl_results


def get_analytics_data(website_url: str) -> dict:
    """Fetch search analytics data from Google Search Console.

    Services used:
      - Google Search Console API (OAuth2 service account)

    Args:
        website_url: Target website URL (must be a verified property in GSC).

    Returns:
        Analytics data dict with rankings, CTR, decay, cannibalization.
    """
    console.print("\n[bold magenta]📡 Collecting On-Page Analytics Data...[/bold magenta]")

    gsc_data = get_search_analytics(website_url)
    return gsc_data


def get_backlink_data(website_url: str, competitors: list[str] | None = None) -> dict:
    """Fetch backlink profile and competitor gap data.

    Auto-detects which provider to use based on available credentials:
      Priority: DataForSEO → Semrush → Ahrefs

    Args:
        website_url: Target website URL.
        competitors: Optional list of competitor domain URLs.

    Returns:
        Backlink data dict with profile, toxic links, and competitor gaps.
    """
    console.print("\n[bold yellow]📡 Collecting Off-Page Backlink Data...[/bold yellow]")

    provider = _detect_backlink_provider()

    if not provider:
        console.print(
            "  [yellow]⚠️  No backlink API configured. Set one of:[/yellow]\n"
            "     • DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD  (cheapest: ~$0.002/task)\n"
            "     • SEMRUSH_API_KEY                         (requires Business plan)\n"
            "     • AHREFS_API_KEY                          (requires Enterprise plan)"
        )
        return {
            "domain": _extract_domain(website_url),
            "profile": {
                "error": "No backlink provider configured.",
                "data_available": False,
            },
            "competitor_gap": {"data_available": False},
        }

    console.print(f"  [cyan]Using backlink provider: {provider.upper()}[/cyan]")

    profile_fn, gap_fn = _get_backlink_functions(provider)
    domain = _extract_domain(website_url)

    # 1. Get backlink profile
    profile = profile_fn(domain)

    # 2. Get competitor gap analysis
    gap_data = {"data_available": False, "note": "No competitors specified."}
    if competitors and gap_fn:
        comp_domains = [_extract_domain(c) for c in competitors]
        gap_data = gap_fn(domain, comp_domains)

    return {
        "domain": domain,
        "provider": provider,
        "profile": profile,
        "competitor_gap": gap_data,
    }


def get_all_seo_data(
    website_url: str,
    max_pages: int = 50,
    competitors: list[str] | None = None,
) -> dict:
    """Gather all SEO data from all real services.

    This is the main entry point that collects data from:
      1. Site Crawler + PageSpeed Insights → crawl_data
      2. Google Search Console → analytics_data
      3. DataForSEO / Semrush / Ahrefs → backlink_data

    Args:
        website_url: Target website URL.
        max_pages: Max pages to crawl.
        competitors: Optional competitor domains for gap analysis.

    Returns:
        Dict with all three data payloads keyed by type.
    """
    return {
        "crawl_data": get_crawl_data(website_url, max_pages=max_pages),
        "analytics_data": get_analytics_data(website_url),
        "backlink_data": get_backlink_data(website_url, competitors=competitors),
    }
