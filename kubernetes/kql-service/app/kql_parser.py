"""
KQL (Kusto Query Language) to SQLite SQL translator.

Supports a subset of KQL operators against a SecurityEvent table backed by
the SQLite table `security_events`.
"""

import re
from typing import Any

# ---------------------------------------------------------------------------
# Public constant
# ---------------------------------------------------------------------------

EXAMPLE_QUERIES: list[dict[str, str]] = [
    {
        "name": "Failed Logons",
        "query": (
            "SecurityEvent\n"
            "| where EventID == 4625\n"
            "| project TimeGenerated, Account, Computer, IpAddress\n"
            "| order by TimeGenerated desc\n"
            "| limit 100"
        ),
    },
    {
        "name": "Brute Force Detection",
        "query": (
            "SecurityEvent\n"
            "| where EventID == 4625\n"
            "| summarize count() by Account\n"
            "| order by count_ desc\n"
            "| limit 20"
        ),
    },
    {
        "name": "Logon by Computer",
        "query": (
            "SecurityEvent\n"
            "| where EventID == 4624\n"
            "| summarize count() by Computer\n"
            "| order by count_ desc"
        ),
    },
    {
        "name": "Successful Logons Summary",
        "query": (
            "SecurityEvent\n"
            "| where EventID == 4624\n"
            "| project TimeGenerated, Account, Computer, LogonType\n"
            "| order by TimeGenerated desc\n"
            "| limit 200"
        ),
    },
    {
        "name": "External IPs",
        "query": (
            "SecurityEvent\n"
            "| where IpAddress != \"-\"\n"
            "| where IpAddress != \"127.0.0.1\"\n"
            "| where IpAddress startswith \"10.\" != true\n"
            "| project TimeGenerated, Account, Computer, IpAddress, EventID\n"
            "| order by TimeGenerated desc\n"
            "| limit 50"
        ),
    },
    {
        "name": "Kerberos Failures",
        "query": (
            "SecurityEvent\n"
            "| where EventID == 4771\n"
            "| project TimeGenerated, Account, Computer, IpAddress, Status\n"
            "| order by TimeGenerated desc\n"
            "| limit 100"
        ),
    },
    {
        "name": "NTLM Validation",
        "query": (
            "SecurityEvent\n"
            "| where EventID == 4776\n"
            "| where Status != \"0x0\"\n"
            "| project TimeGenerated, Account, Computer, Status\n"
            "| order by TimeGenerated desc\n"
            "| limit 100"
        ),
    },
    {
        "name": "Privileged Account Activity",
        "query": (
            "SecurityEvent\n"
            "| where Account contains \"admin\"\n"
            "| where EventID in (4624, 4625, 4672, 4728, 4732)\n"
            "| project TimeGenerated, Account, Computer, EventID\n"
            "| order by TimeGenerated desc\n"
            "| limit 100"
        ),
    },
]

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_TABLE_MAP = {"securityevent": "security_events"}

# Operators that map 1-to-1 (after stripping whitespace)
_CMP_OPS = {"==": "=", "!=": "!=", ">": ">", "<": "<", ">=": ">=", "<=": "<="}


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def _parse_value(raw: str) -> Any:
    """Return a Python value from a KQL literal string."""
    raw = raw.strip()
    stripped = _strip_quotes(raw)
    if stripped != raw:
        return stripped
    # numeric
    try:
        return int(raw)
    except ValueError:
        pass
    try:
        return float(raw)
    except ValueError:
        pass
    return raw


def _parse_where_condition(expr: str, params: list) -> str:
    """
    Parse a single KQL where expression and return a SQL fragment.
    Appends bound values to *params*.
    """
    expr = expr.strip()

    # in (...) operator — e.g. EventID in (4624, 4625)
    m = re.match(r"^(\w+)\s+in\s*\(([^)]+)\)$", expr, re.IGNORECASE)
    if m:
        col, raw_values = m.group(1), m.group(2)
        values = [_parse_value(v.strip()) for v in raw_values.split(",")]
        placeholders = ", ".join("?" * len(values))
        params.extend(values)
        return f"{col} IN ({placeholders})"

    # !contains / contains
    m = re.match(
        r"^(\w+)\s+(!?contains)\s+(.+)$", expr, re.IGNORECASE
    )
    if m:
        col, op, raw_val = m.group(1), m.group(2).lower(), m.group(3)
        val = _strip_quotes(raw_val.strip())
        params.append(f"%{val}%")
        like = f"{col} LIKE ?"
        return f"NOT ({like})" if op.startswith("!") else like

    # startswith
    m = re.match(r"^(\w+)\s+startswith\s+(.+)$", expr, re.IGNORECASE)
    if m:
        col, raw_val = m.group(1), m.group(2)
        val = _strip_quotes(raw_val.strip())
        params.append(f"{val}%")
        return f"{col} LIKE ?"

    # endswith
    m = re.match(r"^(\w+)\s+endswith\s+(.+)$", expr, re.IGNORECASE)
    if m:
        col, raw_val = m.group(1), m.group(2)
        val = _strip_quotes(raw_val.strip())
        params.append(f"%{val}")
        return f"{col} LIKE ?"

    # comparison operators: ==, !=, >=, <=, >, <
    m = re.match(r"^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$", expr, re.IGNORECASE)
    if m:
        col, op, raw_val = m.group(1), m.group(2), m.group(3)
        sql_op = _CMP_OPS[op]
        val = _parse_value(raw_val)
        params.append(val)
        return f"{col} {sql_op} ?"

    # Unrecognised — pass through as a literal comment so the query still runs
    # rather than silently dropping the filter.
    raise ValueError(f"Unsupported where expression: {expr!r}")


