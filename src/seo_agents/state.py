"""
Shared state definition for the LangGraph SEO Agent workflow.

The AgentState is a TypedDict that flows through every node in the graph,
accumulating data and results as each specialized agent processes it.
"""

from __future__ import annotations
from typing import TypedDict, Annotated
import operator


class AgentState(TypedDict):
    """State shared across all agent nodes in the SEO audit graph.

    Attributes:
        website_url: The target website being audited.
        client_name: Name of the client for report labeling.
        raw_data: Dict of raw data payloads keyed by source
                  (e.g. "crawl_data", "analytics_data", "backlink_data").
        technical_report: Markdown output from the Technical Agent.
        onpage_report: Markdown output from the On-Page Agent.
        offpage_report: Markdown output from the Off-Page Agent.
        final_report: Combined executive summary from all agents.
        messages: Accumulated LLM message history (append-only via operator.add).
    """

    website_url: str
    client_name: str
    competitors: list[str]
    max_pages: int
    raw_data: dict
    technical_report: str
    onpage_report: str
    offpage_report: str
    final_report: str
    messages: Annotated[list, operator.add]
