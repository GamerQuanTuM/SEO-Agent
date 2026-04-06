"""
On-Page SEO Agent — The Content Strategist.

Protects organic traffic by monitoring engagement and content relevance.
Handles: Decay detection, cannibalization, CTR optimization, internal linking.
"""

from __future__ import annotations

import json
from langchain_core.messages import SystemMessage, HumanMessage

from src.seo_agents.prompts import ONPAGE_AGENT_PROMPT
from src.seo_agents.state import AgentState


def onpage_agent_node(state: AgentState, llm) -> dict:
    """LangGraph node: runs the On-Page SEO Agent on analytics data.

    Args:
        state: The shared graph state containing raw_data.
        llm: The initialized LLM instance (Gemini).

    Returns:
        Partial state update with onpage_report and appended messages.
    """
    analytics_data = state["raw_data"].get("analytics_data", {})

    user_message = f"""Analyze the following on-page SEO and analytics data for **{state['client_name']}** ({state['website_url']}) and produce your full On-Page Audit Report.

### Raw Analytics & Search Console Data:
```json
{json.dumps(analytics_data, indent=2)}
```

For each finding:
- Quantify the traffic impact (sessions lost, CTR gap, etc.)
- Provide specific, actionable recommendations
- For CTR optimization, generate 3 alternative title tags per page
- For internal linking, specify exact source pages and anchor text"""

    messages = [
        SystemMessage(content=ONPAGE_AGENT_PROMPT),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)

    from src.seo_agents.utils import extract_text

    return {
        "onpage_report": extract_text(response.content),
        "messages": [
            HumanMessage(content="[On-Page Agent] Audit requested."),
            response,
        ],
    }
