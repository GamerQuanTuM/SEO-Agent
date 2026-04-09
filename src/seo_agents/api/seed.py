import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Let's seed MongoDB with the initial structure for each page
from dotenv import load_dotenv
load_dotenv()
async def seed_db():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client["seo_agent_db"]
    
    # 1. Technical Data
    technical_data = {
        "timestamp": 0,
        "crawlLogEntries": [
          { "id": "cl-1", "url": "/wp-admin/admin-ajax.php", "statusCode": 200, "botType": "Googlebot", "crawledAt": "2024-03-28T08:12:00Z", "responseTime": 420, "isLowValue": True, "suggestedAction": "Disallow /wp-admin/ in robots.txt" },
          { "id": "cl-4", "url": "/services/seo-audit", "statusCode": 200, "botType": "Googlebot", "crawledAt": "2024-03-28T06:45:00Z", "responseTime": 180, "isLowValue": False }
        ],
        "brokenPages": [
          { "id": "bp-1", "url": "/services/old-seo-package", "statusCode": 404, "inboundLinks": 14, "topReferrer": "searchenginejournal.com", "suggestedRedirect": "/services/seo-audit", "redirectCode": "Redirect 301 /services/old-seo-package /services/seo-audit", "status": "pending" }
        ],
        "coreWebVitals": [
          { "metric": "LCP", "label": "Largest Contentful Paint", "value": 3.2, "unit": "s", "rating": "needs-improvement", "threshold": { "good": 2.5, "poor": 4.0 }, "culprit": "Hero image /images/hero-banner.webp (1.8 MB uncompressed)" }
        ],
        "schemaIssues": [
          { "id": "si-1", "pageUrl": "/services/seo-audit", "schemaType": "Service", "issue": "Missing 'provider' property — required for rich snippets", "severity": "error", "fix": "Add provider", "status": "open" }
        ],
        "crawlBudgetStats": {
          "totalCrawls24h": 342, "wastedCrawls": 87, "wastedPercent": 25.4, "avgResponseTime": 340, "robotsTxtRules": 4
        },
        "technicalKpis": {
          "crawlEfficiency": { "value": 74.6, "change": -3.2 }, "brokenPages": { "value": 5, "change": 25 }, "avgPageSpeed": { "value": 2.1, "change": -8.5 }, "schemaErrors": { "value": 2, "change": -50 }
        },
        "crawlTrendData": [
          { "day": "Mon", "valuable": 48, "wasted": 15 },
          { "day": "Tue", "valuable": 52, "wasted": 18 }
        ]
    }
    
    # 2. OnPage Data
    onpage_data = {
        "timestamp": 0,
        "decayingPages": [],
        "cannibalizationPairs": [],
        "ctrOpportunities": [],
        "orphanedPages": [],
        "onPageKpis": {
          "decayingPages": { "value": 4, "change": 33.3 }, "cannibalizationIssues": { "value": 2, "change": -50 }, "ctrGap": { "value": 5.2, "change": -12.1 }, "orphanedPages": { "value": 3, "change": 0 }
        },
        "trafficTrendData": []
    }
    
    # 3. OffPage Data
    offpage_data = {
        "timestamp": 0,
        "backlinks": [],
        "actionItems": [],
        "backlinkVelocityData": [],
        "toxicityBreakdown": [],
        "kpiData": {
          "organicTraffic": { "value": 24580, "change": 12.4 },
          "seoHealth": { "value": 87, "change": 3.2 },
          "topKeywords": { "value": 42, "change": -2.1 },
          "totalBacklinks": { "value": 185, "change": 8.7 },
          "toxicLinks": { "value": 3, "change": 50 },
          "lostLinks": { "value": 2, "change": -33 },
          "referringDomains": { "value": 112, "change": 5.2 }
        }
    }
    
    # 4. Content Data
    content_data = {
        "timestamp": 0,
        "discoveredTopics": [],
        "contentDrafts": [],
        "cmsConnections": [],
        "contentKpis": {
          "topicsDiscovered": { "value": 24, "change": 15.3 }, "draftsGenerated": { "value": 8, "change": 33.3 }, "postsPublished": { "value": 3, "change": 50 }, "avgSeoScore": { "value": 82, "change": 4.1 }
        },
        "contentPipelineData": []
    }

    # 5. Companies Data
    companies_data = [
      { "id": "client-1", "name": "Apex Digital", "domain": "apexdigital.com", "logo": "A", "competitors": [] },
      { "id": "client-2", "name": "BlueWave SaaS", "domain": "bluewavesaas.io", "logo": "B", "competitors": [] },
      { "id": "client-3", "name": "Craft & Co.", "domain": "craftandco.com.au", "logo": "C", "competitors": [] }
    ]

    # Insert defaults if empty
    if await db["companies"].count_documents({}) == 0:
        await db["companies"].insert_many(companies_data)
    if await db["technical"].count_documents({}) == 0:
        await db["technical"].insert_one(technical_data)
    if await db["onpage"].count_documents({}) == 0:
        await db["onpage"].insert_one(onpage_data)
    if await db["offpage"].count_documents({}) == 0:
        await db["offpage"].insert_one(offpage_data)
    if await db["content"].count_documents({}) == 0:
        await db["content"].insert_one(content_data)

    print("Seeded database!")

if __name__ == "__main__":
    asyncio.run(seed_db())
