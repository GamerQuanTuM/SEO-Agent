"""
Google PageSpeed Insights Service — Core Web Vitals data.

Uses the free Google PageSpeed Insights API to fetch real
Largest Contentful Paint (LCP), First Input Delay (FID/INP),
and Cumulative Layout Shift (CLS) data for any URL.

API Key: GOOGLE_API_KEY (same key works for PageSpeed + Gemini)
Free tier: 25,000 requests/day
Docs: https://developers.google.com/speed/docs/insights/v5/get-started
"""

from __future__ import annotations

import os

import httpx
from rich.console import Console

console = Console()

PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


def get_core_web_vitals(
    url: str,
    strategy: str = "mobile",
    api_key: str | None = None,
) -> dict:
    """Fetch Core Web Vitals for a single URL via PageSpeed Insights API.

    Args:
        url: The page URL to analyze.
        strategy: "mobile" or "desktop".
        api_key: Google API key (falls back to GOOGLE_API_KEY env var).

    Returns:
        Dict with LCP, FID/INP, CLS scores and performance details.
    """
    api_key = api_key or os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not set", "url": url}

    params = {
        "url": url,
        "key": api_key,
        "strategy": strategy,
        "category": "performance",
    }

    console.print(f"  [dim]Fetching PageSpeed data for {url} ({strategy})...[/dim]")

    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(PAGESPEED_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        # ── Extract Lighthouse metrics ──────────────────────────────
        lighthouse = data.get("lighthouseResult", {})
        audits = lighthouse.get("audits", {})
        categories = lighthouse.get("categories", {})

        performance_score = categories.get("performance", {}).get("score", 0)
        performance_score = round(performance_score * 100) if performance_score else 0

        # Core Web Vitals from audits
        lcp = audits.get("largest-contentful-paint", {})
        fid = audits.get("max-potential-fid", {})
        inp = audits.get("interaction-to-next-paint", {})
        cls = audits.get("cumulative-layout-shift", {})
        fcp = audits.get("first-contentful-paint", {})
        tbt = audits.get("total-blocking-time", {})
        si = audits.get("speed-index", {})

        # ── Extract performance opportunities ───────────────────────
        opportunities = []
        for audit_key, audit_val in audits.items():
            if (
                isinstance(audit_val, dict)
                and audit_val.get("score") is not None
                and audit_val.get("score", 1) < 0.9
                and audit_val.get("details", {}).get("type") == "opportunity"
            ):
                opportunities.append({
                    "title": audit_val.get("title", audit_key),
                    "description": audit_val.get("description", ""),
                    "savings_ms": audit_val.get("details", {}).get(
                        "overallSavingsMs", 0
                    ),
                    "savings_bytes": audit_val.get("details", {}).get(
                        "overallSavingsBytes", 0
                    ),
                })

        # Sort by potential savings
        opportunities.sort(key=lambda x: x.get("savings_ms", 0), reverse=True)

        # ── Extract diagnostics ─────────────────────────────────────
        diagnostics = []
        for audit_key, audit_val in audits.items():
            if (
                isinstance(audit_val, dict)
                and audit_val.get("score") is not None
                and audit_val.get("score", 1) < 0.9
                and audit_val.get("details", {}).get("type") == "table"
            ):
                diagnostics.append({
                    "title": audit_val.get("title", audit_key),
                    "description": audit_val.get("description", ""),
                })

        def _extract_metric(audit_data: dict) -> dict:
            return {
                "score": audit_data.get("score", None),
                "value": audit_data.get("displayValue", "N/A"),
                "numeric_value": audit_data.get("numericValue", None),
            }

        result = {
            "url": url,
            "strategy": strategy,
            "performance_score": performance_score,
            "core_web_vitals": {
                "lcp": _extract_metric(lcp),
                "fid": _extract_metric(fid),
                "inp": _extract_metric(inp),
                "cls": _extract_metric(cls),
                "fcp": _extract_metric(fcp),
                "tbt": _extract_metric(tbt),
                "speed_index": _extract_metric(si),
            },
            "opportunities": opportunities[:5],  # Top 5 opportunities
            "diagnostics": diagnostics[:5],
        }

        console.print(
            f"  [dim green]PageSpeed score: {performance_score}/100 for {url}[/dim green]"
        )
        return result

    except httpx.HTTPStatusError as e:
        return {"error": f"HTTP {e.response.status_code}: {e.response.text[:200]}", "url": url}
    except Exception as e:
        return {"error": str(e), "url": url}


def get_web_vitals_for_pages(
    urls: list[str],
    strategy: str = "mobile",
    api_key: str | None = None,
) -> list[dict]:
    """Fetch Core Web Vitals for multiple pages.

    Args:
        urls: List of page URLs to analyze.
        strategy: "mobile" or "desktop".
        api_key: Google API key.

    Returns:
        List of PageSpeed result dicts.
    """
    results = []
    for url in urls:
        result = get_core_web_vitals(url, strategy=strategy, api_key=api_key)
        results.append(result)
    return results
