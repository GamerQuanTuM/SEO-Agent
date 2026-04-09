# Ezydrag AI SEO Suite — Project Documentation

> A production-grade, multi-agent SEO audit platform powered by **LangGraph** and **Google Gemini**.  
> Four autonomous AI agents analyze real website data, generate ready-to-deploy content fixes, and produce client-ready SEO reports.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Folder Structure](#3-folder-structure)
4. [File-by-File Breakdown](#4-file-by-file-breakdown)
5. [The Four AI Agents + Supervisor](#5-the-four-ai-agents--supervisor)
6. [External Services & API Integrations](#6-external-services--api-integrations)
7. [How Everything Connects](#7-how-everything-connects)
8. [LangGraph Internals](#8-langgraph-internals)
9. [Environment Variables](#9-environment-variables)
10. [Dependencies](#10-dependencies)
11. [Usage & Commands](#11-usage--commands)

---

## 1. Project Overview

**Ezydrag AI SEO Suite** is a CLI-based multi-agent system that performs a comprehensive SEO audit on any website. It was designed according to the Ezydrag AI PRD, which specifies four autonomous AI agents — each a specialist in a different SEO pillar — coordinated by a Supervisor that produces a unified executive report.

### What It Does

1. **Crawls** a target website to find broken pages, orphaned content, schema issues, and crawl budget waste
2. **Calls real APIs** (Google PageSpeed Insights, Google Search Console, and your choice of DataForSEO, Semrush, or Ahrefs) to gather performance metrics, keyword rankings, and backlink profiles
3. **Analyzes** all collected data through three specialist AI agents (Technical, On-Page, Off-Page)
4. **Generates content** — a 4th AI agent reads all three audit reports and produces ready-to-deploy fixes: refreshed page copy, optimized title tags, blog post drafts, fixed schema markup, internal linking copy, and outreach emails
5. **Synthesizes** all four agent reports into a single executive summary with a health score, priority action plan, and content deployment checklist
6. **Saves** the full report as a Markdown file

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **LangGraph** over raw LangChain | Provides explicit graph topology (fan-out/fan-in), typed state management, and deterministic execution order |
| **Fan-out → Content Gen → Supervisor** | 3 analysts run in parallel, then a content writer fixes everything, then the supervisor synthesizes — mirrors a real SEO agency workflow |
| **Graceful degradation** | Every external API service is optional except Gemini. Missing credentials produce informative warnings, not crashes |
| **Provider Agnostic** | The backlink API automatically detects your configured provider (DataForSEO, Semrush, or Ahrefs) and routes to the appropriate module |
| **`uv`** as package manager | Faster than pip, deterministic lockfile (`uv.lock`), and first-class `pyproject.toml` support |
| **Rich** for CLI output | Colored panels, tables, and Markdown rendering directly in the terminal |

---

## 2. Architecture & Data Flow

### High-Level Pipeline

```text
┌─────────────┐     ┌────────────────────────────────────────────────────────────┐     ┌──────────────┐
│             │     │             LangGraph StateGraph                           │     │              │
│   CLI       │     │                                                            │     │  Output      │
│   (main.py) │────▶│  ┌─────────────┐                                          │────▶│  - Terminal  │
│             │     │  │ ingest_data │                                          │     │  - Markdown  │
│  --url      │     │  │  (real APIs)│                                          │     │    Report    │
│  --client   │     │  └──────┬──────┘                                          │     │              │
│  --compet.  │     │         │                                                  │     └──────────────┘
│  --max-pgs  │     │    ┌────┴────┬─────────────┐                              │
└─────────────┘     │    │         │             │                              │
                    │    ▼         ▼             ▼                              │
                    │ ┌────────┐ ┌────────┐ ┌────────┐                         │
                    │ │Technical│ │On-Page │ │Off-Page│  ← Analysis Phase      │
                    │ │ Agent  │ │ Agent  │ │ Agent  │                         │
                    │ └───┬────┘ └───┬────┘ └───┬────┘                         │
                    │     │         │           │                              │
                    │     └────┬────┴───────────┘                              │
                    │          │                                                │
                    │          ▼                                                │
                    │    ┌────────────┐                                         │
                    │    │  Content   │  ← Content Generation Phase            │
                    │    │ Generator  │                                         │
                    │    └─────┬──────┘                                         │
                    │          │                                                │
                    │          ▼                                                │
                    │    ┌────────────┐                                         │
                    │    │ Supervisor │  ← Synthesis Phase                     │
                    │    │ (executive)│                                         │
                    │    └────────────┘                                         │
                    │                                                            │
                    └────────────────────────────────────────────────────────────┘
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
Step 4: Three analyst agents run (conceptually parallel), each:
            - Reads its data slice, serializes to JSON
            - Sends to Gemini with its system prompt
            - Returns a Markdown audit report
            │
            ▼
Step 5: Content Generator Agent reads ALL 3 audit reports and generates:
            ├── Refreshed page copy for decaying content
            ├── Optimized title tags & meta descriptions
            ├── Blog post drafts for keyword gap opportunities
            ├── Fixed JSON-LD schema markup code
            ├── Internal linking copy with anchor text
            └── Outreach email templates
            │
            ▼
Step 6: Supervisor reads all 4 reports, produces:
            ├── Executive Summary (2 paragraphs)
            ├── Priority Action Plan (top 10 tasks)
            ├── Health Score (0-100)
            └── Content Deployment Checklist
            │
            ▼
Step 7: main.py displays all 5 reports in Rich panels, saves to .md file
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
        ├── prompts.py                    # System prompts for all 5 LLM roles
        ├── tools.py                      # Service orchestrator — calls all APIs
        ├── graph.py                      # LangGraph StateGraph definition + compilation
        ├── utils.py                      # Utility functions (LLM response extraction)
        │
        ├── agents/                       # One file per AI agent node
        │   ├── __init__.py
        │   ├── technical.py              # Agent 1: Technical & DevOps Bot
        │   ├── onpage.py                 # Agent 2: On-Page Content Strategist
        │   ├── offpage.py                # Agent 3: Off-Page PR & Security Bot
        │   └── content.py                # Agent 4: SEO Content Generator
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
- Initializes the `ChatGoogleGenerativeAI` LLM (Gemini, temperature 0.3)
- Calls `build_seo_graph(llm)` to compile the LangGraph
- Prepares the initial `AgentState` dict and invokes the graph
- Renders all 5 reports (Technical, On-Page, Off-Page, Content, Executive) in color-coded Rich panels
- Saves the complete audit to a timestamped Markdown file

#### `src/seo_agents/api/main.py`
**Role:** FastAPI backend that serves LangGraph findings.
- Provides RESTful endpoints to connect with the React frontend.
- Uses `motor` (PyMongo) to fetch and persist JSON structured agent data to MongoDB.
- Includes `/api/audit` to trigger audits from the UI.

---

### `src/seo_agents/state.py`
**Role:** Defines the shared state schema that flows through the entire LangGraph.

Contains a single `AgentState` class (a `TypedDict`) with 10 fields:

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
| `content_report` | `str` | Markdown output from the Content Generator |
| `final_report` | `str` | Markdown output from the Supervisor |
| `messages` | `Annotated[list, operator.add]` | Accumulated LLM message history (append-only) |

---

### `src/seo_agents/prompts.py`
**Role:** Contains the exact system prompts for all 5 LLM roles.

| Prompt Constant | Target | Output Sections |
|----------------|--------|-----------------|
| `TECHNICAL_AGENT_PROMPT` | Agent 1 (DevOps Bot) | Crawl Budget Analysis, Redirect Map, Developer Tickets, Schema Alerts |
| `ONPAGE_AGENT_PROMPT` | Agent 2 (Content Strategist) | Decay Alerts, Cannibalization Warnings, CTR Split-Tests, Internal Link Map |
| `OFFPAGE_AGENT_PROMPT` | Agent 3 (PR Bot) | Critical Link Alerts, Disavow Prep, Top 3 Outreach Targets, Outreach Emails, Velocity Report |
| `CONTENT_GENERATOR_PROMPT` | Agent 4 (Content Writer) | Refreshed Page Copy, Optimized Titles/Metas, Blog Post Drafts, Fixed Schema, Internal Linking Copy, Outreach Emails |
| `SUPERVISOR_PROMPT` | Supervisor | Executive Summary, Priority Action Plan, Health Score, Content Deployment Checklist |

---

### `src/seo_agents/tools.py`
**Role:** Service orchestrator — the bridge between the LangGraph and the external API services.

| Function | Services It Calls | Returns |
|----------|-------------------|---------|
| `get_crawl_data()` | `crawler.crawl_site()` + `pagespeed.get_core_web_vitals()` | Crawl results + Core Web Vitals |
| `get_analytics_data()` | `search_console.get_search_analytics()` | Rankings, CTR, decay, cannibalization |
| `get_backlink_data()` | Auto-detects DataForSEO / Semrush / Ahrefs | Backlink profile + competitor gap |
| `get_all_seo_data()` | Calls all three above | Dict with `"crawl_data"`, `"analytics_data"`, `"backlink_data"` |

---

### `src/seo_agents/graph.py`
**Role:** Defines and compiles the LangGraph `StateGraph` — the heart of the multi-agent orchestration.

| Function | Purpose |
|----------|---------|
| `ingest_data_node(state)` | Entry point — calls all APIs and stores raw data |
| `supervisor_node(state, llm)` | Exit point — synthesizes all 4 reports into executive summary |
| `build_seo_graph(llm)` | Builds and compiles the 6-node graph topology |

---

### Agent Files (`src/seo_agents/agents/`)

All agent files follow the same pattern: read state → construct messages → call LLM → return partial state update.

#### `technical.py` — Agent 1: Technical & DevOps Bot
- **Reads:** `state["raw_data"]["crawl_data"]`
- **Writes:** `state["technical_report"]`
- **Focus:** Crawl budget, 404→301 redirects, Core Web Vitals, JSON-LD schema errors

#### `onpage.py` — Agent 2: On-Page Content Strategist
- **Reads:** `state["raw_data"]["analytics_data"]`
- **Writes:** `state["onpage_report"]`
- **Focus:** Traffic decay, keyword cannibalization, low-CTR title tags, orphaned pages

#### `offpage.py` — Agent 3: Off-Page PR & Security Bot
- **Reads:** `state["raw_data"]["backlink_data"]`
- **Writes:** `state["offpage_report"]`
- **Focus:** Toxic domains, disavow file entries, competitor link gaps, outreach emails

#### `content.py` — Agent 4: SEO Content Generator *(NEW)*
- **Reads:** `state["technical_report"]` + `state["onpage_report"]` + `state["offpage_report"]`
- **Writes:** `state["content_report"]`
- **Focus:** Generates actual deployable content that fixes every issue found by the 3 analyst agents

**What the Content Generator produces:**

| Content Type | Based On | Output |
|-------------|----------|--------|
| **Refreshed Page Copy** | On-Page decay alerts | 150-200 word refreshed introductions per decaying page |
| **Optimized Title Tags** | On-Page CTR findings | 3 A/B test variants per page (< 60 chars) + meta descriptions (< 155 chars) |
| **Blog Post Drafts** | Off-Page competitor gaps | Full outlines with H1, target keywords, 5 H2 sections, intro paragraph |
| **Fixed Schema Markup** | Technical schema errors | Corrected JSON-LD code blocks, copy-paste ready |
| **Internal Linking Copy** | On-Page orphaned pages | Contextual sentences with anchor text for insertion into existing pages |
| **Outreach Email Templates** | Off-Page link opportunities | 3-sentence personalized pitch emails with subject lines |

---

### Service Files (`src/seo_agents/services/`)

#### `crawler.py` — Built-in HTTP Crawler
No API key needed. Crawls the site via `httpx` + `BeautifulSoup` to find broken links, schema errors, orphaned pages, and crawl budget waste.

#### `pagespeed.py` — Google PageSpeed Insights API
Uses `GOOGLE_API_KEY`. Fetches Core Web Vitals (LCP, FID, CLS, INP) and optimization opportunities.

#### `search_console.py` — Google Search Console API
Uses OAuth2 service account (`GSC_CREDENTIALS_PATH`). Fetches keyword rankings, CTR, traffic decay, and cannibalization.

#### Backlink API Providers (Auto-Selected)
The system supports three backlink APIs. `tools.py` checks your `.env` and routes to whichever is configured:

| Provider | File | Auth | Cost |
|----------|------|------|------|
| **DataForSEO** | `dataforseo.py` | Login + Password | ~$0.002/task (recommended) |
| **Semrush** | `semrush.py` | API Key | Business plan ($499/mo) |
| **Ahrefs** | `ahrefs.py` | Bearer Token | Enterprise plan ($1,499/mo) |

---

## 5. The Four AI Agents + Supervisor

### Agent 1: Technical & DevOps Bot

| Aspect | Detail |
|--------|--------|
| **File** | `agents/technical.py` |
| **Data source** | `crawl_data` (crawler + PageSpeed) |
| **Persona** | Lead Technical SEO Agent |
| **Tone** | Highly technical, includes code snippets |
| **Output** | Crawl Budget Analysis, Redirect Map, Developer Tickets, Schema Alerts |

### Agent 2: On-Page Content Strategist

| Aspect | Detail |
|--------|--------|
| **File** | `agents/onpage.py` |
| **Data source** | `analytics_data` (Google Search Console) |
| **Persona** | Lead On-Page SEO Agent |
| **Tone** | Strategic, ROI-focused |
| **Output** | Decay Alerts, Cannibalization Warnings, CTR Split-Tests, Internal Link Map |

### Agent 3: Off-Page PR & Security Bot

| Aspect | Detail |
|--------|--------|
| **File** | `agents/offpage.py` |
| **Data source** | `backlink_data` (DataForSEO / Semrush / Ahrefs) |
| **Persona** | Lead Off-Page Agent |
| **Tone** | Analytical, includes domain authority scores |
| **Output** | Critical Link Alerts, Disavow Prep, Outreach Targets, Outreach Emails, Velocity Report |

### Agent 4: SEO Content Generator *(NEW)*

| Aspect | Detail |
|--------|--------|
| **File** | `agents/content.py` |
| **Data source** | All 3 analyst agent reports |
| **Persona** | SEO Content Writer |
| **Tone** | Professional, engaging, copy-paste ready |
| **Output** | Refreshed Page Copy, Optimized Titles/Metas, Blog Drafts, Fixed Schema, Linking Copy, Outreach Emails |

### Supervisor (Agent 5)

| Aspect | Detail |
|--------|--------|
| **File** | `graph.py` (inline function) |
| **Data source** | All 4 agent reports |
| **Persona** | SEO Audit Supervisor |
| **Output** | Executive Summary, Top 10 Priority Action Plan, Health Score (0-100), Content Deployment Checklist |

---

## 6. External Services & API Integrations

| Service | Auth | What It Provides | Required? |
|---------|------|------------------|-----------|
| **Google Gemini** | `GOOGLE_API_KEY` | LLM inference for all 5 agent prompts | **YES** |
| **Site Crawler** | None (built-in) | Broken pages, schema, internal links, page metadata | Always on |
| **PageSpeed Insights** | `GOOGLE_API_KEY` | LCP, FID, INP, CLS, score, optimization suggestions | Same key as Gemini |
| **Search Console** | `GSC_CREDENTIALS_PATH` | Keyword rankings, clicks, impressions, CTR, position changes | Optional |
| **DataForSEO** | `DATAFORSEO_LOGIN` | Backlink profiles, toxic domains, competitor gap | Optional* |
| **Semrush** | `SEMRUSH_API_KEY` | Backlinks, referring domains, domain score | Optional* |
| **Ahrefs** | `AHREFS_API_KEY` | Domain Rating, backlinks, referring domains | Optional* |

*\*Configure ONE of the three backlink providers.*

---

## 7. How Everything Connects

### The Call Chain (in execution order)

```python
# 1. main.py
main()
  ├── load_dotenv()                  # Load .env credentials
  ├── print_api_status()             # Show which APIs are configured
  ├── ChatGoogleGenerativeAI(...)    # Init LLM
  ├── build_seo_graph(llm)           # Compile LangGraph
  └── compiled_graph.invoke(state)   # Execute the pipeline
        │
        # 2. Data Collection
        ├── ingest_data_node(state)
        │     └── get_all_seo_data(url, max_pages, competitors)
        │
        # 3. Analysis (fan-out — conceptually parallel)
        ├── technical_agent_node(state, llm)   → technical_report
        ├── onpage_agent_node(state, llm)      → onpage_report
        ├── offpage_agent_node(state, llm)     → offpage_report
        │
        # 4. Content Generation (fan-in — reads all 3 reports)
        ├── content_generator_node(state, llm) → content_report
        │
        # 5. Executive Synthesis
        └── supervisor_node(state, llm)        → final_report
```

---

## 8. LangGraph Internals

### Graph Definition

```python
graph = StateGraph(AgentState)

# 6 nodes
graph.add_node("ingest_data",        ingest_data_node)
graph.add_node("technical_agent",     partial(technical_agent_node, llm=llm))
graph.add_node("onpage_agent",        partial(onpage_agent_node, llm=llm))
graph.add_node("offpage_agent",       partial(offpage_agent_node, llm=llm))
graph.add_node("content_generator",   partial(content_generator_node, llm=llm))
graph.add_node("supervisor",          partial(supervisor_node, llm=llm))

# Entry → Fan-out to 3 analysts
graph.set_entry_point("ingest_data")
graph.add_edge("ingest_data", "technical_agent")
graph.add_edge("ingest_data", "onpage_agent")
graph.add_edge("ingest_data", "offpage_agent")

# Fan-in → Content Generator
graph.add_edge("technical_agent", "content_generator")
graph.add_edge("onpage_agent",    "content_generator")
graph.add_edge("offpage_agent",   "content_generator")

# Content → Supervisor → END
graph.add_edge("content_generator", "supervisor")
graph.add_edge("supervisor", END)
```

---

## 9. Environment Variables

| Variable | Required | Service | How to Get It |
|----------|----------|---------|---------------|
| `GOOGLE_API_KEY` | **YES** | Gemini LLM + PageSpeed | [Google AI Studio](https://aistudio.google.com/apikey) — free |
| `GSC_CREDENTIALS_PATH` | No | Google Search Console | Create a GCP service account, download JSON |
| `DATAFORSEO_LOGIN` | No* | DataForSEO (Backlinks) | [Sign up](https://app.dataforseo.com/register) — $1 free credit |
| `DATAFORSEO_PASSWORD` | No* | DataForSEO (Backlinks) | Found in DataForSEO dashboard |
| `SEMRUSH_API_KEY` | No* | Semrush (Backlinks) | Semrush Account → API Units (Business plan) |
| `AHREFS_API_KEY` | No* | Ahrefs (Backlinks) | Ahrefs Account → API Keys (Enterprise plan) |

*\*Configure ONE of the three backlink providers.*

---

## 10. Dependencies

All managed via `uv` in `pyproject.toml`:

| Package | Version | Purpose |
|---------|---------|---------|
| `langgraph` | ≥1.1.6 | Multi-agent graph orchestration |
| `langchain-google-genai` | ≥4.2.1 | Google Gemini LLM wrapper |
| `httpx` | ≥0.28.1 | HTTP client for crawler & APIs |
| `beautifulsoup4` | ≥4.14.3 | HTML parsing for site crawler |
| `lxml` | ≥6.0.2 | Fast HTML parser backend |
| `google-api-python-client` | ≥2.193.0 | Google Search Console API |
| `python-dotenv` | ≥1.2.2 | Load `.env` files |
| `rich` | ≥14.3.3 | Terminal output formatting |
| `fastapi` | latest | Backend API framework |
| `uvicorn` | latest | ASGI server |
| `pymongo` | latest | MongoDB synchronous client |
| `motor` | latest | MongoDB asynchronous client |

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

### Run the FastAPI Backend & MongoDB API
```bash
uv run uvicorn src.seo_agents.api.main:app --host 0.0.0.0 --port 8000
```
*(The backend fetches the agents' JSON structures and feeds the frontend React UI)*

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

The system produces **5 reports** rendered as color-coded Rich panels in the terminal:

| # | Report | Color | Content |
|---|--------|-------|---------|
| 1 | 🔧 Technical & DevOps | Blue | Crawl budget, redirects, dev tickets, schema alerts |
| 2 | 📝 On-Page Content | Magenta | Decay alerts, cannibalization, CTR tests, internal links |
| 3 | 🔗 Off-Page & PR | Yellow | Toxic links, disavow prep, outreach targets, velocity |
| 4 | ✍️ Content Generator | Cyan | **Ready-to-deploy content** — refreshed copy, titles, blog drafts, schema fixes |
| 5 | 🏆 Executive Summary | Green | Health score, priority action plan, deployment checklist |

All reports are also saved to `seo_audit_report_{client_name}.md`.
