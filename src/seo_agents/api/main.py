from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
from contextlib import asynccontextmanager
from src.seo_agents.graph import build_seo_graph
from src.seo_agents.structured_data_extractor import (
    build_technical_data,
    build_onpage_data,
    build_offpage_data,
    build_content_data,
    extract_action_items_from_report,
)
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_groq import ChatGroq
from pydantic import BaseModel
from typing import List, Optional
import uuid

from dotenv import load_dotenv

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.mongodb_client = AsyncIOMotorClient(
        os.getenv("MONGO_URI", "mongodb://localhost:27017")
    )
    app.mongodb = app.mongodb_client["seo_agent_db"]
    yield
    # Shutdown
    app.mongodb_client.close()


app = FastAPI(title="Ezydrag SEO Agent API", lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


class AuditRequest(BaseModel):
    url: str
    client_name: str
    competitors: List[str] = []
    max_pages: int = 50


class CompanyCreate(BaseModel):
    name: str
    domain: str
    competitors: Optional[List[str]] = []


@app.post("/api/companies")
async def create_company(company: CompanyCreate, background_tasks: BackgroundTasks):
    check_backlink_keys()

    if company.competitors:
        # User provided competitors, verify backlink keys
        dfs_ok = bool(
            os.getenv("DATAFORSEO_LOGIN") and os.getenv("DATAFORSEO_PASSWORD")
        )
        sem_ok = bool(os.getenv("SEMRUSH_API_KEY"))
        ahr_ok = bool(os.getenv("AHREFS_API_KEY"))
        any_backlink = dfs_ok or sem_ok or ahr_ok
        if not any_backlink:
            raise HTTPException(
                status_code=400,
                detail="Backlink API keys are required to use the Competitors feature. Please set DATAFORSEO_LOGIN/PASSWORD, SEMRUSH_API_KEY, or AHREFS_API_KEY in backend .env.",
            )

    company_id = "client-" + str(uuid.uuid4())[:8]
    doc = {
        "id": company_id,
        "name": company.name,
        "domain": company.domain,
        "logo": company.name[0].upper() if company.name else "C",
        "competitors": company.competitors,
        "status": "running",
        "current_step": "Technical Analysis",
    }
    await app.mongodb["companies"].insert_one(doc)
    doc["_id"] = str(doc["_id"])

    # Trigger audit automatically when company is added
    req = AuditRequest(
        url=f"https://{company.domain}"
        if not company.domain.startswith("http")
        else company.domain,
        client_name=company.name,
        competitors=company.competitors,
        max_pages=50,
    )
    background_tasks.add_task(run_and_save_audit, req, company_id)
    return doc


import os

@app.get("/api/health")
async def health_check():
    dfs_ok = bool(os.getenv("DATAFORSEO_LOGIN") and os.getenv("DATAFORSEO_PASSWORD"))
    sem_ok = bool(os.getenv("SEMRUSH_API_KEY"))
    ahr_ok = bool(os.getenv("AHREFS_API_KEY"))
    has_offpage_api = dfs_ok or sem_ok or ahr_ok
    
    gsc_path = os.getenv("GSC_CREDENTIALS_PATH", "credentials.json")
    has_onpage_api = os.path.exists(gsc_path)

    return {
        "status": "ok", 
        "timestamp": time.time(),
        "has_offpage_api": has_offpage_api,
        "has_onpage_api": has_onpage_api
    }


@app.get("/api/companies")
async def get_companies():
    try:
        cursor = app.mongodb["companies"].find()
        companies = await cursor.to_list(length=100)
        for c in companies:
            c.pop("_id", None)
        return companies
    except Exception as e:
        print(f"Error fetching companies: {e}")
        return []


@app.delete("/api/companies/{company_id}")
async def delete_company(company_id: str):
    result = await app.mongodb["companies"].delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    # optionally delete its data
    await app.mongodb["technical"].delete_many({"company_id": company_id})
    await app.mongodb["onpage"].delete_many({"company_id": company_id})
    await app.mongodb["offpage"].delete_many({"company_id": company_id})
    await app.mongodb["content"].delete_many({"company_id": company_id})
    return {"status": "deleted"}


def check_backlink_keys():
    # just a helper
    pass


@app.post("/api/audit")
async def trigger_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_and_save_audit, request, "global")
    return {"status": "Audit started in background"}


