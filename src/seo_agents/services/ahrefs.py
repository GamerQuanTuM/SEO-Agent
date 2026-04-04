"""
Ahrefs API v3 Service — Backlink profiles, referring domains, competitor gaps.

Uses the Ahrefs API v3 (Site Explorer) for off-page SEO data:
  - Backlink overview (domain rating, total backlinks, referring domains)
  - Referring domains with domain rating scores
  - Competitor backlink intersection analysis

Authentication: Bearer Token (Authorization header)
Required Plan: Enterprise ($1,499/month) — API access requires Enterprise tier
Pricing: API unit-based (min 50 units per request)
Rate Limit: 60 requests/minute
Docs: https://docs.ahrefs.com/docs/api/reference/introduction
"""

from __future__ import annotations

import os

import httpx
from rich.console import Console

console = Console()

AHREFS_API_URL = "https://api.ahrefs.com/v3/site-explorer"


def _get_auth_header() -> dict | None:
    """Build Bearer token header from env."""
    token = os.getenv("AHREFS_API_KEY", "")
    if not token:
        return None
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def get_backlink_profile(target_domain: str) -> dict:
    """Fetch backlink profile for a domain via Ahrefs API v3.

    Args:
        target_domain: The domain to analyze (e.g., "example.com").

    Returns:
        Dict with backlink summary, referring domains, and toxicity indicators.
    """
    headers = _get_auth_header()
    if not headers:
        return {
            "error": "AHREFS_API_KEY not set. Skipping Ahrefs backlink data.",
            "domain": target_domain,
            "data_available": False,
        }

    console.print(f"  [dim]Fetching Ahrefs backlink data for {target_domain}...[/dim]")

    try:
        with httpx.Client(timeout=30.0, headers=headers) as client:
            # ── Domain Overview (metrics) ───────────────────────────────
            overview_params = {
                "target": target_domain,
                "mode": "domain",
                "select": (
                    "domain_rating,backlinks,refdomains,refdomains_dofollow,"
                    "refdomains_nofollow,refips,refsubnets,"
                    "backlinks_dofollow,backlinks_nofollow"
                ),
            }
            overview_resp = client.get(
                f"{AHREFS_API_URL}/overview", params=overview_params
            )
            overview_resp.raise_for_status()
            overview_data = overview_resp.json()

            metrics = overview_data.get("metrics", {})
            summary = {
                "domain_rating": metrics.get("domain_rating", 0),
                "total_backlinks": metrics.get("backlinks", 0),
                "referring_domains": metrics.get("refdomains", 0),
                "referring_domains_dofollow": metrics.get("refdomains_dofollow", 0),
                "referring_domains_nofollow": metrics.get("refdomains_nofollow", 0),
                "referring_ips": metrics.get("refips", 0),
                "referring_subnets": metrics.get("refsubnets", 0),
                "dofollow_backlinks": metrics.get("backlinks_dofollow", 0),
                "nofollow_backlinks": metrics.get("backlinks_nofollow", 0),
            }

            # ── Referring Domains ───────────────────────────────────────
            console.print("  [dim]Fetching Ahrefs referring domains...[/dim]")
            ref_params = {
                "target": target_domain,
                "mode": "domain",
                "limit": 100,
                "select": "domain,domain_rating,backlinks,first_seen,traffic",
                "order_by": "domain_rating:desc",
            }
            ref_resp = client.get(
                f"{AHREFS_API_URL}/refdomains", params=ref_params
            )
            ref_resp.raise_for_status()
            ref_data = ref_resp.json()

            referring_domains = []
            toxic_domains = []
            for item in ref_data.get("refdomains", []):
                domain_info = {
                    "domain": item.get("domain", ""),
                    "domain_rating": item.get("domain_rating", 0),
                    "backlinks": item.get("backlinks", 0),
                    "first_seen": item.get("first_seen", ""),
                    "traffic": item.get("traffic", 0),
                }
                referring_domains.append(domain_info)

                # Ahrefs doesn't provide a spam score directly, but very low
                # DR with high link count is a toxicity signal
                if domain_info["domain_rating"] <= 5 and domain_info["backlinks"] > 5:
                    domain_info["toxicity_reason"] = (
                        f"Very low DR ({domain_info['domain_rating']}) "
                        f"with {domain_info['backlinks']} links — potential spam"
                    )
                    toxic_domains.append(domain_info)

            # ── Backlink Velocity (new/lost referring domains) ──────────
            console.print("  [dim]Fetching Ahrefs backlink velocity...[/dim]")
            velocity = {"data_available": False}
            try:
                history_params = {
                    "target": target_domain,
                    "mode": "domain",
                    "history_grouping": "monthly",
                }
                hist_resp = client.get(
                    f"{AHREFS_API_URL}/refdomains-history", params=history_params
                )
                hist_resp.raise_for_status()
                hist_data = hist_resp.json()

                history_items = hist_data.get("refdomains_history", [])
                if len(history_items) >= 2:
                    latest = history_items[-1]
                    previous = history_items[-2]
                    velocity = {
                        "data_available": True,
                        "latest_refdomains": latest.get("refdomains", 0),
                        "previous_refdomains": previous.get("refdomains", 0),
                        "net_change": (
                            latest.get("refdomains", 0) - previous.get("refdomains", 0)
                        ),
                    }
            except Exception:
                velocity = {"data_available": False}

            console.print(
                f"  [dim green]Ahrefs: DR {summary.get('domain_rating', 0)}, "
                f"{summary.get('total_backlinks', 0)} backlinks, "
                f"{summary.get('referring_domains', 0)} referring domains[/dim green]"
            )

            return {
                "domain": target_domain,
                "data_available": True,
                "provider": "ahrefs",
                "summary": summary,
                "toxic_domains": toxic_domains[:15],
                "top_referring_domains": referring_domains[:20],
                "velocity": velocity,
            }

    except httpx.HTTPStatusError as e:
        return {
            "error": f"Ahrefs HTTP {e.response.status_code}: {e.response.text[:200]}",
            "domain": target_domain,
            "data_available": False,
        }
    except Exception as e:
        return {"error": str(e), "domain": target_domain, "data_available": False}


