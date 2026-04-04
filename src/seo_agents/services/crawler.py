"""
Site Crawler Service — Real website crawling using requests + BeautifulSoup.

Crawls a target website to discover:
  - Broken pages (404 errors)
  - Internal link structure (orphaned pages)
  - JSON-LD schema markup issues
  - robots.txt analysis

No API key required — this crawls the site directly via HTTP.
"""

from __future__ import annotations

import json
import re
import time
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from rich.console import Console

console = Console()


def _is_same_domain(base_url: str, check_url: str) -> bool:
    """Check if a URL belongs to the same domain as the base."""
    base_domain = urlparse(base_url).netloc
    check_domain = urlparse(check_url).netloc
    return base_domain == check_domain


def _normalize_url(url: str) -> str:
    """Normalize a URL by removing fragments and trailing slashes."""
    parsed = urlparse(url)
    # Remove fragment, normalize path
    normalized = parsed._replace(fragment="")
    result = normalized.geturl().rstrip("/")
    return result


def crawl_site(
    website_url: str,
    max_pages: int = 50,
    timeout: float = 10.0,
) -> dict:
    """Crawl a website and collect technical SEO data.

    Args:
        website_url: The root URL of the site to crawl.
        max_pages: Maximum number of pages to crawl (keeps demo fast).
        timeout: HTTP request timeout in seconds.

    Returns:
        Dict containing crawl results: broken pages, internal links,
        schema issues, and robots.txt data.
    """
    website_url = website_url.rstrip("/")
    visited: set[str] = set()
    to_visit: list[str] = [website_url]
    broken_pages: list[dict] = []
    all_pages: list[dict] = []
    internal_links: dict[str, list[str]] = {}  # target -> [source pages linking to it]
    schema_issues: list[dict] = []
    status_codes: dict[str, int] = {}

    headers = {
        "User-Agent": "EzydragSEOBot/1.0 (SEO Audit Tool)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    console.print(f"  [dim]Crawling {website_url} (max {max_pages} pages)...[/dim]")

    with httpx.Client(
        headers=headers,
        timeout=timeout,
        follow_redirects=True,
        verify=False,  # Some sites have SSL issues
    ) as client:
        # ── Fetch robots.txt ────────────────────────────────────────────
        robots_txt = ""
        try:
            resp = client.get(f"{website_url}/robots.txt")
            if resp.status_code == 200:
                robots_txt = resp.text
        except Exception:
            robots_txt = "Could not fetch robots.txt"

        # ── Crawl pages ─────────────────────────────────────────────────
        page_count = 0
        while to_visit and page_count < max_pages:
            current_url = _normalize_url(to_visit.pop(0))

            if current_url in visited:
                continue
            visited.add(current_url)

            try:
                resp = client.get(current_url)
                status_codes[current_url] = resp.status_code
                page_count += 1

                if resp.status_code == 404:
                    broken_pages.append({
                        "url": current_url,
                        "status": 404,
                        "inbound_links": internal_links.get(current_url, []),
                        "inbound_link_count": len(internal_links.get(current_url, [])),
                    })
                    continue

                if resp.status_code != 200:
                    continue

                # Only parse HTML responses
                content_type = resp.headers.get("content-type", "")
                if "text/html" not in content_type:
                    continue

                soup = BeautifulSoup(resp.text, "lxml")

                # ── Collect page info ───────────────────────────────────
                title_tag = soup.find("title")
                meta_desc = soup.find("meta", attrs={"name": "description"})
                h1_tags = soup.find_all("h1")

                page_info = {
                    "url": current_url,
                    "status": resp.status_code,
                    "title": title_tag.get_text(strip=True) if title_tag else None,
                    "meta_description": meta_desc.get("content", "") if meta_desc else None,
                    "h1_count": len(h1_tags),
                    "h1_text": [h.get_text(strip=True) for h in h1_tags[:3]],
                    "word_count": len(soup.get_text().split()),
                }
                all_pages.append(page_info)

                # ── Extract and follow internal links ───────────────────
                for link in soup.find_all("a", href=True):
                    href = link["href"]
                    absolute_url = _normalize_url(urljoin(current_url, href))

                    if not _is_same_domain(website_url, absolute_url):
                        continue

                    # Track internal link graph
                    if absolute_url not in internal_links:
                        internal_links[absolute_url] = []
                    internal_links[absolute_url].append(current_url)

                    if absolute_url not in visited:
                        to_visit.append(absolute_url)

                # ── Check JSON-LD Schema Markup ─────────────────────────
                schema_scripts = soup.find_all("script", type="application/ld+json")
                for script in schema_scripts:
                    try:
                        schema_data = json.loads(script.string)
                        # Validate basic required fields
                        _validate_schema(current_url, schema_data, schema_issues)
                    except json.JSONDecodeError as e:
                        schema_issues.append({
                            "page": current_url,
                            "type": "Unknown",
                            "error": f"Invalid JSON-LD syntax: {str(e)}",
                            "severity": "HIGH",
                        })

                # Rate limit to be polite
                time.sleep(0.3)

            except httpx.TimeoutException:
                status_codes[current_url] = 0
                console.print(f"  [dim yellow]Timeout: {current_url}[/dim yellow]")
            except Exception as e:
                status_codes[current_url] = 0
                console.print(f"  [dim red]Error crawling {current_url}: {e}[/dim red]")

    # ── Find orphaned pages (pages with 0 internal links pointing to them) ──
    orphaned_pages = []
    for page in all_pages:
        url = page["url"]
        if url != website_url and len(internal_links.get(url, [])) == 0:
            orphaned_pages.append(page)

    # ── Identify crawl budget waste (low-value URL patterns) ────────────────
    waste_patterns = ["/tag/", "/tags/", "/archive/", "/archives/",
                      "/page/", "/author/", "/category/", "?", "/feed/"]
    wasted_urls = [
        url for url in visited
        if any(pattern in url.lower() for pattern in waste_patterns)
    ]

    console.print(f"  [dim green]Crawled {page_count} pages, "
                  f"found {len(broken_pages)} broken, "
                  f"{len(schema_issues)} schema issues[/dim green]")

    return {
        "website": website_url,
        "total_pages_crawled": page_count,
        "robots_txt": robots_txt,
        "crawl_budget_waste": {
            "wasted_urls": wasted_urls,
            "total_waste_count": len(wasted_urls),
            "total_waste_pct": round(len(wasted_urls) / max(page_count, 1) * 100, 1),
        },
        "broken_pages_404": broken_pages,
        "all_pages": all_pages[:30],  # Limit for LLM context
        "schema_issues": schema_issues,
        "orphaned_pages": orphaned_pages,
        "internal_link_graph_summary": {
            "total_internal_links_found": sum(len(v) for v in internal_links.values()),
            "pages_with_zero_inbound": len(orphaned_pages),
        },
    }


def _validate_schema(page_url: str, schema: dict | list, issues: list) -> None:
    """Validate common JSON-LD schema markup requirements."""
    if isinstance(schema, list):
        for item in schema:
            _validate_schema(page_url, item, issues)
        return

    if not isinstance(schema, dict):
        return

    schema_type = schema.get("@type", "Unknown")

    # Check for missing @context
    if "@context" not in schema:
        issues.append({
            "page": page_url,
            "type": schema_type,
            "error": "Missing '@context' property (should be 'https://schema.org')",
            "severity": "HIGH",
        })

    # Check LocalBusiness requirements
    if schema_type == "LocalBusiness":
        for field in ["name", "address", "telephone"]:
            if field not in schema:
                issues.append({
                    "page": page_url,
                    "type": schema_type,
                    "error": f"Missing required '{field}' property for LocalBusiness",
                    "severity": "HIGH",
                })

    # Check Article requirements
    if schema_type in ("Article", "NewsArticle", "BlogPosting"):
        for field in ["headline", "datePublished", "author"]:
            if field not in schema:
                issues.append({
                    "page": page_url,
                    "type": schema_type,
                    "error": f"Missing required '{field}' property for {schema_type}",
                    "severity": "MEDIUM",
                })
        # Validate date format
        date_pub = schema.get("datePublished", "")
        if date_pub and not re.match(r"\d{4}-\d{2}-\d{2}", str(date_pub)):
            issues.append({
                "page": page_url,
                "type": schema_type,
                "error": f"Invalid 'datePublished' format: '{date_pub}' — should be ISO 8601",
                "severity": "MEDIUM",
            })

    # Check Organization / WebSite
    if schema_type in ("Organization", "WebSite"):
        if "name" not in schema:
            issues.append({
                "page": page_url,
                "type": schema_type,
                "error": f"Missing 'name' property for {schema_type}",
                "severity": "MEDIUM",
            })

    # Check for image/logo URLs that might be broken
    for img_field in ("image", "logo", "thumbnailUrl"):
        img_val = schema.get(img_field)
        if isinstance(img_val, str) and img_val:
            # Just flag potential issues — don't HTTP check from here
            if not img_val.startswith(("http://", "https://")):
                issues.append({
                    "page": page_url,
                    "type": schema_type,
                    "error": f"'{img_field}' URL is not absolute: {img_val}",
                    "severity": "LOW",
                })
