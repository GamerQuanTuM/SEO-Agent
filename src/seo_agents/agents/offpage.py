"""
Off-Page SEO Agent — The Network Security & PR Bot.

Defends the domain from toxic links and automates digital PR outreach.
Handles: Toxic link detection, competitor gap analysis, outreach drafting.
"""

from __future__ import annotations

import json
from langchain_core.messages import SystemMessage, HumanMessage

from src.seo_agents.prompts import OFFPAGE_AGENT_PROMPT
from src.seo_agents.state import AgentState


def offpage_agent_node(state: AgentState, llm) -> dict:
    """LangGraph node: runs the Off-Page SEO Agent on backlink data.

    Args:
        state: The shared graph state containing raw_data.
        llm: The initialized LLM instance (Gemini).

    Returns:
        Partial state update with offpage_report and appended messages.
    """
    backlink_data = state["raw_data"].get("backlink_data", {})

    user_message = f"""Analyze the following backlink and off-page SEO data for **{state['client_name']}** ({state['website_url']}) and produce your full Off-Page Audit Report.

### Raw Backlink Profile Data:
```json
{json.dumps(backlink_data, indent=2)}
```

For each finding:
- Flag all toxic domains with spam scores >60% and format disavow entries
- Identify the top 3 competitor link gap opportunities (DA50+ domains)
- Draft a personalized 3-sentence outreach email for each opportunity
- Summarize backlink velocity (new vs. lost over 30 days)"""

    messages = [
        SystemMessage(content=OFFPAGE_AGENT_PROMPT),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)

    return {
        "offpage_report": response.content,
        "messages": [
            HumanMessage(content="[Off-Page Agent] Audit requested."),
            response,
        ],
    }