def get_competitor_backlink_gap(
    target_domain: str,
    competitor_domains: list[str],
) -> dict:
    """Find referring domains linking to competitors but not the target.

    Uses Ahrefs' link intersect concept by comparing referring domain lists.

    Args:
        target_domain: The client's domain.
        competitor_domains: List of competitor domains (max 3).

    Returns:
        Dict with link gap opportunities.
    """
    headers = _get_auth_header()
    if not headers:
        return {
            "error": "AHREFS_API_KEY not set.",
            "data_available": False,
        }

    console.print(
        f"  [dim]Running Ahrefs competitor gap: "
        f"{target_domain} vs {competitor_domains}...[/dim]"
    )

    try:
        with httpx.Client(timeout=30.0, headers=headers) as client:
            # Get target's referring domains
            target_params = {
                "target": target_domain,
                "mode": "domain",
                "limit": 1000,
                "select": "domain",
            }
            target_resp = client.get(
                f"{AHREFS_API_URL}/refdomains", params=target_params
            )
            target_resp.raise_for_status()
            target_data = target_resp.json()
            target_domains_set = {
                item.get("domain", "")
                for item in target_data.get("refdomains", [])
            }

            # Get each competitor's referring domains and find gaps
            link_gaps = []
            for comp in competitor_domains[:3]:
                comp_params = {
                    "target": comp,
                    "mode": "domain",
                    "limit": 100,
                    "select": "domain,domain_rating,backlinks,traffic",
                    "order_by": "domain_rating:desc",
                }
                comp_resp = client.get(
                    f"{AHREFS_API_URL}/refdomains", params=comp_params
                )
                comp_resp.raise_for_status()
                comp_data = comp_resp.json()

                for item in comp_data.get("refdomains", []):
                    ref_domain = item.get("domain", "")
                    if ref_domain and ref_domain not in target_domains_set:
                        link_gaps.append({
                            "referring_domain": ref_domain,
                            "domain_rating": item.get("domain_rating", 0),
                            "backlinks_to_competitor": item.get("backlinks", 0),
                            "traffic": item.get("traffic", 0),
                            "competitor": comp,
                        })

            # Deduplicate and sort by DR
            seen = set()
            unique_gaps = []
            for gap in sorted(link_gaps, key=lambda x: x["domain_rating"], reverse=True):
                if gap["referring_domain"] not in seen:
                    seen.add(gap["referring_domain"])
                    unique_gaps.append(gap)

            console.print(
                f"  [dim green]Ahrefs: Found {len(unique_gaps)} link gap opportunities[/dim green]"
            )

            return {
                "target_domain": target_domain,
                "competitors": competitor_domains,
                "data_available": True,
                "link_gaps": unique_gaps[:15],
            }

    except httpx.HTTPStatusError as e:
        return {
            "error": f"Ahrefs HTTP {e.response.status_code}: {e.response.text[:200]}",
            "data_available": False,
        }
    except Exception as e:
        return {"error": str(e), "data_available": False}