async def run_and_save_audit(req: AuditRequest, company_id: str):
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",  # keeping it to available
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.3,
    )
    # llm = ChatGroq(
    #     model="openai/gpt-oss-120b",
    #     temperature=0.3,
    #     api_key=os.getenv("GROQ_API_KEY"),
    #     max_tokens=1024,
    # )
    graph = build_seo_graph(llm)

    initial_state = {
        "website_url": req.url,
        "client_name": req.client_name,
        "competitors": req.competitors,
        "max_pages": req.max_pages,
        "raw_data": {},
        "technical_report": "",
        "onpage_report": "",
        "offpage_report": "",
        "content_report": "",
        "final_report": "",
        "messages": [],
    }

    # Update progress
    await app.mongodb["companies"].update_one(
        {"id": company_id}, {"$set": {"current_step": "Multi-Agent Synthesis"}}
    )

    try:
        # Run graph
        result = graph.invoke(initial_state)
        raw = result.get("raw_data", {})

        # ────────────────────────────────────────────────────────────
        # Transform raw data into frontend-compatible structured JSON
        # using the structured_data_extractor module
        # ────────────────────────────────────────────────────────────

        await app.mongodb["companies"].update_one(
            {"id": company_id}, {"$set": {"current_step": "Building Dashboard Data"}}
        )

        # 1. Technical Data — charts, CWV panel, broken pages, schema
        tech_structured = build_technical_data(raw, req.url)
        tech_doc = {"company_id": company_id, **tech_structured}
        await app.mongodb["technical"].update_one(
            {"company_id": company_id}, {"$set": tech_doc}, upsert=True
        )

        # 2. On-Page Data — decay, cannibalization, CTR, orphans, traffic chart
        onpage_structured = build_onpage_data(raw, req.url)
        onpage_doc = {"company_id": company_id, **onpage_structured}
        await app.mongodb["onpage"].update_one(
            {"company_id": company_id}, {"$set": onpage_doc}, upsert=True
        )

        # 3. Off-Page Data — backlinks table, velocity chart, toxicity pie, actions
        offpage_structured = build_offpage_data(raw, req.url)

        # Enhance action items with LLM extraction from reports
        offpage_report = result.get("offpage_report", "")
        technical_report = result.get("technical_report", "")
        if offpage_report and len(offpage_structured.get("actionItems", [])) < 3:
            try:
                llm_actions = extract_action_items_from_report(
                    offpage_report, technical_report, llm, req.url
                )
                if llm_actions:
                    # Merge: keep existing + add LLM-generated ones
                    existing_ids = {a["id"] for a in offpage_structured["actionItems"]}
                    for action in llm_actions:
                        action_id = action.get("id", f"act-llm-{len(existing_ids) + 1}")
                        if action_id not in existing_ids:
                            offpage_structured["actionItems"].append(action)
                            existing_ids.add(action_id)
            except Exception as e:
                print(f"LLM action extraction failed (non-critical): {e}")

        offpage_doc = {"company_id": company_id, **offpage_structured}
        await app.mongodb["offpage"].update_one(
            {"company_id": company_id}, {"$set": offpage_doc}, upsert=True
        )

        # 4. Content Data — topics, drafts, pipeline chart, CMS connections
        content_report = result.get("content_report", "")
        content_structured = build_content_data(raw, req.url, content_report)
        content_doc = {"company_id": company_id, **content_structured}
        await app.mongodb["content"].update_one(
            {"company_id": company_id}, {"$set": content_doc}, upsert=True
        )

        # Save the markdown reports into MongoDB
        document = {
            "client_name": req.client_name,
            "company_id": company_id,
            "url": req.url,
            "timestamp": time.time(),
            "technical_report": result.get("technical_report"),
            "onpage_report": result.get("onpage_report"),
            "offpage_report": result.get("offpage_report"),
            "content_report": result.get("content_report"),
            "final_report": result.get("final_report"),
        }

        # Update progress
        await app.mongodb["companies"].update_one(
            {"id": company_id}, {"$set": {"current_step": "Saving Results"}}
        )

        # Using pymongo to insert
        await app.mongodb["audits"].insert_one(document)

        # Update company status to completed
        await app.mongodb["companies"].update_one(
            {"id": company_id},
            {"$set": {"status": "completed", "current_step": "Finished"}},
        )
    except Exception as e:
        print(f"Error during audit for {req.client_name}: {e}")
        # Don't save partial data - clean up any collections we might have touched
        await app.mongodb["technical"].delete_many({"company_id": company_id})
        await app.mongodb["onpage"].delete_many({"company_id": company_id})
        await app.mongodb["offpage"].delete_many({"company_id": company_id})
        await app.mongodb["content"].delete_many({"company_id": company_id})
        await app.mongodb["audits"].delete_many({"company_id": company_id})

        await app.mongodb["companies"].update_one(
            {"id": company_id},
            {
                "$set": {
                    "status": "error",
                    "current_step": f"Audit Failed: {str(e)[:50]}",
                }
            },
        )


