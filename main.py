"""
Ezydrag AI SEO Suite — Demo Entry Point

Runs all 4 SEO agents (Technical, On-Page, Off-Page, Content Generator)
against a REAL website using LangGraph + Google Gemini, with live data from:
  - Site Crawler (built-in, no key needed)
  - Google PageSpeed Insights API
  - Google Search Console API
  - DataForSEO / Semrush / Ahrefs API

Usage:
    uv run python main.py --url https://example.com --client "My Client"
    uv run python main.py --url https://example.com --client "Acme" --competitors "comp1.com,comp2.com"
    uv run python main.py --url https://example.com --client "Acme" --max-pages 100
"""

from __future__ import annotations

import argparse
import os
import sys
import time

from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from rich.rule import Rule
from rich.table import Table

load_dotenv()

console = Console()


def print_banner():
    """Print a stylish startup banner."""
    banner = """

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗███████╗██╗   ██╗██████╗ ██████╗  █████╗  ██████╗  ║
║   ██╔════╝╚══███╔╝╚██╗ ██╔╝██╔══██╗██╔══██╗██╔══██╗██╔════╝  ║
║   █████╗    ███╔╝  ╚████╔╝ ██║  ██║██████╔╝███████║██║  ███╗ ║
║   ██╔══╝   ███╔╝   ╚██╔╝  ██║  ██║██╔══██╗██╔══██║██║   ██║║ ║
║   ███████╗███████╗   ██║   ██████╔╝██║  ██║██║  ██║╚██████╔╝ ║
║   ╚══════╝╚══════╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ║
║                                                              ║
║          AI SEO Suite — Multi-Agent Audit System             ║
║          Powered by LangGraph + Google Gemini                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """
    console.print(banner, style="bold cyan")


