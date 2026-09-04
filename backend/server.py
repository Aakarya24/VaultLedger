from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class WorkspaceIn(BaseModel):
    id: str
    name: str
    type: str = "personal"
    owner_id: str = "local-user"
    created_at: str

class AccountIn(BaseModel):
    id: str
    workspace_id: str
    name: str
    type: str = "checking"
    currency: str = "INR"
    opening_balance: int = 0
    created_at: str

class TransactionIn(BaseModel):
    id: str
    workspace_id: str
    account_id: str
    type: Literal["expense", "income", "adjustment"] = "expense"
    amount_minor: int = Field(gt=0)
    currency: str = "INR"
    occurred_at: str
    note: str = ""
    created_at: str
    updated_at: str
    version: int = 1
    sync_status: str = "pending"

class SyncEvent(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    operation: str
    payload: dict
    retry_count: int = 0
    created_at: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "VaultLedger sync service", "policy": "latest-version-wins metadata; financial corrections are adjustments"}

@api_router.post("/workspaces", response_model=WorkspaceIn)
async def create_workspace(workspace: WorkspaceIn):
    await db.workspaces.replace_one({"id": workspace.id}, workspace.model_dump(), upsert=True)
    return workspace

@api_router.get("/workspaces", response_model=List[WorkspaceIn])
async def list_workspaces():
    docs = await db.workspaces.find({}, {"_id": 0}).to_list(1000)
    return [WorkspaceIn(**doc) for doc in docs]

@api_router.post("/accounts", response_model=AccountIn)
async def create_account(account: AccountIn):
    workspace = await db.workspaces.find_one({"id": account.workspace_id}, {"_id": 1})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    await db.accounts.replace_one({"id": account.id}, account.model_dump(), upsert=True)
    return account

@api_router.get("/accounts/{workspace_id}", response_model=List[AccountIn])
async def list_accounts(workspace_id: str):
    docs = await db.accounts.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(1000)
    return [AccountIn(**doc) for doc in docs]

@api_router.post("/transactions", response_model=TransactionIn)
async def sync_transaction(transaction: TransactionIn):
    existing = await db.transactions.find_one({"id": transaction.id}, {"_id": 0})
    if existing and existing.get("version", 0) > transaction.version:
        return TransactionIn(**existing)
    await db.transactions.replace_one({"id": transaction.id}, transaction.model_dump(), upsert=True)
    return transaction

@api_router.post("/sync", response_model=List[TransactionIn])
async def sync_events(events: List[SyncEvent]):
    results = []
    for event in events:
        if event.entity_type == "transaction" and event.operation in {"create", "adjust"}:
            try:
                tx = TransactionIn(**event.payload)
            except Exception as exc:
                # Surface bad transaction payloads as 422 instead of leaking 500.
                raise HTTPException(status_code=422, detail=f"Invalid transaction payload for event {event.id}: {exc}")
            results.append(await sync_transaction(tx))
        await db.sync_events.replace_one({"id": event.id}, event.model_dump(), upsert=True)
    return results

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
