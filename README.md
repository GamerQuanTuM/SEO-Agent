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
2. **Calls real APIs** (Google PageSpeed Insights, Google Search Console, DataForSEO) to gather performance metrics, keyword rankings, and backlink profiles
3. **Sends all collected data** to three specialized Gemini-powered AI agents that analyze it independently
4. **Synthesizes** all three agent reports into a single executive summary with a health score and priority action plan
5. **Saves** the full report as a Markdown file

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **LangGraph** over raw LangChain | Provides explicit graph topology (fan-out/fan-in), typed state management, and deterministic execution order |
| **Fan-out → Fan-in** pattern | All 3 agents run on the same data simultaneously, then converge at the Supervisor — mirrors how a real SEO team works |
| **Graceful degradation** | Every external API service is optional except Gemini. Missing credentials produce informative warnings, not crashes |
| **`uv`** as package manager | Faster than pip, deterministic lockfile (`uv.lock`), and first-class `pyproject.toml` support |
| **Rich** for CLI output | Colored panels, tables, and Markdown rendering directly in the terminal |

---

## 2. Architecture & Data Flow

### High-Level Pipeline

```
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

```
Step 1: main.py initializes the LLM (Gemini) and builds the LangGraph
            │
            ▼
Step 2: ingest_data node calls tools.py → get_all_seo_data()
            │
            ├─── crawler.py    → Crawls site via HTTP (broken pages, schema, links)
            ├─── pagespeed.py  → Calls Google PageSpeed API (LCP, FID, CLS)
            ├─── search_console.py → Calls Google Search Console API (rankings, CTR)
            └─── dataforseo.py → Calls DataForSEO API (backlinks, toxic links)
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

```
seo-agent/
│
├── .env.example                          # Template with all env vars documented
├── .env                                  # Actual credentials (gitignored)
├── .gitignore                            # Git ignore rules
├── .python-version                       # Python version pin (3.11)
├── pyproject.toml                        # Project config + dependencies
├── uv.lock                              # Deterministic dependency lockfile
├── EZYDRAGAI.pdf                         # Original PRD document
├── PROJECT.md                            # This file
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
        └── services/                     # One file per external API integration
            ├── __init__.py
            ├── crawler.py                # Built-in HTTP site crawler
            ├── pagespeed.py              # Google PageSpeed Insights API client
            ├── search_console.py         # Google Search Console API client
            └── dataforseo.py             # DataForSEO Backlinks API client
```

---

## 4. File-by-File Breakdown

### Root Files

#### `main.py` (297 lines)
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

#### `pyproject.toml` (20 lines)
**Role:** Project metadata and dependency declarations for `uv`.

Declares Python ≥3.11 and all 11 production dependencies.

#### `.env.example` (37 lines)
**Role:** Template documenting every environment variable with setup instructions.

---

### `src/seo_agents/state.py` (38 lines)
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

### `src/seo_agents/prompts.py` (92 lines)
**Role:** Contains the exact system prompts for all 4 LLM roles, adapted from the original PRD.

| Prompt Constant | Target | Output Sections |
|----------------|--------|-----------------|
| `TECHNICAL_AGENT_PROMPT` | Agent 1 (DevOps Bot) | Crawl Budget Analysis, Redirect Map, Developer Tickets, Schema Alerts |
| `ONPAGE_AGENT_PROMPT` | Agent 2 (Content Strategist) | Decay Alerts, Cannibalization Warnings, CTR Split-Tests, Internal Link Map |
| `OFFPAGE_AGENT_PROMPT` | Agent 3 (PR Bot) | Critical Link Alerts, Disavow Prep, Top 3 Outreach Targets, Outreach Emails, Velocity Report |
| `SUPERVISOR_PROMPT` | Supervisor | Executive Summary (2 paragraphs), Priority Action Plan (top 10), Health Score (0-100) |

The Supervisor prompt uses Python `.format()` placeholders (`{client_name}`, `{website_url}`) that get filled at runtime.

---

### `src/seo_agents/tools.py` (152 lines)
**Role:** Service orchestrator — the bridge between the LangGraph and the external API services.

Contains 4 public functions:

| Function | Services It Calls | Returns |
|----------|-------------------|---------|
| `get_crawl_data(url, max_pages)` | `crawler.crawl_site()` + `pagespeed.get_core_web_vitals()` | Crawl results + Core Web Vitals merged into one dict |
| `get_analytics_data(url)` | `search_console.get_search_analytics()` | Rankings, CTR, decay, cannibalization data |
| `get_backlink_data(url, competitors)` | `dataforseo.get_backlink_profile()` + `dataforseo.get_competitor_backlink_gap()` | Backlink profile + competitor gap analysis |
| `get_all_seo_data(url, max_pages, competitors)` | Calls all three above | Dict with keys `"crawl_data"`, `"analytics_data"`, `"backlink_data"` |

