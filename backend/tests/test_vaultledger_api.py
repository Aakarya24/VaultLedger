import os
import uuid

import pytest
import requests


BASE_URL = os.environ.get(
    "EXPO_BACKEND_URL",
    os.environ.get("EXPO_PUBLIC_BACKEND_URL", ""),
).rstrip("/")
assert BASE_URL, "EXPO_BACKEND_URL / EXPO_PUBLIC_BACKEND_URL must be set"


@pytest.fixture(scope="module")
def api():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# --- root -------------------------------------------------------------
def test_root(api):
    r = api.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("policy")
    assert "VaultLedger" in body.get("message", "")


# --- workspaces -------------------------------------------------------
@pytest.fixture(scope="module")
def workspace(api):
    wid = str(uuid.uuid4())
    now = "2026-01-15T10:00:00.000Z"
    payload = {"id": wid, "name": "TEST VaultLedger WS", "type": "personal", "created_at": now}
    r = api.post(f"{BASE_URL}/api/workspaces", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["id"] == wid and data["name"] == "TEST VaultLedger WS"
    return {"id": wid, "created_at": now}


def test_list_workspaces_contains_created(api, workspace):
    r = api.get(f"{BASE_URL}/api/workspaces", timeout=15)
    assert r.status_code == 200
    ids = [w["id"] for w in r.json()]
    assert workspace["id"] in ids


# --- accounts ---------------------------------------------------------
@pytest.fixture(scope="module")
def account(api, workspace):
    aid = str(uuid.uuid4())
    payload = {
        "id": aid,
        "workspace_id": workspace["id"],
        "name": "TEST Wallet",
        "type": "checking",
        "currency": "INR",
        "opening_balance": 500000,
        "created_at": workspace["created_at"],
    }
    r = api.post(f"{BASE_URL}/api/accounts", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    return aid


def test_account_persisted(api, workspace, account):
    r = api.get(f"{BASE_URL}/api/accounts/{workspace['id']}", timeout=15)
    assert r.status_code == 200
    ids = [a["id"] for a in r.json()]
    assert account in ids


def test_account_workspace_missing_returns_404(api):
    aid = str(uuid.uuid4())
    payload = {
        "id": aid,
        "workspace_id": "no-such-ws",
        "name": "TEST Bad",
        "type": "checking",
        "currency": "INR",
        "opening_balance": 0,
        "created_at": "2026-01-15T10:00:00.000Z",
    }
    r = api.post(f"{BASE_URL}/api/accounts", json=payload, timeout=15)
    assert r.status_code == 404


# --- sync outbox ------------------------------------------------------
def test_sync_transaction_round_trip(api, workspace, account):
    tid = str(uuid.uuid4())
    now = "2026-01-15T10:30:00.000Z"
    event = {
        "id": tid,
        "entity_type": "transaction",
        "entity_id": tid,
        "operation": "create",
        "retry_count": 0,
        "created_at": now,
        "payload": {
            "id": tid,
            "workspace_id": workspace["id"],
            "account_id": account,
            "type": "expense",
            "amount_minor": 12550,
            "currency": "INR",
            "occurred_at": now,
            "note": "TEST Groceries",
            "created_at": now,
            "updated_at": now,
            "version": 1,
            "sync_status": "pending",
        },
    }
    r = api.post(f"{BASE_URL}/api/sync", json=[event], timeout=15)
    assert r.status_code == 200
    result = r.json()
    assert len(result) == 1
    assert result[0]["amount_minor"] == 12550
    assert result[0]["id"] == tid


def test_sync_rejects_zero_amount(api, workspace, account):
    tid = str(uuid.uuid4())
    now = "2026-01-15T10:30:00.000Z"
    bad = {
        "id": tid,
        "entity_type": "transaction",
        "entity_id": tid,
        "operation": "create",
        "retry_count": 0,
        "created_at": now,
        "payload": {
            "id": tid,
            "workspace_id": workspace["id"],
            "account_id": account,
            "type": "expense",
            "amount_minor": 0,  # violates gt=0
            "currency": "INR",
            "occurred_at": now,
            "note": "TEST bad",
            "created_at": now,
            "updated_at": now,
            "version": 1,
            "sync_status": "pending",
        },
    }
    r = api.post(f"{BASE_URL}/api/sync", json=[bad], timeout=15)
    assert r.status_code in (400, 422)


def test_sync_empty_batch(api):
    r = api.post(f"{BASE_URL}/api/sync", json=[], timeout=15)
    assert r.status_code == 200
    assert r.json() == []
