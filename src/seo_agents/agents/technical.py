"""
Technical SEO Agent — The DevOps Bot.

Monitors site infrastructure, server logs, and frontend performance.
Handles: Crawl budget, 404→301 redirects, Core Web Vitals, Schema markup.
"""

from __future__ import annotations

import json
from langchain_core.messages import SystemMessage, HumanMessage

from src.seo_agents.prompts import TECHNICAL_AGENT_PROMPT
from src.seo_agents.state import AgentState


def technical_agent_node(state: AgentState, llm) -> dict:
    """LangGraph node: runs the Technical SEO Agent on crawl data.

    Args:
        state: The shared graph state containing raw_data.
        llm: The initialized LLM instance (Gemini).

    Returns:
        Partial state update with technical_report and appended messages.
    """
    crawl_data = state["raw_data"].get("crawl_data", {})

    user_message = f"""Analyze the following technical SEO data for **{state['client_name']}** ({state['website_url']}) and produce your full Technical Audit Report.

### Raw Crawl & Infrastructure Data:
```json
{json.dumps(crawl_data, indent=2)}
```

Produce actionable findings with exact code snippets for robots.txt rules, .htaccess 301 redirects, and developer tickets. Be specific — reference exact URLs, file names, and metrics from the data."""

    messages = [
        SystemMessage(content=TECHNICAL_AGENT_PROMPT),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)

    return {
        "technical_report": response.content,
        "messages": [
            HumanMessage(content="[Technical Agent] Audit requested."),
            response,
        ],
    }
