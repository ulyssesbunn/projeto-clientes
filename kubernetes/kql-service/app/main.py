from contextlib import asynccontextmanager
import logging
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database import get_connection, seed_database
from kql_parser import EXAMPLE_QUERIES, parse_kql

FRONTEND_INDEX = Path("/frontend/index.html")


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    conn = get_connection()
    try:
        row = conn.execute("SELECT COUNT(*) FROM security_events").fetchone()
        logger.info("Startup check: security_events has %d rows", row[0])
    except Exception as exc:
        logger.error("Startup check failed: %s", exc)
        raise
    finally:
        conn.close()
    yield


app = FastAPI(title="KQL Simulator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "kql-simulator"}


@app.get("/examples")
def examples():
    return EXAMPLE_QUERIES


@app.post("/query")
def run_query(req: QueryRequest):
    parsed = parse_kql(req.query)

    if parsed["error"]:
        return {
            "columns": [],
            "rows": [],
            "count": 0,
            "sql": parsed["sql"],
            "error": parsed["error"],
        }

    conn = get_connection()
    try:
        cursor = conn.execute(parsed["sql"], parsed["params"])
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = [list(row) for row in cursor.fetchall()]
        return {
            "columns": columns,
            "rows": rows,
            "count": len(rows),
            "sql": parsed["sql"],
            "error": None,
        }
    except sqlite3.Error as exc:
        return {
            "columns": [],
            "rows": [],
            "count": 0,
            "sql": parsed["sql"],
            "error": str(exc),
        }
    finally:
        conn.close()


@app.get("/")
def serve_frontend():
    if not FRONTEND_INDEX.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(FRONTEND_INDEX)