@app.get("/api/reports/latest")
async def get_latest_report():
    report = await app.mongodb["audits"].find_one(sort=[("timestamp", -1)])
    if report:
        report["_id"] = str(report["_id"])
        return report
    return {"message": "No reports found"}


# --- Endpoints to mock frontend structured data ---
# According to instructions, we must serve the frontend data structure via API.
# We'll fetch this from MongoDB, but since the agents return markdown, we should ideally parse it.
# For now, to ensure the frontend continues to work and the terminal works,
# we'll save the mock structures into our DB as defaults if they don't exist,
# and serve them through endpoints. Alternatively, we could parse the markdown into JSON.


@app.get("/api/technical")
async def get_technical(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    doc = await app.mongodb["technical"].find_one(query)
    if not doc:
        doc = await app.mongodb["technical"].find_one()

    if not doc:
        return {
            "technicalKpis": {
                "crawlEfficiency": {"value": 0, "change": 0},
                "brokenPages": {"value": 0, "change": 0},
                "avgPageSpeed": {"value": 0, "change": 0},
                "schemaErrors": {"value": 0, "change": 0},
            },
            "crawlLogEntries": [],
            "brokenPages": [],
            "schemaIssues": [],
            "coreWebVitals": [],
            "crawlBudgetStats": {
                "totalCrawls24h": 0,
                "wastedCrawls": 0,
                "wastedPercent": 0,
                "avgResponseTime": 0,
                "robotsTxtRules": 0,
            },
            "crawlTrendData": [],
        }
    doc.pop("_id", None)
    return doc


@app.get("/api/onpage")
async def get_onpage(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    doc = await app.mongodb["onpage"].find_one(query)
    if not doc:
        doc = await app.mongodb["onpage"].find_one()

    if not doc:
        return {
            "onPageKpis": {
                "decayingPages": {"value": 0, "change": 0},
                "cannibalizationIssues": {"value": 0, "change": 0},
                "ctrGap": {"value": 0, "change": 0},
                "orphanedPages": {"value": 0, "change": 0},
            },
            "decayingPages": [],
            "cannibalizationPairs": [],
            "ctrOpportunities": [],
            "orphanedPages": [],
            "trafficTrendData": [],
        }
    doc.pop("_id", None)
    return doc


@app.get("/api/offpage")
async def get_offpage(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    doc = await app.mongodb["offpage"].find_one(query)
    if not doc:
        doc = await app.mongodb["offpage"].find_one()

    if not doc:
        return {
            "kpiData": {
                "totalBacklinks": {"value": 0, "change": 0},
                "referringDomains": {"value": 0, "change": 0},
                "toxicLinks": {"value": 0, "change": 0},
                "lostLinks": {"value": 0, "change": 0},
                "organicTraffic": {"value": 0, "change": 0},
                "seoHealth": {"value": 0, "change": 0},
                "topKeywords": {"value": 0, "change": 0},
            },
            "backlinks": [],
            "actionItems": [],
            "backlinkVelocityData": [],
            "toxicityBreakdown": [],
        }
    doc.pop("_id", None)
    return doc


@app.get("/api/content")
async def get_content(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    doc = await app.mongodb["content"].find_one(query)
    if not doc:
        doc = await app.mongodb["content"].find_one()

    if not doc:
        return {
            "contentKpis": {
                "topicsDiscovered": {"value": 0, "change": 0},
                "draftsGenerated": {"value": 0, "change": 0},
                "postsPublished": {"value": 0, "change": 0},
                "avgSeoScore": {"value": 0, "change": 0},
            },
            "discoveredTopics": [],
            "contentDrafts": [],
            "cmsConnections": [],
            "contentPipelineData": [],
        }
    doc.pop("_id", None)
    return doc


@app.get("/api/dashboard")
async def get_dashboard(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    doc = await app.mongodb["dashboard"].find_one(query)
    if not doc:
        doc = await app.mongodb["dashboard"].find_one()
    if not doc:
        return {}
    doc.pop("_id", None)
    return doc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.seo_agents.api.main:app", host="0.0.0.0", port=8000, reload=True)
