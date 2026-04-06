"""
Content Generator Agent — The SEO Content Writer.

Reads the findings from all three analyst agents (Technical, On-Page, Off-Page)
and produces ready-to-deploy SEO content that directly addresses the issues found:
  - Refreshed page copy for decaying content
  - Optimized title tags and meta descriptions
  - Blog post drafts targeting competitor gap keywords
  - Fixed JSON-LD schema markup
  - Internal linking anchor text suggestions
  - Outreach email drafts for link building

This agent sits AFTER the 3 analysts in the graph, consuming their reports
before the Supervisor synthesizes the final executive summary.
"""

from __future__ import annotations

from langchain_core.messages import SystemMessage, HumanMessage

from src.seo_agents.prompts import CONTENT_GENERATOR_PROMPT
from src.seo_agents.state import AgentState


def content_generator_node(state: AgentState, llm) -> dict:
    """LangGraph node: generates SEO content based on all 3 audit reports.

    Args:
        state: The shared graph state containing the 3 specialist reports.
        llm: The initialized LLM instance (Gemini).

    Returns:
        Partial state update with content_report and appended messages.
    """
    technical_report = state.get("technical_report", "No technical report available.")
    onpage_report = state.get("onpage_report", "No on-page report available.")
    offpage_report = state.get("offpage_report", "No off-page report available.")

    user_message = f"""You have received the complete SEO audit findings for **{state['client_name']}** ({state['website_url']}).
Your job is to generate actual, publishable content that fixes the issues identified.

---

# Technical Agent Findings
{technical_report}

---

# On-Page Agent Findings
{onpage_report}

---

# Off-Page Agent Findings
{offpage_report}

---

Now generate your full Content Package addressing every major issue above.
Be specific — use real URLs, keywords, and data points from the reports.
Every piece of content you produce must be ready to copy-paste and deploy."""

    messages = [
        SystemMessage(
            content=CONTENT_GENERATOR_PROMPT.format(
                client_name=state["client_name"],
                website_url=state["website_url"],
            )
        ),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)

    from src.seo_agents.utils import extract_text

    return {
        "content_report": extract_text(response.content),
        "messages": [
            HumanMessage(content="[Content Generator] SEO content generation requested."),
            response,
        ],
    }
