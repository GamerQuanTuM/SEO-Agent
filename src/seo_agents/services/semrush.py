"""
Semrush API Service — Backlink profiles, competitor analysis, domain metrics.

Uses the Semrush Analytics API for off-page SEO data:
  - Backlink overview (total backlinks, referring domains)
  - Referring domains list with toxicity indicators
  - Competitor backlink comparison

Authentication: API Key (query parameter)
Required Plan: Business ($499.95/month) — API access requires Business tier
Pricing: API unit-based (units consumed per request)
Docs: https://developer.semrush.com/api/v3/analytics/backlinks/
"""

from __future__ import annotations

import os

import httpx
from rich.console import Console

console = Console()

SEMRUSH_API_URL = "https://api.semrush.com/analytics/v1/"


def _get_api_key() -> str | None:
    """Get Semrush API key from environment."""
    key = os.getenv("SEMRUSH_API_KEY", "")
    return key if key else None


def _parse_semrush_response(text: str) -> list[dict]:
    """Parse Semrush's semicolon-delimited response format into dicts."""
    lines = text.strip().split("\n")
    if len(lines) < 2:
        return []
    headers = lines[0].split(";")
    rows = []
    for line in lines[1:]:
        values = line.split(";")
        if len(values) == len(headers):
            rows.append(dict(zip(headers, values)))
    return rows


def get_backlink_profile(target_domain: str) -> dict:
    """Fetch backlink profile for a domain via Semrush API.

    Args:
        target_domain: The domain to analyze (e.g., "example.com").

    Returns:
        Dict with backlink summary, referring domains, and toxic indicators.
    """
    api_key = _get_api_key()
    if not api_key:
        return {
            "error": "SEMRUSH_API_KEY not set. Skipping Semrush backlink data.",
            "domain": target_domain,
            "data_available": False,
        }

    console.print(f"  [dim]Fetching Semrush backlink data for {target_domain}...[/dim]")

    try:
        with httpx.Client(timeout=30.0) as client:
            # ── Backlink Overview ────────────────────────────────────────
            overview_params = {
                "key": api_key,
                "type": "backlinks_overview",
                "target": target_domain,
                "target_type": "root_domain",
                "export_columns": (
                    "domain_ascore,total,domains_num,urls_num,ips_num,"
                    "follows_num,nofollows_num,texts_num,images_num"
                ),
            }
            overview_resp = client.get(SEMRUSH_API_URL, params=overview_params)
            overview_resp.raise_for_status()
            overview_rows = _parse_semrush_response(overview_resp.text)

            summary = {}
            if overview_rows:
                row = overview_rows[0]
                summary = {
                    "authority_score": int(row.get("domain_ascore", 0)),
                    "total_backlinks": int(row.get("total", 0)),
                    "referring_domains": int(row.get("domains_num", 0)),
                    "referring_ips": int(row.get("ips_num", 0)),
                    "follow_links": int(row.get("follows_num", 0)),
                    "nofollow_links": int(row.get("nofollows_num", 0)),
                    "text_links": int(row.get("texts_num", 0)),
                    "image_links": int(row.get("images_num", 0)),
                }

            # ── Referring Domains ───────────────────────────────────────
            console.print("  [dim]Fetching Semrush referring domains...[/dim]")
            ref_params = {
                "key": api_key,
                "type": "backlinks_refdomains",
                "target": target_domain,
                "target_type": "root_domain",
                "display_limit": 100,
                "display_sort": "domain_score_desc",
                "export_columns": (
                    "domain_prev,domain_score,backlinks_num,first_seen,last_seen"
                ),
            }
            ref_resp = client.get(SEMRUSH_API_URL, params=ref_params)
            ref_resp.raise_for_status()
            ref_rows = _parse_semrush_response(ref_resp.text)

            referring_domains = []
            toxic_domains = []
            for row in ref_rows:
                domain_info = {
                    "domain": row.get("domain_prev", ""),
                    "domain_score": int(row.get("domain_score", 0)),
                    "backlinks": int(row.get("backlinks_num", 0)),
                    "first_seen": row.get("first_seen", ""),
                    "last_seen": row.get("last_seen", ""),
                }
                referring_domains.append(domain_info)

                # Semrush doesn't have a direct spam score in this endpoint,
                # but very low domain scores combined with high link counts
                # are a toxicity signal
                if domain_info["domain_score"] <= 5 and domain_info["backlinks"] > 5:
                    domain_info["toxicity_reason"] = (
                        f"Very low authority (score: {domain_info['domain_score']}) "
                        f"with {domain_info['backlinks']} links — likely spam"
                    )
                    toxic_domains.append(domain_info)

            console.print(
                f"  [dim green]Semrush: {summary.get('total_backlinks', 0)} backlinks, "
                f"{summary.get('referring_domains', 0)} referring domains[/dim green]"
            )

            return {
                "domain": target_domain,
                "data_available": True,
                "provider": "semrush",
                "summary": summary,
                "toxic_domains": toxic_domains[:15],
                "top_referring_domains": referring_domains[:20],
                "velocity": {"data_available": False, "note": "Use Semrush dashboard for velocity trends"},
            }

    except httpx.HTTPStatusError as e:
        return {
            "error": f"Semrush HTTP {e.response.status_code}: {e.response.text[:200]}",
            "domain": target_domain,
            "data_available": False,
        }
    except Exception as e:
        return {"error": str(e), "domain": target_domain, "data_available": False}


