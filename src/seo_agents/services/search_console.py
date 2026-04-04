"""
Google Search Console Service — Rankings, CTR, Impressions data.

Uses the Google Search Console API to fetch real keyword performance data:
  - Keyword rankings & positions
  - Click-Through Rate (CTR)
  - Impressions & clicks
  - Indexation status

Authentication: OAuth2 Service Account (JSON credentials file)
  - Set GSC_CREDENTIALS_PATH in .env to your service account JSON file
  - The service account must be added as a user in Search Console
Free tier: Unlimited (it's a free Google API)
Docs: https://developers.google.com/webmaster-tools/v1/api_reference
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build
from rich.console import Console

console = Console()

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def _get_gsc_service(credentials_path: str | None = None):
    """Build an authenticated Search Console API service."""
    creds_path = credentials_path or os.getenv("GSC_CREDENTIALS_PATH", "")
    if not creds_path or not os.path.exists(creds_path):
        return None

    credentials = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    service = build("searchconsole", "v1", credentials=credentials)
    return service


def get_search_analytics(
    website_url: str,
    days: int = 30,
    credentials_path: str | None = None,
) -> dict:
    """Fetch search analytics data from Google Search Console.

    Args:
        website_url: The site property URL (must be verified in GSC).
        days: Number of days to look back.
        credentials_path: Path to service account JSON file.

    Returns:
        Dict with keyword performance, CTR data, and page analytics.
    """
    service = _get_gsc_service(credentials_path)
    if not service:
        return {
            "error": "GSC_CREDENTIALS_PATH not set or file not found. "
            "Skipping Search Console data.",
            "website": website_url,
            "data_available": False,
        }

    # Normalize the site URL for GSC (needs to match the property)
    site_url = website_url.rstrip("/") + "/"
    if not site_url.startswith("sc-domain:") and not site_url.startswith("http"):
        site_url = f"https://{site_url}"

    end_date = datetime.now() - timedelta(days=3)  # GSC has ~3 day delay
    start_date = end_date - timedelta(days=days)
    prev_start = start_date - timedelta(days=days)
    prev_end = start_date - timedelta(days=1)

    date_fmt = "%Y-%m-%d"

    console.print(f"  [dim]Fetching Search Console data for {website_url}...[/dim]")

    try:
        # ── Current period: Page + Query data ───────────────────────────
        page_query_request = {
            "startDate": start_date.strftime(date_fmt),
            "endDate": end_date.strftime(date_fmt),
            "dimensions": ["page", "query"],
            "rowLimit": 200,
            "startRow": 0,
        }
        response = (
            service.searchanalytics()
            .query(siteUrl=site_url, body=page_query_request)
            .execute()
        )
        current_rows = response.get("rows", [])

        # ── Previous period: Page + Query data (for comparison) ─────────
        prev_request = {
            "startDate": prev_start.strftime(date_fmt),
            "endDate": prev_end.strftime(date_fmt),
            "dimensions": ["page", "query"],
            "rowLimit": 200,
            "startRow": 0,
        }
        prev_response = (
            service.searchanalytics()
            .query(siteUrl=site_url, body=prev_request)
            .execute()
        )
        prev_rows = prev_response.get("rows", [])

        # ── Build previous period lookup ────────────────────────────────
        prev_lookup = {}
        for row in prev_rows:
            key = tuple(row.get("keys", []))
            prev_lookup[key] = {
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": row.get("ctr", 0),
                "position": row.get("position", 0),
            }

        # ── Process current data ────────────────────────────────────────
        pages_data = {}
        keyword_data = []

        for row in current_rows:
            keys = row.get("keys", [])
            if len(keys) < 2:
                continue

            page, query = keys[0], keys[1]
            clicks = row.get("clicks", 0)
            impressions = row.get("impressions", 0)
            ctr = row.get("ctr", 0)
            position = row.get("position", 0)

            prev = prev_lookup.get((page, query), {})

            entry = {
                "page": page,
                "query": query,
                "clicks": clicks,
                "impressions": impressions,
                "ctr": round(ctr * 100, 2),
                "position": round(position, 1),
                "prev_clicks": prev.get("clicks", 0),
                "prev_impressions": prev.get("impressions", 0),
                "prev_ctr": round(prev.get("ctr", 0) * 100, 2),
                "prev_position": round(prev.get("position", 0), 1),
                "click_change_pct": _pct_change(prev.get("clicks", 0), clicks),
                "position_change": round(
                    prev.get("position", 0) - position, 1
                ) if prev.get("position") else 0,
            }
            keyword_data.append(entry)

            # Aggregate by page
            if page not in pages_data:
                pages_data[page] = {
                    "url": page,
                    "total_clicks": 0,
                    "total_impressions": 0,
                    "prev_total_clicks": 0,
                    "keywords": [],
                }
            pages_data[page]["total_clicks"] += clicks
            pages_data[page]["total_impressions"] += impressions
            pages_data[page]["prev_total_clicks"] += prev.get("clicks", 0)
            pages_data[page]["keywords"].append(query)

        # ── Identify decaying pages (>20% traffic drop) ─────────────────
        decaying_pages = []
        for url, pdata in pages_data.items():
            if pdata["prev_total_clicks"] > 10:  # Minimum traffic threshold
                change = _pct_change(
                    pdata["prev_total_clicks"], pdata["total_clicks"]
                )
                if change < -20:
                    decaying_pages.append({
                        "url": url,
                        "clicks_current": pdata["total_clicks"],
                        "clicks_previous": pdata["prev_total_clicks"],
                        "change_pct": round(change, 1),
                        "keywords": pdata["keywords"][:5],
                    })

        # ── Identify keyword cannibalization ─────────────────────────────
        query_to_pages: dict[str, list] = {}
        for entry in keyword_data:
            q = entry["query"]
            if q not in query_to_pages:
                query_to_pages[q] = []
            query_to_pages[q].append({
                "page": entry["page"],
                "position": entry["position"],
                "clicks": entry["clicks"],
            })

        cannibalization = []
        for query, pages in query_to_pages.items():
            if len(pages) >= 2:
                # Multiple pages ranking for same keyword
                pages_sorted = sorted(pages, key=lambda x: x["position"])
                cannibalization.append({
                    "keyword": query,
                    "competing_pages": pages_sorted[:3],
                })

        # ── Identify low-CTR opportunities ──────────────────────────────
        low_ctr_pages = [
            entry for entry in keyword_data
            if entry["position"] <= 10
            and entry["impressions"] >= 100
            and entry["ctr"] < 3.0
        ]
        low_ctr_pages.sort(key=lambda x: x["impressions"], reverse=True)

        total_clicks = sum(r.get("clicks", 0) for r in current_rows)
        total_impressions = sum(r.get("impressions", 0) for r in current_rows)

        console.print(
            f"  [dim green]GSC: {len(current_rows)} keyword-page pairs, "
            f"{total_clicks} clicks, {len(decaying_pages)} decaying pages[/dim green]"
        )

        return {
            "website": website_url,
            "data_available": True,
            "period": f"{start_date.strftime(date_fmt)} to {end_date.strftime(date_fmt)}",
            "totals": {
                "clicks": total_clicks,
                "impressions": total_impressions,
                "avg_ctr": round(
                    (total_clicks / max(total_impressions, 1)) * 100, 2
                ),
            },
            "decaying_pages": decaying_pages[:10],
            "cannibalization": cannibalization[:10],
            "low_ctr_pages": low_ctr_pages[:10],
            "top_keywords": sorted(
                keyword_data, key=lambda x: x["clicks"], reverse=True
            )[:20],
        }

    except Exception as e:
        console.print(f"  [dim red]GSC Error: {e}[/dim red]")
        return {
            "error": str(e),
            "website": website_url,
            "data_available": False,
        }


def _pct_change(old: float, new: float) -> float:
    """Calculate percentage change, handling zero division."""
    if old == 0:
        return 100.0 if new > 0 else 0.0
    return round(((new - old) / old) * 100, 1)
