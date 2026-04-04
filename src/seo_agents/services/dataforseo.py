"""
DataForSEO Service — Backlink profiles, competitor analysis, spam scores.

Uses the DataForSEO API for off-page SEO data:
  - Backlink profiles (referring domains, link counts)
  - Spam/toxicity scores
  - Competitor backlink comparison (intersect analysis)
  - Domain authority metrics

Authentication: Login + Password (HTTP Basic Auth)
Pricing: Pay-as-you-go (~$0.002 per task)
Docs: https://docs.dataforseo.com/v3
"""

from __future__ import annotations

import base64
import os

import httpx
from rich.console import Console

console = Console()

DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3"


def _get_auth_header() -> dict | None:
    """Build Basic Auth header from env credentials."""
    login = os.getenv("DATAFORSEO_LOGIN", "")
    password = os.getenv("DATAFORSEO_PASSWORD", "")
    if not login or not password:
        return None

    credentials = base64.b64encode(f"{login}:{password}".encode()).decode()
    return {"Authorization": f"Basic {credentials}"}


def get_backlink_profile(
    target_domain: str,
) -> dict:
    """Fetch backlink profile for a domain via DataForSEO.

    Args:
        target_domain: The domain to analyze (e.g., "example.com").

    Returns:
        Dict with backlink summary, referring domains, and toxic links.
    """
    auth = _get_auth_header()
    if not auth:
        return {
            "error": "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set. "
            "Skipping backlink data.",
            "domain": target_domain,
            "data_available": False,
        }

    console.print(f"  [dim]Fetching backlink summary for {target_domain}...[/dim]")

    try:
        with httpx.Client(timeout=30.0, headers=auth) as client:
            # ── Backlink Summary ────────────────────────────────────────
            summary_payload = [{"target": target_domain, "internal_list_limit": 0}]
            summary_resp = client.post(
                f"{DATAFORSEO_BASE_URL}/backlinks/summary/live",
                json=summary_payload,
            )
            summary_resp.raise_for_status()
            summary_data = summary_resp.json()

            summary_result = {}
            tasks = summary_data.get("tasks", [])
            if tasks and tasks[0].get("result"):
                result = tasks[0]["result"][0]
                summary_result = {
                    "total_backlinks": result.get("backlinks", 0),
                    "referring_domains": result.get("referring_domains", 0),
                    "referring_ips": result.get("referring_ips", 0),
                    "broken_backlinks": result.get("broken_backlinks", 0),
                    "referring_domains_nofollow": result.get("referring_domains_nofollow", 0),
                    "backlinks_spam_score": result.get("backlinks_spam_score", 0),
                    "rank": result.get("rank", 0),
                }

            # ── Referring Domains (to find toxic ones) ──────────────────
            console.print("  [dim]Fetching referring domains...[/dim]")
            ref_payload = [{
                "target": target_domain,
                "limit": 100,
                "order_by": ["backlink_spam_score,desc"],  # Toxic first
            }]
            ref_resp = client.post(
                f"{DATAFORSEO_BASE_URL}/backlinks/referring_domains/live",
                json=ref_payload,
            )
            ref_resp.raise_for_status()
            ref_data = ref_resp.json()

            referring_domains = []
            toxic_domains = []
            ref_tasks = ref_data.get("tasks", [])
            if ref_tasks and ref_tasks[0].get("result"):
                items = ref_tasks[0]["result"][0].get("items", [])
                for item in items:
                    domain_info = {
                        "domain": item.get("domain", ""),
                        "backlinks": item.get("backlinks", 0),
                        "rank": item.get("rank", 0),
                        "backlink_spam_score": item.get("backlink_spam_score", 0),
                        "first_seen": item.get("first_seen", ""),
                        "is_broken": item.get("broken_backlinks", 0) > 0,
                    }
                    referring_domains.append(domain_info)

                    # Flag toxic domains (spam score > 60)
                    if item.get("backlink_spam_score", 0) > 60:
                        toxic_domains.append(domain_info)

            # ── New vs Lost backlinks (velocity) ────────────────────────
            console.print("  [dim]Fetching backlink velocity...[/dim]")
            history_payload = [{
                "target": target_domain,
                "date_from": None,  # API will use default range
            }]

            try:
                hist_resp = client.post(
                    f"{DATAFORSEO_BASE_URL}/backlinks/history/live",
                    json=history_payload,
                )
                hist_resp.raise_for_status()
                hist_data = hist_resp.json()

                velocity = {"data_available": False}
                hist_tasks = hist_data.get("tasks", [])
                if hist_tasks and hist_tasks[0].get("result"):
                    items = hist_tasks[0]["result"][0].get("items", [])
                    if items and len(items) >= 2:
                        latest = items[-1]
                        previous = items[-2] if len(items) >= 2 else items[-1]
                        velocity = {
                            "data_available": True,
                            "new_backlinks": latest.get("new_backlinks", 0),
                            "lost_backlinks": latest.get("lost_backlinks", 0),
                            "cumulative_new": latest.get("backlinks", 0),
                            "prev_cumulative": previous.get("backlinks", 0),
                        }
            except Exception:
                velocity = {"data_available": False}

            console.print(
                f"  [dim green]DataForSEO: {summary_result.get('total_backlinks', 0)} backlinks, "
                f"{len(toxic_domains)} toxic domains[/dim green]"
            )

            return {
                "domain": target_domain,
                "data_available": True,
                "summary": summary_result,
                "toxic_domains": toxic_domains[:15],
                "top_referring_domains": referring_domains[:20],
                "velocity": velocity,
            }

    except httpx.HTTPStatusError as e:
        return {
            "error": f"HTTP {e.response.status_code}: {e.response.text[:200]}",
            "domain": target_domain,
            "data_available": False,
        }
    except Exception as e:
        return {"error": str(e), "domain": target_domain, "data_available": False}