def _build_search_sql(term: str, params: list) -> tuple[str, str]:
    """
    Return (column_clause, where_clause) for a `search "term"` pipe.
    Full-text search across every TEXT-like column of security_events.
    """
    # Standard columns in a security_events table; extend as needed.
    text_columns = [
        "TimeGenerated", "EventID", "Computer", "Account", "SubjectAccount",
        "TargetAccount", "LogonType", "IpAddress", "Status", "SubStatus",
        "ProcessName", "ServiceName", "ObjectName", "Message",
    ]
    like_clauses = []
    for col in text_columns:
        params.append(f"%{term}%")
        like_clauses.append(f"CAST({col} AS TEXT) LIKE ?")
    where = "(" + " OR ".join(like_clauses) + ")"
    return "*", where


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_kql(query: str) -> dict:
    """
    Translate a KQL query string to SQLite SQL.

    Returns::

        {
            "sql":    str,        # ready to execute
            "params": list,       # positional bind parameters
            "error":  str | None, # None on success
        }
    """
    params: list[Any] = []

    try:
        raw_pipes = [p.strip() for p in query.strip().split("|")]
        raw_pipes = [p for p in raw_pipes if p]

        if not raw_pipes:
            return {"sql": "", "params": [], "error": "Empty query"}

        # --- source table ------------------------------------------------
        source = raw_pipes[0].strip()
        table_sql = _TABLE_MAP.get(source.lower())
        if table_sql is None:
            return {
                "sql": "",
                "params": [],
                "error": f"Unknown table: {source!r}. Supported: {list(_TABLE_MAP)}",
            }

        # --- parse pipes -------------------------------------------------
        where_clauses: list[str] = []
        select_cols: list[str] | None = None
        summarize_col: str | None = None
        order_clauses: list[str] = []
        limit_val: int | None = None
        search_where: str | None = None

        for pipe in raw_pipes[1:]:
            keyword, _, rest = pipe.partition(" ")
            keyword = keyword.lower()
            rest = rest.strip()

            # ---- where --------------------------------------------------
            if keyword == "where":
                clause = _parse_where_condition(rest, params)
                where_clauses.append(clause)

            # ---- project ------------------------------------------------
            elif keyword == "project":
                cols = [c.strip() for c in rest.split(",")]
                select_cols = cols

            # ---- summarize count() by <col> ----------------------------
            elif keyword == "summarize":
                m = re.match(
                    r"count\s*\(\s*\)\s+by\s+(\w+)", rest, re.IGNORECASE
                )
                if not m:
                    return {
                        "sql": "",
                        "params": [],
                        "error": (
                            f"Unsupported summarize expression: {rest!r}. "
                            "Only 'count() by <column>' is supported."
                        ),
                    }
                summarize_col = m.group(1)

            # ---- order by / sort by ------------------------------------
            elif keyword in ("order", "sort"):
                # consume "by" keyword if present
                rest_lower = rest.lower()
                if rest_lower.startswith("by "):
                    rest = rest[3:].strip()
                for part in rest.split(","):
                    part = part.strip()
                    m = re.match(r"^(\w+)\s*(asc|desc)?$", part, re.IGNORECASE)
                    if m:
                        col = m.group(1)
                        direction = (m.group(2) or "asc").upper()
                        order_clauses.append(f"{col} {direction}")
                    else:
                        return {
                            "sql": "",
                            "params": [],
                            "error": f"Unsupported order expression: {part!r}",
                        }

            # ---- limit / take ------------------------------------------
            elif keyword in ("limit", "take"):
                try:
                    limit_val = int(rest)
                except ValueError:
                    return {
                        "sql": "",
                        "params": [],
                        "error": f"limit/take expects an integer, got: {rest!r}",
                    }

            # ---- search "term" -----------------------------------------
            elif keyword == "search":
                term = _strip_quotes(rest)
                _, search_where = _build_search_sql(term, params)

            else:
                return {
                    "sql": "",
                    "params": [],
                    "error": f"Unsupported KQL operator: {keyword!r}",
                }

        # --- assemble SQL ------------------------------------------------
        if search_where:
            where_clauses.append(search_where)

        if summarize_col:
            # summarize overrides project
            col_clause = f"{summarize_col}, COUNT(*) AS count_"
        elif select_cols:
            col_clause = ", ".join(select_cols)
        else:
            col_clause = "*"

        sql = f"SELECT {col_clause} FROM {table_sql}"

        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)

        if summarize_col:
            sql += f" GROUP BY {summarize_col}"

        if order_clauses:
            sql += " ORDER BY " + ", ".join(order_clauses)

        if limit_val is not None:
            sql += f" LIMIT {limit_val}"

        return {"sql": sql, "params": params, "error": None}

    except ValueError as exc:
        return {"sql": "", "params": [], "error": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {"sql": "", "params": [], "error": f"Internal parser error: {exc}"}