Also contains `_extract_domain()` helper that strips a URL down to its bare domain (e.g., `"https://www.example.com/page"` → `"example.com"`).

---

### `src/seo_agents/graph.py` (137 lines)
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

#### `technical.py` (52 lines) — Agent 1: Technical & DevOps Bot
- **Reads:** `state["raw_data"]["crawl_data"]`
- **System prompt:** `TECHNICAL_AGENT_PROMPT`
- **Writes to:** `state["technical_report"]`
- **Analysis focus:** Crawl budget waste, 404→301 redirects with code snippets, Core Web Vitals bottlenecks, JSON-LD schema errors

#### `onpage.py` (56 lines) — Agent 2: On-Page Content Strategist
- **Reads:** `state["raw_data"]["analytics_data"]`
- **System prompt:** `ONPAGE_AGENT_PROMPT`
- **Writes to:** `state["onpage_report"]`
- **Analysis focus:** Traffic decay (>20% MoM drop), keyword cannibalization, low-CTR title tag alternatives, orphaned page internal linking

#### `offpage.py` (56 lines) — Agent 3: Off-Page PR & Security Bot
- **Reads:** `state["raw_data"]["backlink_data"]`
- **System prompt:** `OFFPAGE_AGENT_PROMPT`
- **Writes to:** `state["offpage_report"]`
- **Analysis focus:** Toxic domains (spam score >60%), Google disavow file entries, competitor link gap opportunities, personalized outreach emails

---

### Service Files (`src/seo_agents/services/`)

#### `crawler.py` (294 lines) — Built-in Site Crawler
**API Key:** None required  
**Library:** `httpx` + `beautifulsoup4` + `lxml`

The most complex service file. Performs a real breadth-first crawl of the target website:

| Capability | How It Works |
|-----------|-------------|
| **Page discovery** | Starts from root URL, follows internal `<a href>` links up to `max_pages` |
| **404 detection** | Records all pages returning HTTP 404 and counts how many internal pages link to them |
| **Orphaned page detection** | After crawl, finds pages with zero inbound internal links |
| **robots.txt analysis** | Fetches `/robots.txt` and includes the raw text in output |
| **Crawl budget waste** | Flags URLs matching waste patterns (`/tag/`, `/archive/`, `/page/`, `?`, `/feed/`) |
| **JSON-LD schema validation** | Parses every `<script type="application/ld+json">` tag, validates required properties per schema type (LocalBusiness, Article, Organization, etc.), checks date formats, flags non-absolute image URLs |
| **Page metadata** | Extracts `<title>`, `<meta description>`, `<h1>` count/text, word count |
| **Rate limiting** | 0.3s delay between requests to be respectful |

Helper functions: `_is_same_domain()`, `_normalize_url()`, `_validate_schema()`

#### `pagespeed.py` (168 lines) — Google PageSpeed Insights API
**API Key:** `GOOGLE_API_KEY` (same as Gemini)  
**Endpoint:** `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`  
**Cost:** Free (25,000 requests/day)

| What It Fetches | Details |
|----------------|---------|
| **Performance score** | 0-100 Lighthouse score |
| **Core Web Vitals** | LCP, FID, INP, CLS, FCP, TBT, Speed Index — each with score, display value, numeric value |
| **Optimization opportunities** | Top 5 suggestions sorted by potential time savings (ms) |
| **Diagnostics** | Top 5 table-type audit failures |

Functions: `get_core_web_vitals(url, strategy)` for single URL, `get_web_vitals_for_pages(urls)` for batch.

#### `search_console.py` (261 lines) — Google Search Console API
**Auth:** OAuth2 Service Account (JSON credentials file)  
**Env var:** `GSC_CREDENTIALS_PATH`  
**Scope:** `webmasters.readonly`  
**Cost:** Free (unlimited)

