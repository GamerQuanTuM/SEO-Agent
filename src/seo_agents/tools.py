"""
SEO Data Collection — Orchestrates real API services.

Replaces all mock data with real API calls to:
  - Site Crawler (httpx + BeautifulSoup) — no API key
  - Google PageSpeed Insights API — GOOGLE_API_KEY
  - Google Search Console API — GSC service account JSON
  - DataForSEO API — login + password

Each service gracefully degrades if credentials are missing,
returning an error dict instead of crashing.
"""

from __future__ import annotations

from urllib.parse import urlparse

from rich.console import Console

from src.seo_agents.services.crawler import crawl_site
from src.seo_agents.services.pagespeed import get_core_web_vitals
from src.seo_agents.services.search_console import get_search_analytics
from src.seo_agents.services.dataforseo import (
    get_backlink_profile,
    get_competitor_backlink_gap,
)

console = Console()


def _extract_domain(url: str) -> str:
    """Extract bare domain from a URL (e.g., 'example.com')."""
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    return domain.replace("www.", "")


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
    """Fetch backlink profile and competitor gap data from DataForSEO.

    Services used:
      - DataForSEO Backlinks API

    Args:
        website_url: Target website URL.
        competitors: Optional list of competitor domain URLs.

    Returns:
        Backlink data dict with profile, toxic links, and competitor gaps.
    """
    console.print("\n[bold yellow]📡 Collecting Off-Page Backlink Data...[/bold yellow]")

    domain = _extract_domain(website_url)

    # 1. Get backlink profile
    profile = get_backlink_profile(domain)

    # 2. Get competitor gap analysis
    gap_data = {"data_available": False, "note": "No competitors specified."}
    if competitors:
        comp_domains = [_extract_domain(c) for c in competitors]
        gap_data = get_competitor_backlink_gap(domain, comp_domains)

    return {
        "domain": domain,
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
      3. DataForSEO → backlink_data

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