def print_api_status():
    """Show which API services are configured and which are missing."""
    table = Table(title="🔌 API Service Status", show_header=True, header_style="bold")
    table.add_column("Service", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("Env Variable")

    # Gemini
    gemini_key = os.getenv("GOOGLE_API_KEY", "")
    gemini_ok = gemini_key and gemini_key != "your-gemini-api-key-here"
    table.add_row(
        "Google Gemini (LLM)",
        "[green]✅ Configured[/green]" if gemini_ok else "[red]❌ Missing (REQUIRED)[/red]",
        "GOOGLE_API_KEY",
    )

    # Site Crawler (always available)
    table.add_row(
        "Site Crawler",
        "[green]✅ Built-in[/green]",
        "No key needed",
    )

    # PageSpeed (uses same Google API key)
    table.add_row(
        "PageSpeed Insights",
        "[green]✅ Configured[/green]" if gemini_ok else "[yellow]⚠️ Needs GOOGLE_API_KEY[/yellow]",
        "GOOGLE_API_KEY",
    )

    # Search Console
    gsc_path = os.getenv("GSC_CREDENTIALS_PATH", "")
    gsc_ok = gsc_path and os.path.exists(gsc_path)
    table.add_row(
        "Google Search Console",
        "[green]✅ Configured[/green]" if gsc_ok else "[yellow]⚠️ Optional (skipped)[/yellow]",
        "GSC_CREDENTIALS_PATH",
    )

    # Backlink Providers — detect which one is active
    dfs_ok = bool(os.getenv("DATAFORSEO_LOGIN") and os.getenv("DATAFORSEO_PASSWORD"))
    sem_ok = bool(os.getenv("SEMRUSH_API_KEY"))
    ahr_ok = bool(os.getenv("AHREFS_API_KEY"))
    any_backlink = dfs_ok or sem_ok or ahr_ok

    # Show the active provider with a checkmark, others as available options
    active_label = ""
    if dfs_ok:
        active_label = " [bold](ACTIVE)[/bold]"
    table.add_row(
        f"DataForSEO{active_label}",
        "[green]✅ Configured[/green]" if dfs_ok else "[dim]Not configured[/dim]",
        "DATAFORSEO_LOGIN + PASSWORD",
    )

    active_label = ""
    if sem_ok and not dfs_ok:
        active_label = " [bold](ACTIVE)[/bold]"
    table.add_row(
        f"Semrush{active_label}",
        "[green]✅ Configured[/green]" if sem_ok else "[dim]Not configured[/dim]",
        "SEMRUSH_API_KEY",
    )

    active_label = ""
    if ahr_ok and not dfs_ok and not sem_ok:
        active_label = " [bold](ACTIVE)[/bold]"
    table.add_row(
        f"Ahrefs{active_label}",
        "[green]✅ Configured[/green]" if ahr_ok else "[dim]Not configured[/dim]",
        "AHREFS_API_KEY",
    )

    if not any_backlink:
        table.add_row(
            "",
            "[yellow]⚠️ No backlink provider — off-page data skipped[/yellow]",
            "",
        )

    console.print(table)
    console.print()

    return gemini_ok


def run_audit(website_url: str, client_name: str, competitors: list[str], max_pages: int):
    """Run the full multi-agent SEO audit with real data."""

    # ── Validate API key ────────────────────────────────────────────────
    gemini_ok = print_api_status()
    if not gemini_ok:
        console.print(
            Panel(
                "[bold red]ERROR:[/bold red] GOOGLE_API_KEY not set!\n\n"
                "1. Copy [cyan].env.example[/cyan] to [cyan].env[/cyan]\n"
                "2. Add your Gemini API key to the [cyan].env[/cyan] file\n"
                "3. Get a key at: [link]https://aistudio.google.com/apikey[/link]",
                title="⚠️  Missing API Key",
                border_style="red",
            )
        )
        sys.exit(1)

    # ── Initialize LLM ─────────────────────────────────────────────────
    from langchain_google_genai import ChatGoogleGenerativeAI
    # from langchain_groq import ChatGroq

    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.3,
    )


    # llm = ChatGroq(
    #     model="openai/gpt-oss-120b",
    #     temperature=0.3,
    #     api_key=os.getenv("GROQ_API_KEY"),
    # )

    console.print(
        Panel(
            f"[bold]Client:[/bold] {client_name}\n"
            f"[bold]Website:[/bold] {website_url}\n"
            f"[bold]Competitors:[/bold] {', '.join(competitors) if competitors else 'None specified'}\n"
            f"[bold]Max Pages to Crawl:[/bold] {max_pages}\n"
            f"[bold]LLM:[/bold] Gemini 3 Flash Preview\n"
            f"[bold]Framework:[/bold] LangGraph (Fan-out → Fan-in)",
            title="📋 Audit Configuration",
            border_style="green",
        )
    )

    # ── Build the graph ─────────────────────────────────────────────────
    from src.seo_agents.graph import build_seo_graph

    compiled_graph = build_seo_graph(llm)

    # ── Prepare initial state ───────────────────────────────────────────
    initial_state = {
        "website_url": website_url,
        "client_name": client_name,
        "competitors": competitors,
        "max_pages": max_pages,
        "raw_data": {},
        "technical_report": "",
        "onpage_report": "",
        "offpage_report": "",
        "content_report": "",
        "final_report": "",
        "messages": [],
    }

    # ── Execute the graph ───────────────────────────────────────────────
    console.print()
    console.print(Rule("[bold yellow]🚀 Starting Multi-Agent SEO Audit[/bold yellow]"))
    console.print()
    console.print(
        "[dim]Phase 1: Data collection (crawling site, calling APIs...)\n"
        "Phase 2: Analysis agents (Technical → On-Page → Off-Page)\n"
        "Phase 3: Content generation (fixes for all issues found)\n"
        "Phase 4: Supervisor synthesis (Executive Report)\n[/dim]"
    )
    console.print()

    start_time = time.time()

    result = compiled_graph.invoke(initial_state)

    elapsed = time.time() - start_time

    # ── Display Results ─────────────────────────────────────────────────
    console.print()
    console.print(Rule("[bold green]✅ Audit Complete[/bold green]"))
    console.print(
        f"[dim]Completed in {elapsed:.1f}s across 4 agents + supervisor[/dim]\n"
    )

    # Technical Report
    console.print(
        Panel(
            Markdown(result.get("technical_report", "No report generated.")),
            title="🔧 Agent 1: Technical & DevOps Report",
            border_style="blue",
            padding=(1, 2),
        )
    )

    # On-Page Report
    console.print(
        Panel(
            Markdown(result.get("onpage_report", "No report generated.")),
            title="📝 Agent 2: On-Page Content Report",
            border_style="magenta",
            padding=(1, 2),
        )
    )

    # Off-Page Report
    console.print(
        Panel(
            Markdown(result.get("offpage_report", "No report generated.")),
            title="🔗 Agent 3: Off-Page & PR Report",
            border_style="yellow",
            padding=(1, 2),
        )
    )

    # Final Executive Summary
    console.print(
        Panel(
            Markdown(result.get("final_report", "No report generated.")),
            title="🏆 Executive Summary — Supervisor Report",
            border_style="bold green",
            padding=(1, 2),
        )
    )

    # Content Generator Report
    console.print(
        Panel(
            Markdown(result.get("content_report", "No content generated.")),
            title="✍️  Agent 4: Content Generator — Ready-to-Deploy Content",
            border_style="bold cyan",
            padding=(1, 2),
        )
    )

    # ── Save report to file ─────────────────────────────────────────────
    report_path = f"seo_audit_report_{client_name.lower().replace(' ', '_')}.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# SEO Audit Report — {client_name}\n")
        f.write(f"**Website:** {website_url}\n")
        f.write(f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        if competitors:
            f.write(f"**Competitors Analyzed:** {', '.join(competitors)}\n")
        f.write("\n---\n\n")
        f.write("## 🔧 Technical & DevOps Report\n\n")
        f.write(result.get("technical_report", "N/A") + "\n\n---\n\n")
        f.write("## 📝 On-Page Content Report\n\n")
        f.write(result.get("onpage_report", "N/A") + "\n\n---\n\n")
        f.write("## 🔗 Off-Page & PR Report\n\n")
        f.write(result.get("offpage_report", "N/A") + "\n\n---\n\n")
        f.write("## ✍️  Content Generator — Ready-to-Deploy Content\n\n")
        f.write(result.get("content_report", "N/A") + "\n\n---\n\n")
        f.write("## 🏆 Executive Summary\n\n")
        f.write(result.get("final_report", "N/A") + "\n")

    console.print(
        Panel(
            f"[bold green]Report saved to:[/bold green] [cyan]{report_path}[/cyan]",
            border_style="green",
        )
    )


def main():
    parser = argparse.ArgumentParser(
        description="Ezydrag AI SEO Suite — Multi-Agent Audit (Production)"
    )
    parser.add_argument(
        "--url",
        required=True,
        help="Target website URL to audit (e.g., https://example.com)",
    )
    parser.add_argument(
        "--client",
        required=True,
        help='Client name for the report (e.g., "Acme Plumbing")',
    )
    parser.add_argument(
        "--competitors",
        default="",
        help='Comma-separated competitor domains (e.g., "comp1.com,comp2.com,comp3.com")',
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=50,
        help="Maximum pages to crawl (default: 50)",
    )
    args = parser.parse_args()

    # Parse competitors
    competitors = [c.strip() for c in args.competitors.split(",") if c.strip()] if args.competitors else []

    print_banner()
    run_audit(args.url, args.client, competitors, args.max_pages)


if __name__ == "__main__":
    main()