def get_competitor_backlink_gap(
    target_domain: str,
    competitor_domains: list[str],
) -> dict:
    """Find referring domains that link to competitors but not to the target.

    Uses Semrush's backlinks_comparison report.

    Args:
        target_domain: The client's domain.
        competitor_domains: List of competitor domains (max 4).

    Returns:
        Dict with link gap opportunities.
    """
    api_key = _get_api_key()
    if not api_key:
        return {
            "error": "SEMRUSH_API_KEY not set.",
            "data_available": False,
        }

    console.print(
        f"  [dim]Running Semrush competitor gap: "
        f"{target_domain} vs {competitor_domains}...[/dim]"
    )

    try:
        with httpx.Client(timeout=30.0) as client:
            # Fetch referring domains for each competitor that don't link to target
            # Semrush doesn't have a direct "intersect" endpoint like DataForSEO,
            # so we compare domain lists
            target_params = {
                "key": api_key,
                "type": "backlinks_refdomains",
                "target": target_domain,
                "target_type": "root_domain",
                "display_limit": 500,
                "export_columns": "domain_prev",
            }
            target_resp = client.get(SEMRUSH_API_URL, params=target_params)
            target_resp.raise_for_status()
            target_domains_set = {
                row.get("domain_prev", "")
                for row in _parse_semrush_response(target_resp.text)
            }

            link_gaps = []
            for comp in competitor_domains[:3]:
                comp_params = {
                    "key": api_key,
                    "type": "backlinks_refdomains",
                    "target": comp,
                    "target_type": "root_domain",
                    "display_limit": 100,
                    "display_sort": "domain_score_desc",
                    "export_columns": "domain_prev,domain_score,backlinks_num",
                }
                comp_resp = client.get(SEMRUSH_API_URL, params=comp_params)
                comp_resp.raise_for_status()
                comp_rows = _parse_semrush_response(comp_resp.text)

                for row in comp_rows:
                    ref_domain = row.get("domain_prev", "")
                    if ref_domain and ref_domain not in target_domains_set:
                        link_gaps.append({
                            "referring_domain": ref_domain,
                            "domain_score": int(row.get("domain_score", 0)),
                            "backlinks_to_competitor": int(row.get("backlinks_num", 0)),
                            "competitor": comp,
                        })

            # Deduplicate and sort by authority
            seen = set()
            unique_gaps = []
            for gap in sorted(link_gaps, key=lambda x: x["domain_score"], reverse=True):
                if gap["referring_domain"] not in seen:
                    seen.add(gap["referring_domain"])
                    unique_gaps.append(gap)

            console.print(
                f"  [dim green]Semrush: Found {len(unique_gaps)} link gap opportunities[/dim green]"
            )

            return {
                "target_domain": target_domain,
                "competitors": competitor_domains,
                "data_available": True,
                "link_gaps": unique_gaps[:15],
            }

    except httpx.HTTPStatusError as e:
        return {
            "error": f"Semrush HTTP {e.response.status_code}: {e.response.text[:200]}",
            "data_available": False,
        }
    except Exception as e:
        return {"error": str(e), "data_available": False}