| What It Fetches | Details |
|----------------|---------|
| **Keyword data** | Top 200 page+query pairs with clicks, impressions, CTR, position |
| **Period comparison** | Current 30 days vs. previous 30 days (accounts for GSC's ~3-day data delay) |
| **Decay detection** | Pages where clicks dropped >20% MoM (minimum 10 clicks threshold) |
| **Cannibalization** | Keywords where 2+ pages from the same domain both rank |
| **Low-CTR opportunities** | Keywords ranking in top 10 with ≥100 impressions but <3% CTR |
| **Top keywords** | Top 20 keywords by clicks |

Uses `google-api-python-client` and `google-auth` for OAuth2 service account authentication.

#### `dataforseo.py` (256 lines) — DataForSEO Backlinks API
**Auth:** HTTP Basic Auth (login + password)  
**Env vars:** `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`  
**Endpoints used:** 3 different endpoints  
**Cost:** ~$0.002 per API task

| Function | API Endpoint | What It Returns |
|----------|-------------|-----------------|
| `get_backlink_profile(domain)` | `/v3/backlinks/summary/live` | Total backlinks, referring domains/IPs, broken backlinks, spam score, rank |
| (same function) | `/v3/backlinks/referring_domains/live` | Top 100 referring domains sorted by spam score desc; toxic domains (score >60) flagged separately |
| (same function) | `/v3/backlinks/history/live` | New vs. lost backlinks (velocity) |
| `get_competitor_backlink_gap(target, competitors)` | `/v3/backlinks/competitors/live` | Domains linking to up to 3 competitors but NOT to the target — the "link gap" |

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
| **Data source** | `backlink_data` (from DataForSEO) |
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

### Service → Agent Mapping

```
┌─────────────────────────┐     ┌────────────────────────────┐
│  SERVICES (Data Layer)  │     │  AGENTS (AI Layer)          │
│                         │     │                            │
│  ┌─────────────────┐   │     │  ┌──────────────────────┐  │
│  │ Site Crawler     │───┼──┬──┼─▶│ Technical Agent      │  │
│  │ (built-in)       │   │  │  │  │ (DevOps Bot)         │  │
│  └─────────────────┘   │  │  │  └──────────────────────┘  │
│                         │  │  │                            │
│  ┌─────────────────┐   │  │  │                            │
│  │ PageSpeed API    │───┼──┘  │                            │
│  │ (Google)         │   │     │                            │
│  └─────────────────┘   │     │                            │
│                         │     │  ┌──────────────────────┐  │
│  ┌─────────────────┐   │     │  │ On-Page Agent        │  │
│  │ Search Console   │───┼─────┼─▶│ (Content Strategist) │  │
│  │ (Google)         │   │     │  └──────────────────────┘  │
│  └─────────────────┘   │     │                            │
│                         │     │  ┌──────────────────────┐  │
│  ┌─────────────────┐   │     │  │ Off-Page Agent       │  │
│  │ DataForSEO API   │───┼─────┼─▶│ (PR & Security Bot)  │  │
│  │ (Backlinks)      │   │     │  └──────────────────────┘  │
│  └─────────────────┘   │     │                            │
│                         │     │                            │
│  ┌─────────────────┐   │     │  ┌──────────────────────┐  │
│  │ Gemini API       │───┼─────┼─▶│ ALL Agents + Super.  │  │
│  │ (Google AI)      │   │     │  └──────────────────────┘  │
│  └─────────────────┘   │     │                            │
└─────────────────────────┘     └────────────────────────────┘
```

### Service Details

| Service | Auth Method | What It Provides | Graceful Degradation |
|---------|-------------|------------------|---------------------|
| **Site Crawler** | None (built-in) | Broken pages, schema validation, internal link graph, crawl budget waste, page metadata | Always available |
| **PageSpeed Insights** | API key in URL params | LCP, FID, INP, CLS, performance score, optimization suggestions | Returns `{"error": "..."}` if key missing |
| **Search Console** | OAuth2 service account | Keyword rankings, clicks, impressions, CTR, position changes, cannibalization | Returns `{"data_available": false, "error": "..."}` |
| **DataForSEO** | HTTP Basic Auth | Backlink profiles, spam scores, toxic domains, referring domains, competitor gap, velocity | Returns `{"data_available": false, "error": "..."}` |
| **Google Gemini** | API key in LangChain init | LLM inference for all 4 agent prompts | **App exits** — this is the only required service |

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
        │           ├── tools.get_crawl_data(url, max_pages)
        │           │     ├── crawler.crawl_site(url, max_pages)     # HTTP crawl
        │           │     ├── pagespeed.get_core_web_vitals(url)     # PageSpeed API
        │           │     └── pagespeed.get_core_web_vitals(subpage)  # PageSpeed for key pages
        │           ├── tools.get_analytics_data(url)
        │           │     └── search_console.get_search_analytics(url)  # GSC API
        │           └── tools.get_backlink_data(url, competitors)
        │                 ├── dataforseo.get_backlink_profile(domain)   # 3 DataForSEO endpoints
        │                 └── dataforseo.get_competitor_backlink_gap(domain, comps)
        │
        # 3. Fan-out: 3 agents run (conceptually parallel)
        ├── technical_agent_node(state, llm)   # Reads crawl_data → Gemini → technical_report
        ├── onpage_agent_node(state, llm)      # Reads analytics_data → Gemini → onpage_report
        ├── offpage_agent_node(state, llm)     # Reads backlink_data → Gemini → offpage_report
        │
        # 4. Fan-in: Supervisor
        └── supervisor_node(state, llm)        # Reads all 3 reports → Gemini → final_report
```

### How State Flows Between Nodes

Every node receives the full `AgentState` dict and returns a **partial update** — only the keys it modifies. LangGraph merges these updates into the accumulated state automatically.

```
ingest_data     → writes: raw_data, messages
technical_agent → writes: technical_report, messages
onpage_agent    → writes: onpage_report, messages
offpage_agent   → writes: offpage_report, messages
supervisor      → writes: final_report, messages
```

The `messages` field uses `Annotated[list, operator.add]` which tells LangGraph to **concatenate** message lists from parallel nodes rather than overwriting. This ensures no agent's messages get lost in the fan-in.

---

## 8. LangGraph Internals

### Graph Definition (from `graph.py`)

```python
graph = StateGraph(AgentState)

# 5 nodes
graph.add_node("ingest_data",      ingest_data_node)
graph.add_node("technical_agent",   partial(technical_agent_node, llm=llm))
graph.add_node("onpage_agent",      partial(onpage_agent_node, llm=llm))
graph.add_node("offpage_agent",     partial(offpage_agent_node, llm=llm))
graph.add_node("supervisor",        partial(supervisor_node, llm=llm))

# Entry point
graph.set_entry_point("ingest_data")

# Fan-out: 1 → 3
graph.add_edge("ingest_data", "technical_agent")
graph.add_edge("ingest_data", "onpage_agent")
graph.add_edge("ingest_data", "offpage_agent")

# Fan-in: 3 → 1
graph.add_edge("technical_agent", "supervisor")
graph.add_edge("onpage_agent",    "supervisor")
graph.add_edge("offpage_agent",   "supervisor")

# Termination
graph.add_edge("supervisor", END)
```

### Why `functools.partial`?

LangGraph node functions must have the signature `(state: AgentState) -> dict`. But our agents also need the LLM instance. We use `functools.partial` to pre-bind the `llm` argument:

```python
tech_node = partial(technical_agent_node, llm=llm)
# Now tech_node(state) works — llm is already bound
```

---

## 9. Environment Variables

| Variable | Required | Service | How to Get It |
|----------|----------|---------|---------------|
| `GOOGLE_API_KEY` | **YES** | Gemini LLM + PageSpeed Insights | [Google AI Studio](https://aistudio.google.com/apikey) — free |
| `GSC_CREDENTIALS_PATH` | No | Google Search Console | Create a GCP service account, download JSON, add email to Search Console users |
| `DATAFORSEO_LOGIN` | No | DataForSEO Backlinks API | [Sign up](https://app.dataforseo.com/register) — $1 free credit |
| `DATAFORSEO_PASSWORD` | No | DataForSEO Backlinks API | Found in DataForSEO dashboard |

---

## 10. Dependencies

All managed via `uv` in `pyproject.toml`:

| Package | Version | Purpose |
|---------|---------|---------|
| `langgraph` | ≥1.1.6 | Multi-agent graph orchestration framework |
| `langchain-core` | ≥1.2.26 | Base abstractions (messages, LLM interface) |
| `langchain-google-genai` | ≥4.2.1 | Google Gemini LLM wrapper for LangChain |
| `httpx` | ≥0.28.1 | Async-capable HTTP client (for crawler + PageSpeed + DataForSEO) |
| `beautifulsoup4` | ≥4.14.3 | HTML parsing for site crawler |
| `lxml` | ≥6.0.2 | Fast HTML parser backend for BeautifulSoup |
| `google-api-python-client` | ≥2.193.0 | Google Search Console API client |
| `google-auth` | ≥2.49.1 | Google OAuth2 authentication |
| `google-auth-oauthlib` | ≥1.3.1 | OAuth2 flow support |
| `python-dotenv` | ≥1.2.2 | Load `.env` files into environment |
| `rich` | ≥14.3.3 | Terminal output formatting (panels, tables, Markdown rendering) |

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
