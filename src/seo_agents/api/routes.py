from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
from src.seo_agents.api.api_main import app

# We will implement this as a router that provides the GET routes that the frontend expects
router = APIRouter()

# these routes will just fetch the latest inserted structured data for that agent
@router.get("/technical")
async def get_technical():
    doc = await app.mongodb["technical"].find_one(sort=[("timestamp", -1)])
    if doc:
        doc.pop("_id", None)
        return doc
    return {}

@router.get("/onpage")
async def get_onpage():
    doc = await app.mongodb["onpage"].find_one(sort=[("timestamp", -1)])
    if doc:
        doc.pop("_id", None)
        return doc
    return {}

@router.get("/offpage")
async def get_offpage():
    doc = await app.mongodb["offpage"].find_one(sort=[("timestamp", -1)])
    if doc:
        doc.pop("_id", None)
        return doc
    return {}

@router.get("/content")
async def get_content():
    doc = await app.mongodb["content"].find_one(sort=[("timestamp", -1)])
    if doc:
        doc.pop("_id", None)
        return doc
    return {}

@router.get("/dashboard")
async def get_dashboard():
    doc = await app.mongodb["dashboard"].find_one(sort=[("timestamp", -1)])
    if doc:
        doc.pop("_id", None)
        return doc
    return {}
