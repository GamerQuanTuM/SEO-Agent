# Ezydrag AI SEO Suite — Project Documentation

> A production-grade, multi-agent SEO audit platform powered by **LangGraph** and **Google Gemini**.  
> Three autonomous AI agents analyze real website data and produce client-ready SEO reports.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Folder Structure](#3-folder-structure)
4. [File-by-File Breakdown](#4-file-by-file-breakdown)
5. [The Three AI Agents](#5-the-three-ai-agents)
6. [External Services & API Integrations](#6-external-services--api-integrations)
7. [How Everything Connects](#7-how-everything-connects)
8. [LangGraph Internals](#8-langgraph-internals)
9. [Environment Variables](#9-environment-variables)
10. [Dependencies](#10-dependencies)
11. [Usage & Commands](#11-usage--commands)

---

## 1. Project Overview

**Ezydrag AI SEO Suite** is a CLI-based multi-agent system that performs a comprehensive SEO audit on any website. It was designed according to the Ezydrag AI PRD, which specifies three autonomous AI agents — each a specialist in a different SEO pillar — coordinated by a Supervisor that produces a unified executive report.

### What It Does

1. **Crawls** a target website to find broken pages, orphaned content, schema issues, and crawl budget waste
2. **Calls real APIs** (Google PageSpeed Insights, Google Search Console, and your choice of DataForSEO, Semrush, or Ahrefs) to gather performance metrics, keyword rankings, and backlink profiles
3. **Sends all collected data** to three specialized Gemini-powered AI agents that analyze it independently
4. **Synthesizes** all three agent reports into a single executive summary with a health score and priority action plan
5. **Saves** the full report as a Markdown file

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **LangGraph** over raw LangChain | Provides explicit graph topology (fan-out/fan-in), typed state management, and deterministic execution order |
| **Fan-out → Fan-in** pattern | All 3 agents run on the same data simultaneously, then converge at the Supervisor — mirrors how a real SEO team works |
| **Graceful degradation** | Every external API service is optional except Gemini. Missing credentials produce informative warnings, not crashes |
| **Provider Agnostic** | The backlink API automatically detects your configured provider (DataForSEO, Semrush, or Ahrefs) and routes to the appropriate module |
| **`uv`** as package manager | Faster than pip, deterministic lockfile (`uv.lock`), and first-class `pyproject.toml` support |
| **Rich** for CLI output | Colored panels, tables, and Markdown rendering directly in the terminal |

---

## 2. Architecture & Data Flow

### High-Level Pipeline

```text
┌─────────────┐     ┌──────────────────────────────────────────────────┐     ┌─────────────────┐
│             │     │            LangGraph StateGraph                  │     │                 │
│   CLI       │     │                                                  │     │  Output         │
│   (main.py) │────▶│  ┌─────────────┐                                │────▶│  - Terminal     │
│             │     │  │ ingest_data │                                │     │  - Markdown     │
│  --url      │     │  │  (real APIs)│                                │     │    Report File  │
│  --client   │     │  └──────┬──────┘                                │     │                 │
│  --compet.  │     │         │                                        │     └─────────────────┘
│  --max-pgs  │     │    ┌────┴────┬─────────────┐                    │
└─────────────┘     │    │         │             │                    │
                    │    ▼         ▼             ▼                    │
                    │ ┌────────┐ ┌────────┐ ┌────────┐               │
                    │ │Technical│ │On-Page │ │Off-Page│               │
                    │ │ Agent  │ │ Agent  │ │ Agent  │               │
                    │ └───┬────┘ └───┬────┘ └───┬────┘               │
                    │     │         │           │                    │
                    │     └────┬────┴───────────┘                    │
                    │          │                                      │
                    │          ▼                                      │
                    │    ┌────────────┐                               │
                    │    │ Supervisor │                               │
                    │    │ (synthesis)│                               │
                    │    └────────────┘                               │
                    │                                                  │
                    └──────────────────────────────────────────────────┘
```

### Data Flow — Step by Step

```text
Step 1: main.py initializes the LLM (Gemini) and builds the LangGraph
            │
            ▼
Step 2: ingest_data node calls tools.py → get_all_seo_data()
            │
            ├─── crawler.py    → Crawls site via HTTP (broken pages, schema, links)
            ├─── pagespeed.py  → Calls Google PageSpeed API (LCP, FID, CLS)
            ├─── search_console.py → Calls Google Search Console API (rankings, CTR)
            └─── (Auto-detect based on .env keys)
                   ├── dataforseo.py → Calls DataForSEO API
                   ├── semrush.py    → Calls Semrush Analytics API
                   └── ahrefs.py     → Calls Ahrefs API v3
            │
            ▼
Step 3: Raw data stored in AgentState["raw_data"] as dict with 3 keys:
            ├── "crawl_data"     → Fed to Technical Agent
            ├── "analytics_data" → Fed to On-Page Agent
            └── "backlink_data"  → Fed to Off-Page Agent
            │
            ▼
Step 4: Each agent reads its slice of raw_data, serializes to JSON,
        sends to Gemini with its system prompt, receives Markdown report
            │
            ▼
Step 5: Reports stored in AgentState as:
            ├── "technical_report" → Markdown string
            ├── "onpage_report"    → Markdown string
            └── "offpage_report"   → Markdown string
            │
            ▼
Step 6: Supervisor reads all 3 reports, sends to Gemini with supervisor prompt,
        produces Executive Summary + Health Score + Priority Action Plan
            │
            ▼
Step 7: main.py displays all 4 reports in Rich panels, saves to .md file
```

---

## 3. Folder Structure

```text
seo-agent/
│
├── .env.example                          # Template with all env vars documented
├── .env                                  # Actual credentials (gitignored)
├── .gitignore                            # Git ignore rules
├── .python-version                       # Python version pin (3.11)
├── pyproject.toml                        # Project config + dependencies
├── uv.lock                               # Deterministic dependency lockfile
├── README.md                             # This file
│
├── main.py                               # CLI entry point — argument parsing,
│                                         # LLM init, graph execution, output display
│
└── src/
    └── seo_agents/
        ├── __init__.py                   # Package marker
        │
        ├── state.py                      # AgentState TypedDict definition
        ├── prompts.py                    # System prompts for all 4 LLM roles
        ├── tools.py                      # Service orchestrator — calls all APIs
        ├── graph.py                      # LangGraph StateGraph definition + compilation
        │
        ├── agents/                       # One file per AI agent node
        │   ├── __init__.py
        │   ├── technical.py              # Agent 1: Technical & DevOps Bot
        │   ├── onpage.py                 # Agent 2: On-Page Content Strategist
        │   └── offpage.py                # Agent 3: Off-Page PR & Security Bot
        │
        └── services/                     # External API integrations
            ├── __init__.py
            ├── crawler.py                # Built-in HTTP site crawler
            ├── pagespeed.py              # Google PageSpeed Insights API client
            ├── search_console.py         # Google Search Console API client
            ├── dataforseo.py             # DataForSEO Backlinks API client
            ├── semrush.py                # Semrush API client
            └── ahrefs.py                 # Ahrefs API v3 client
```

---

## 4. File-by-File Breakdown

### Root Files

#### `main.py`
**Role:** CLI entry point and output renderer.

- Parses command-line arguments (`--url`, `--client`, `--competitors`, `--max-pages`)
- Loads `.env` credentials via `python-dotenv`
- Displays an ASCII banner and an API status table showing which services are configured
- Validates that `GOOGLE_API_KEY` is present (required) — exits with instructions if missing
- Initializes the `ChatGoogleGenerativeAI` LLM (Gemini 2.0 Flash, temperature 0.3)
- Calls `build_seo_graph(llm)` to compile the LangGraph
- Prepares the initial `AgentState` dict and invokes the graph
- Renders all 4 reports (Technical, On-Page, Off-Page, Executive) in color-coded Rich panels
- Saves the complete audit to a timestamped Markdown file

#### `pyproject.toml`
**Role:** Project metadata and dependency declarations for `uv`.

Declares Python ≥3.11 and all production dependencies.

#### `.env.example`
**Role:** Template documenting every environment variable with setup instructions.

---

### `src/seo_agents/state.py`
**Role:** Defines the shared state schema that flows through the entire LangGraph.

Contains a single `AgentState` class (a `TypedDict`) with 9 fields:

| Field | Type | Purpose |
|-------|------|---------|
| `website_url` | `str` | Target website to audit |
| `client_name` | `str` | Client name for report headers |
| `competitors` | `list[str]` | Competitor domains for gap analysis |
| `max_pages` | `int` | Crawl limit |
| `raw_data` | `dict` | Container for all API response data (3 sub-keys) |
| `technical_report` | `str` | Markdown output from the Technical Agent |
| `onpage_report` | `str` | Markdown output from the On-Page Agent |
| `offpage_report` | `str` | Markdown output from the Off-Page Agent |
| `final_report` | `str` | Markdown output from the Supervisor |
| `messages` | `Annotated[list, operator.add]` | Accumulated LLM message history (append-only) |

The `messages` field uses `Annotated[list, operator.add]` which is a LangGraph convention — it tells the framework to **merge lists by concatenation** rather than overwriting, so messages from parallel agents don't clobber each other.

---

### `src/seo_agents/prompts.py`
**Role:** Contains the exact system prompts for all 4 LLM roles, adapted from the original PRD.

| Prompt Constant | Target | Output Sections |
|----------------|--------|-----------------|
| `TECHNICAL_AGENT_PROMPT` | Agent 1 (DevOps Bot) | Crawl Budget Analysis, Redirect Map, Developer Tickets, Schema Alerts |
| `ONPAGE_AGENT_PROMPT` | Agent 2 (Content Strategist) | Decay Alerts, Cannibalization Warnings, CTR Split-Tests, Internal Link Map |
| `OFFPAGE_AGENT_PROMPT` | Agent 3 (PR Bot) | Critical Link Alerts, Disavow Prep, Top 3 Outreach Targets, Outreach Emails, Velocity Report |
| `SUPERVISOR_PROMPT` | Supervisor | Executive Summary (2 paragraphs), Priority Action Plan (top 10), Health Score (0-100) |

---

### `src/seo_agents/tools.py`
**Role:** Service orchestrator — the bridge between the LangGraph and the external API services.

Contains 4 public functions:

| Function | Services It Calls | Returns |
|----------|-------------------|---------|
| `get_crawl_data()` | `crawler.crawl_site()` + `pagespeed.get_core_web_vitals()` | Crawl results + Core Web Vitals merged into one dict |
| `get_analytics_data()` | `search_console.get_search_analytics()` | Rankings, CTR, decay, cannibalization data |
| `get_backlink_data()` | Auto-detects DataForSEO / Semrush / Ahrefs based on `.env` | Backlink profile + competitor gap analysis |
| `get_all_seo_data()` | Calls all three above | Dict with keys `"crawl_data"`, `"analytics_data"`, `"backlink_data"` |

---

### `src/seo_agents/graph.py`
**Role:** Defines and compiles the LangGraph `StateGraph` — the heart of the multi-agent orchestration.

Contains 3 functions:

#### `ingest_data_node(state)`
- The **entry point** of the graph
- Calls `get_all_seo_data()` from `tools.py`, passing `website_url`, `max_pages`, and `competitors` from state
- Stores the result in `state["raw_data"]`

#### `supervisor_node(state, llm)`
- The **exit point** of the graph (before `END`)
- Reads all 3 agent reports from state
- Sends them along with the `SUPERVISOR_PROMPT` to Gemini
- Stores the executive summary in `state["final_report"]`

#### `build_seo_graph(llm)` → compiled graph
- Creates a `StateGraph(AgentState)`
- Uses `functools.partial` to bind the LLM instance to agent and supervisor nodes
- Adds 5 nodes: `ingest_data`, `technical_agent`, `onpage_agent`, `offpage_agent`, `supervisor`
- Defines edges for **fan-out** (ingest → 3 agents) and **fan-in** (3 agents → supervisor)
- Compiles and returns the executable graph

---

### Agent Files (`src/seo_agents/agents/`)

All three agent files follow the **exact same pattern**:

1. Read their specific slice of `state["raw_data"]`
2. Serialize it to JSON
3. Construct a `[SystemMessage, HumanMessage]` pair
4. Call `llm.invoke(messages)` — sends to Gemini
5. Return a dict with the report string and appended messages

#### `technical.py` — Agent 1: Technical & DevOps Bot
- **Reads:** `state["raw_data"]["crawl_data"]`
- **Analysis focus:** Crawl budget waste, 404→301 redirects with code snippets, Core Web Vitals bottlenecks, JSON-LD schema errors

#### `onpage.py` — Agent 2: On-Page Content Strategist
- **Reads:** `state["raw_data"]["analytics_data"]`
- **Analysis focus:** Traffic decay (>20% MoM drop), keyword cannibalization, low-CTR title tag alternatives, orphaned page internal linking

#### `offpage.py` — Agent 3: Off-Page PR & Security Bot
- **Reads:** `state["raw_data"]["backlink_data"]`
- **Analysis focus:** Toxic domains, Google disavow file entries, competitor link gap opportunities, personalized outreach emails

---

### Service Files (`src/seo_agents/services/`)

#### `crawler.py` (Built-in HTTP Crawler)
Performs a real breadth-first crawl of the target website using `httpx` and `BeautifulSoup`. No API key needed. Finds broken links, schema syntax errors, orphaned pages, and calculates crawl budget waste.

#### `pagespeed.py` (Google PageSpeed API)
Uses `GOOGLE_API_KEY`. Fetches Core Web Vitals (LCP, FID, CLS, INP) metrics and top optimization opportunities for the pages found in the crawl.

#### `search_console.py` (Google Search Console API)
Uses OAuth2 service account (`GSC_CREDENTIALS_PATH`). Fetches real keyword performance data (clicks, impressions, position, CTR) and detects cannibalization and traffic decay by comparing 30-day periods.

#### Backlink API Providers (Auto-Selected)
The suite supports three major backlink APIs natively. `tools.py` checks your `.env` variables and routes the request to whichever service is configured.

1. **`dataforseo.py`** — Uses API endpoints `/v3/backlinks/summary`, `/referring_domains`, and `/competitors`. Pay-as-you-go.
2. **`semrush.py`** — Uses the Analytics API `backlinks_overview` and `backlinks_refdomains` endpoints. Requires Semrush Business plan.
3. **`ahrefs.py`** — Uses Ahrefs API v3 (Site Explorer) `/overview` and `/refdomains`. Requires Ahrefs Enterprise plan.

---

## 5. The Three AI Agents

### Agent 1: Technical & DevOps Bot

| Aspect | Detail |
|--------|--------|
| **File** | `agents/technical.py` |
| **Data source** | `crawl_data` (from crawler + PageSpeed) |
| **Persona** | Lead Technical SEO Agent |
| **Tone** | Highly technical, includes code snippets |
| **Capabilities** | Crawl Budget Protector, Auto-Redirect Mapper, Core Web Vitals Liaison, Schema Markup Healer |
| **Output sections** | Crawl Budget Analysis, Redirect Map, Developer Tickets, Schema Alerts |

### Agent 2: On-Page Content Strategist

| Aspect | Detail |
|--------|--------|
| **File** | `agents/onpage.py` |
| **Data source** | `analytics_data` (from Google Search Console) |
| **Persona** | Lead On-Page SEO Agent |
| **Tone** | Strategic, ROI-focused |
| **Capabilities** | Content Decay Detection, Cannibalization Guard, CTR Optimizer, Internal Link Orchestrator |
| **Output sections** | Decay Alerts, Cannibalization Warnings, CTR Split-Tests, Internal Link Map |

### Agent 3: Off-Page PR & Security Bot

| Aspect | Detail |
|--------|--------|
| **File** | `agents/offpage.py` |
| **Data source** | `backlink_data` (from DataForSEO / Semrush / Ahrefs) |
| **Persona** | Lead Off-Page Agent |
| **Tone** | Analytical, includes domain authority scores |
| **Capabilities** | Toxic Link Defender, Competitor Gap Mining, Auto-Drafted Outreach |
| **Output sections** | Critical Link Alerts, Disavow Prep, Top 3 Outreach Targets, Outreach Email Drafts, Backlink Velocity Report |

### Supervisor (Agent 4)

| Aspect | Detail |
|--------|--------|
| **File** | `graph.py` (inline function) |
| **Data source** | All 3 agent reports |
| **Persona** | SEO Audit Supervisor |
| **Output** | 2-paragraph Executive Summary, Top 10 Priority Action Plan, Health Score (0-100) |

---

## 6. External Services & API Integrations

### Service Details

| Service | Auth Method | What It Provides | Graceful Degradation |
|---------|-------------|------------------|---------------------|
| **Site Crawler** | None (built-in) | Broken pages, schema validation, internal links, page metadata | Always available |
| **PageSpeed Insights** | `GOOGLE_API_KEY` | LCP, FID, INP, CLS, score, optimization suggestions | Returns error dict if key missing |
| **Search Console** | `GSC_CREDENTIALS_PATH` | Keyword rankings, clicks, impressions, CTR, position changes | Returns data_available=False if missing |
| **DataForSEO** | `DATAFORSEO_LOGIN` | Backlink profiles, toxic domains, competitor gap | Skipped if credentials not found |
| **Semrush** | `SEMRUSH_API_KEY` | Backlinks, referring domains, domain score, competitor analysis | Skipped if credentials not found |
| **Ahrefs** | `AHREFS_API_KEY` | Domain Rating, backlinks, referring domains, competitor gaps | Skipped if credentials not found |
| **Google Gemini** | `GOOGLE_API_KEY` | LLM inference for all 4 agent prompts | **App exits** — this is the required service |

---

## 7. How Everything Connects

### The Call Chain (in execution order)

```python
# 1. main.py
main()
  ├── load_dotenv()                          # Load .env credentials
  ├── print_api_status()                     # Show which APIs are configured
  ├── ChatGoogleGenerativeAI(model="gemini-2.0-flash")  # Init LLM
  ├── build_seo_graph(llm)                   # Compile LangGraph
  └── compiled_graph.invoke(initial_state)   # Execute the pipeline
        │
        # 2. graph.py — LangGraph execution
        ├── ingest_data_node(state)
        │     └── tools.get_all_seo_data(url, max_pages, competitors)
        │           ├── tools.get_crawl_data(url, max_pages)        # HTTP crawl + PageSpeed API
        │           ├── tools.get_analytics_data(url)               # GSC API
        │           └── tools.get_backlink_data(url, competitors)   # Backlink provider
        │
        # 3. Fan-out: 3 agents run (conceptually parallel)
        ├── technical_agent_node(state, llm)   # Reads crawl_data → Gemini → technical_report
        ├── onpage_agent_node(state, llm)      # Reads analytics_data → Gemini → onpage_report
        ├── offpage_agent_node(state, llm)     # Reads backlink_data → Gemini → offpage_report
        │
        # 4. Fan-in: Supervisor
        └── supervisor_node(state, llm)        # Reads all 3 reports → Gemini → final_report
```

---

## 8. LangGraph Internals

### Graph Definition (from `graph.py`)

LangGraph relies on explicitly defining nodes and edges. Our system uses a parallel fan-out approach to emulate how a team of SEO specialists operates concurrently.

```python
graph = StateGraph(AgentState)

# 5 nodes bound to the LLM via functools.partial
graph.add_node("ingest_data",      ingest_data_node)
graph.add_node("technical_agent",   partial(technical_agent_node, llm=llm))
graph.add_node("onpage_agent",      partial(onpage_agent_node, llm=llm))
graph.add_node("offpage_agent",     partial(offpage_agent_node, llm=llm))
graph.add_node("supervisor",        partial(supervisor_node, llm=llm))

# Entry point
graph.set_entry_point("ingest_data")

# Fan-out: 1 node sends state to 3 sub-agents
graph.add_edge("ingest_data", "technical_agent")
graph.add_edge("ingest_data", "onpage_agent")
graph.add_edge("ingest_data", "offpage_agent")

# Fan-in: All 3 sub-agents converge to supervisor
graph.add_edge("technical_agent", "supervisor")
graph.add_edge("onpage_agent",    "supervisor")
graph.add_edge("offpage_agent",   "supervisor")

# Termination
graph.add_edge("supervisor", END)
```

---

## 9. Environment Variables

| Variable | Required | Service | How to Get It |
|----------|----------|---------|---------------|
| `GOOGLE_API_KEY` | **YES** | Gemini LLM + PageSpeed | [Google AI Studio](https://aistudio.google.com/apikey) — free |
| `GSC_CREDENTIALS_PATH` | No | Google Search Console | Create a GCP service account, download JSON |
| `DATAFORSEO_LOGIN` | No* | DataForSEO API (Backlinks) | [Sign up](https://app.dataforseo.com/register) — $1 free credit |
| `SEMRUSH_API_KEY` | No* | Semrush API (Backlinks) | Semrush Account → API Units (Business plan) |
| `AHREFS_API_KEY` | No* | Ahrefs API (Backlinks) | Ahrefs Account → API Keys (Enterprise plan) |

*\* You only need to configure ONE of the three backlink API providers (DataForSEO, Semrush, or Ahrefs).*

---

## 10. Dependencies

All managed via `uv` in `pyproject.toml`:

| Package | Version | Purpose |
|---------|---------|---------|
| `langgraph` | ≥1.1.6 | Multi-agent graph orchestration framework |
| `langchain-google-genai` | ≥4.2.1 | Google Gemini LLM wrapper for LangChain |
| `httpx` | ≥0.28.1 | Async-capable HTTP client for crawler & APIs |
| `beautifulsoup4` | ≥4.14.3 | HTML parsing for site crawler |
| `lxml` | ≥6.0.2 | Fast HTML parser backend for BeautifulSoup |
| `google-api-python-client` | ≥2.193.0 | Google Search Console API client |
| `python-dotenv` | ≥1.2.2 | Load `.env` files into environment |
| `rich` | ≥14.3.3 | Terminal output formatting |

---

## 11. Usage & Commands

### Install dependencies
```bash
uv sync
```

### Run an audit (minimum — just Gemini + Crawler + PageSpeed)
```bash
uv run python main.py --url https://example.com --client "Example Corp"
```

### Run a full audit with competitor analysis
```bash
uv run python main.py \
  --url https://example.com \
  --client "Example Corp" \
  --competitors "competitor1.com,competitor2.com,competitor3.com" \
  --max-pages 100
```

### CLI Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--url` | Yes | — | Target website URL to audit |
| `--client` | Yes | — | Client name (used in report headers) |
| `--competitors` | No | `""` | Comma-separated competitor domains |
| `--max-pages` | No | `50` | Maximum number of pages to crawl |

### Output

1. **Terminal:** 4 color-coded Rich panels (Technical, On-Page, Off-Page, Executive Summary)
2. **File:** `seo_audit_report_{client_name}.md` — complete Markdown report saved to project root
