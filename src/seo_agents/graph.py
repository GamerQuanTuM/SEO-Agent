"""
LangGraph workflow definition for the Ezydrag AI SEO Suite.

Builds a StateGraph with three parallel specialist agent nodes
(Technical, On-Page, Off-Page) that fan out from an ingestion node,
then fan back into a supervisor node that synthesizes the final report.

Graph topology:
    ingest_data ──┬──> technical_agent ──┐
                  ├──> onpage_agent    ──┤──> supervisor ──> END
                  └──> offpage_agent   ──┘
"""

from __future__ import annotations

from functools import partial

from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END

from src.seo_agents.state import AgentState
from src.seo_agents.prompts import SUPERVISOR_PROMPT
from src.seo_agents.tools import get_all_seo_data
from src.seo_agents.agents.technical import technical_agent_node
from src.seo_agents.agents.onpage import onpage_agent_node
from src.seo_agents.agents.offpage import offpage_agent_node


# ── Node Functions ──────────────────────────────────────────────────────────


def ingest_data_node(state: AgentState) -> dict:
    """Fetches all SEO data for the target website via real API services."""
    raw_data = get_all_seo_data(
        website_url=state["website_url"],
        max_pages=state.get("max_pages", 50),
        competitors=state.get("competitors", []),
    )
    return {
        "raw_data": raw_data,
        "messages": [
            HumanMessage(
                content=f"[Data Ingestion] Collected crawl, analytics, and backlink data for {state['website_url']}."
            )
        ],
    }


def supervisor_node(state: AgentState, llm) -> dict:
    """Synthesizes all three agent reports into a unified executive summary."""
    user_message = f"""Here are the complete reports from the three specialist SEO agents for **{state['client_name']}** ({state['website_url']}):

---

# Technical Agent Report
{state.get('technical_report', 'No report generated.')}

---

# On-Page Agent Report
{state.get('onpage_report', 'No report generated.')}

---

# Off-Page Agent Report
{state.get('offpage_report', 'No report generated.')}

---

Now synthesize these into your Executive Summary, Priority Action Plan, and Health Score."""

    messages = [
        SystemMessage(
            content=SUPERVISOR_PROMPT.format(
                client_name=state["client_name"],
                website_url=state["website_url"],
            )
        ),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)

    from src.seo_agents.utils import extract_text

    return {
        "final_report": extract_text(response.content),
        "messages": [
            HumanMessage(content="[Supervisor] Final report synthesis requested."),
            response,
        ],
    }


# ── Graph Builder ───────────────────────────────────────────────────────────


def build_seo_graph(llm) -> StateGraph:
    """Build and compile the SEO audit LangGraph.

    Args:
        llm: An initialized LLM instance (e.g. ChatGoogleGenerativeAI).

    Returns:
        A compiled LangGraph ready to invoke.
    """
    graph = StateGraph(AgentState)

    # Bind LLM to agent nodes via functools.partial
    tech_node = partial(technical_agent_node, llm=llm)
    onpage_node = partial(onpage_agent_node, llm=llm)
    offpage_node = partial(offpage_agent_node, llm=llm)
    supervisor = partial(supervisor_node, llm=llm)

    # Add nodes
    graph.add_node("ingest_data", ingest_data_node)
    graph.add_node("technical_agent", tech_node)
    graph.add_node("onpage_agent", onpage_node)
    graph.add_node("offpage_agent", offpage_node)
    graph.add_node("supervisor", supervisor)

    # Set entry point
    graph.set_entry_point("ingest_data")

    # Fan-out: ingest → all 3 agents in parallel
    graph.add_edge("ingest_data", "technical_agent")
    graph.add_edge("ingest_data", "onpage_agent")
    graph.add_edge("ingest_data", "offpage_agent")

    # Fan-in: all 3 agents → supervisor
    graph.add_edge("technical_agent", "supervisor")
    graph.add_edge("onpage_agent", "supervisor")
    graph.add_edge("offpage_agent", "supervisor")

    # Supervisor → END
    graph.add_edge("supervisor", END)

    return graph.compile()