def get_competitor_backlink_gap(
    target_domain: str,
    competitor_domains: list[str],
) -> dict:
    """Find backlink gaps — domains linking to competitors but not the target.

    Args:
        target_domain: The client's domain.
        competitor_domains: List of competitor domains to compare against.

    Returns:
        Dict with link gap opportunities.
    """
    auth = _get_auth_header()
    if not auth:
        return {
            "error": "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set.",
            "data_available": False,
        }

    console.print(
        f"  [dim]Running competitor intersect analysis: "
        f"{target_domain} vs {competitor_domains}...[/dim]"
    )

    try:
        with httpx.Client(timeout=30.0, headers=auth) as client:
            # Backlinks Competitors (Intersect)
            targets = {target_domain: {"is_intersect": True}}
            for comp in competitor_domains[:3]:  # Max 3 competitors
                targets[comp] = {"is_intersect": True}

            intersect_payload = [{
                "targets": targets,
                "limit": 50,
                "order_by": ["rank,desc"],
                "exclude_targets": [target_domain],  # Show domains NOT linking to us
            }]

            resp = client.post(
                f"{DATAFORSEO_BASE_URL}/backlinks/competitors/live",
                json=intersect_payload,
            )
            resp.raise_for_status()
            data = resp.json()

            link_gaps = []
            tasks = data.get("tasks", [])
            if tasks and tasks[0].get("result"):
                items = tasks[0]["result"][0].get("items", [])
                for item in items:
                    gap_entry = {
                        "referring_domain": item.get("domain", ""),
                        "rank": item.get("rank", 0),
                        "backlinks_to_competitors": item.get("backlinks", 0),
                        "links_to": [
                            k for k, v in item.get("intersections", {}).items()
                            if v and k != target_domain
                        ],
                    }
                    link_gaps.append(gap_entry)

            console.print(
                f"  [dim green]Found {len(link_gaps)} link gap opportunities[/dim green]"
            )

            return {
                "target_domain": target_domain,
                "competitors": competitor_domains,
                "data_available": True,
                "link_gaps": link_gaps[:15],
            }

    except httpx.HTTPStatusError as e:
        return {
            "error": f"HTTP {e.response.status_code}: {e.response.text[:200]}",
            "data_available": False,
        }
    except Exception as e:
        return {"error": str(e), "data_available": False}
