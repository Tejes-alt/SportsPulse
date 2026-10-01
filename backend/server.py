from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import csv
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import asyncio


# ============================================================
# Configuration
# ============================================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


app = FastAPI(title="SportsPulse API")
api_router = APIRouter(prefix="/api")


# ============================================================
# Data Parsing
# ============================================================

DATA_DIR = ROOT_DIR / "data"


def clean_num(val: Any, as_int: bool = False) -> Optional[float]:
    """Safely coerce a CSV cell to a number. Returns None if not numeric."""
    if val is None:
        return None

    s = re.sub(r"\[[a-z0-9]+\]", "", str(val)).strip()

    if s == "" or s == "-" or s.lower() == "nan" or s == "#DIV/0!":
        return None

    # Strip '*' suffix
    if s.endswith("*"):
        s = s[:-1].strip()

    # Try direct numeric parse
    try:
        f = float(s)
        return int(f) if as_int else f
    except ValueError:
        return None


def clean_str(val: Any) -> str:
    if val is None:
        return ""

    s = str(val).strip()

    if s in ("-", "nan", "#DIV/0!", "-/-"):
        return ""

    return s


MONTHS = {
    m: i + 1
    for i, m in enumerate(
        [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
        ]
    )
}

FOOTNOTE_RE = re.compile(r"\[[a-z0-9]+\]", re.I)


def clean_id(val: Any) -> Optional[int]:
    """
    '269[a]' -> 269
    Strip footnote markers and convert to integer.
    """
    s = FOOTNOTE_RE.sub("", str(val or "").strip())
    return clean_num(s, True)


def clean_name(val: Any) -> str:
    """
    'M.S. Dhoni1' -> 'M.S. Dhoni'
    Strip footnote markers and trailing digits.
    """
    s = FOOTNOTE_RE.sub("", clean_str(val))
    return re.sub(r"(?<=[A-Za-z.])\d+$", "", s).strip()


def decode_fraction(val: Any):
    """
    Decode cricket fraction cells that Excel converted to dates.

    Examples:
        '22-Feb' -> '2/22'
        'Feb-44' -> '2/44'
        '12-Nov' -> '11/12'

    Returns:
        (value, decoded_flag)
    """
    s = clean_str(val)

    if not s:
        return "", False

    if "||" in s:
        s = s.split("||")[0].strip()

    if "/" in s:
        return s, False

    # Example: 22-Feb
    m = re.fullmatch(r"(\d{1,2})-([A-Za-z]{3})", s)

    if m and m.group(2).lower() in MONTHS:
        return f"{MONTHS[m.group(2).lower()]}/{int(m.group(1))}", True

    # Example: Feb-44
    m = re.fullmatch(r"([A-Za-z]{3})-(\d{1,2})", s)

    if m and m.group(1).lower() in MONTHS:
        return f"{MONTHS[m.group(1).lower()]}/{int(m.group(2))}", True

    return s, False


def hs_value(hs: str) -> Optional[int]:
    return clean_num(hs, True)


def _read(path: Path) -> List[List[str]]:
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.reader(f))


# ============================================================
# ODI Players
# ============================================================

def parse_odi_players() -> List[Dict[str, Any]]:
    """
    Headers:
    No,Name,First,Last,Mat,Inn,NO,Runs,HS,Avg,
    Balls,Mdn,Runs(bowl),Wkt,BBM,Avg(bowl),Ca,St
    """

    players = []

    rows = _read(DATA_DIR / "AllOdiPlayers.csv")

    for row in rows[1:]:
        if not row or len(row) < 18 or not row[1].strip():
            continue

        bbm, bbm_dec = decode_fraction(row[14])

        decoded = ["bbm"] if bbm_dec else []

        p = {
            "id": clean_id(row[0]),
            "name": clean_name(row[1]),
            "first": clean_str(row[2]),
            "last": clean_str(row[3]),

            "mat": clean_num(row[4], True) or 0,
            "inn": clean_num(row[5], True) or 0,
            "no": clean_num(row[6], True) or 0,

            "runs": clean_num(row[7], True) or 0,

            "hs": clean_str(row[8]),
            "hs_value": hs_value(row[8]),

            "avg": clean_num(row[9]),

            "balls": clean_num(row[10], True) or 0,
            "mdn": clean_num(row[11], True) or 0,

            "bowl_runs": clean_num(row[12], True) or 0,
            "wkt": clean_num(row[13], True) or 0,

            "bbm": bbm,
            "bowl_avg": clean_num(row[15]),

            "ca": clean_num(row[16], True) or 0,
            "st": clean_num(row[17], True) or 0,

            "format": "ODI",
            "decoded": decoded,
        }

        if p["id"] is None:
            continue

        players.append(p)

    return players


# ============================================================
# Test Players
# ============================================================

def parse_test_players() -> List[Dict[str, Any]]:
    """
    Headers:
    Cap,Name,First,Last,Mat,Runs,HS,Avg,100/50,Wkt,
    BBI,Ave,5/10 wicket,Ca,St
    """

    players = []

    rows = _read(DATA_DIR / "AllTestplayers.csv")

    for row in rows[1:]:
        if not row or len(row) < 15 or not row[1].strip():
            continue

        hf, hf_dec = decode_fraction(row[8])
        bbi, bbi_dec = decode_fraction(row[10])
        ft, ft_dec = decode_fraction(row[12])

        decoded = [
            key
            for key, decoded_flag in (
                ("hundreds_fifties", hf_dec),
                ("bbi", bbi_dec),
                ("five_ten", ft_dec),
            )
            if decoded_flag
        ]

        p = {
            "id": clean_id(row[0]),
            "name": clean_name(row[1]),
            "first": clean_str(row[2]),
            "last": clean_str(row[3]),

            "mat": clean_num(row[4], True) or 0,
            "runs": clean_num(row[5], True) or 0,

            "hs": clean_str(row[6]),
            "hs_value": hs_value(row[6]),

            "avg": clean_num(row[7]),

            "hundreds_fifties": hf,

            "wkt": clean_num(row[9], True) or 0,

            "bbi": bbi,
            "bowl_avg": clean_num(row[11]),

            "five_ten": ft,

            "ca": clean_num(row[13], True) or 0,
            "st": clean_num(row[14], True) or 0,

            "format": "Test",
            "decoded": decoded,
        }

        if p["id"] is None:
            continue

        players.append(p)

    return players


# ============================================================
# Captain Parsing
# ============================================================

def _captain(
    row: List[str],
    fmt: str,
    has_nr: bool
) -> Dict[str, Any]:

    played = clean_num(row[2], True) or 0
    won = clean_num(row[3], True) or 0
    lost = clean_num(row[4], True) or 0
    tied = clean_num(row[5], True) or 0

    nr = (
        clean_num(row[6], True) or 0
        if has_nr
        else 0
    )

    win_pct = clean_num(
        row[7] if has_nr else row[6]
    )

    if win_pct is None and played:
        win_pct = round(won / played * 100, 2)

    year = clean_str(row[1])

    start = (
        clean_num(year[:4], True)
        if len(year) >= 4
        else None
    )

    return {
        "name": clean_name(row[0]),
        "year": year,
        "start_year": start,

        "played": played,
        "won": won,
        "lost": lost,
        "tied": tied,
        "no_result": nr,

        "drawn": tied if fmt == "Test" else 0,

        "win_pct": (
            win_pct
            if win_pct is not None
            else 0.0
        ),

        "format": fmt,
    }


def parse_odi_captains() -> List[Dict[str, Any]]:
    """
    Headers:
    Name,Year,Played,Won,Lost,Tied,No result,Win%
    """

    rows = _read(DATA_DIR / "AllOdicaptains.csv")

    return [
        _captain(row, "ODI", True)
        for row in rows[1:]
        if row
        and len(row) >= 8
        and row[0].strip()
    ]


def parse_test_captains() -> List[Dict[str, Any]]:
    """
    Headers:
    Name,Year,Played,Won,Lost,Tied(=Drawn),Win%
    """

    rows = _read(DATA_DIR / "AllTestcaptains.csv")

    return [
        _captain(row, "Test", False)
        for row in rows[1:]
        if row
        and len(row) >= 7
        and row[0].strip()
    ]


# ============================================================
# In-Memory Data
# ============================================================

DATA: Dict[str, List[Dict[str, Any]]] = {
    "odi_players": [],
    "test_players": [],
    "odi_captains": [],
    "test_captains": [],
}


def norm_name(n: str) -> str:
    return re.sub(r"[^a-z]", "", n.lower())


def _players(fmt: str) -> List[Dict[str, Any]]:
    if fmt.lower() == "odi":
        return DATA["odi_players"]

    return DATA["test_players"]


def _captains(fmt: str) -> List[Dict[str, Any]]:
    if fmt.lower() == "odi":
        return DATA["odi_captains"]

    return DATA["test_captains"]


def captain_record(
    name: str,
    fmt: str
) -> Optional[Dict[str, Any]]:

    key = norm_name(name)

    for captain in _captains(fmt):
        if norm_name(captain["name"]) == key:
            return captain

    return None


# ============================================================
# Startup — Load CSV Data Once
# ============================================================

@app.on_event("startup")
async def load_data():

    DATA["odi_players"] = parse_odi_players()
    DATA["test_players"] = parse_test_players()

    DATA["odi_captains"] = parse_odi_captains()
    DATA["test_captains"] = parse_test_captains()

    logging.info(
        f"Loaded "
        f"ODI:{len(DATA['odi_players'])} "
        f"Test:{len(DATA['test_players'])} "
        f"ODIcap:{len(DATA['odi_captains'])} "
        f"Testcap:{len(DATA['test_captains'])}"
    )


# ============================================================
# Statistics Helpers
# ============================================================

def _decade_hist(
    players: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:

    buckets: Dict[int, int] = {}

    for p in players:

        y = clean_num(
            p["first"],
            True
        )

        if y:
            decade = (y // 10) * 10
            buckets[decade] = (
                buckets.get(decade, 0) + 1
            )

    return [
        {
            "decade": f"{d}s",
            "debuts": n
        }
        for d, n in sorted(buckets.items())
    ]


def _format_summary(
    players: List[Dict[str, Any]],
    caps: List[Dict[str, Any]]
) -> Dict[str, Any]:

    runs = [
        p["runs"]
        for p in players
    ]

    top_run = max(
        players,
        key=lambda p: p["runs"],
        default=None
    )

    top_wkt = max(
        players,
        key=lambda p: p["wkt"],
        default=None
    )

    top_hs = max(
        (
            p
            for p in players
            if p["hs_value"] is not None
        ),
        key=lambda p: p["hs_value"],
        default=None
    )

    top_mat = max(
        players,
        key=lambda p: p["mat"],
        default=None
    )

    qualified = [
        p
        for p in players
        if p["avg"] is not None
        and p[
            "inn" if "inn" in p else "mat"
        ] >= 20
    ]

    top_avg = max(
        qualified,
        key=lambda p: p["avg"],
        default=None
    )

    top_ca = max(
        players,
        key=lambda p: p["ca"],
        default=None
    )

    cap_played = sum(
        c["played"]
        for c in caps
    )

    cap_won = sum(
        c["won"]
        for c in caps
    )

    def brief(
        player: Optional[Dict[str, Any]],
        key: str
    ):
        if player:
            return {
                "id": player["id"],
                "name": player["name"],
                "value": player[key],
            }

        return None

    return {
        "players": len(players),

        "captains": len(caps),

        "total_runs": sum(runs),

        "total_wickets": sum(
            p["wkt"]
            for p in players
        ),

        "total_matches": sum(
            p["mat"]
            for p in players
        ),

        "total_catches": sum(
            p["ca"]
            for p in players
        ),

        "total_stumpings": sum(
            p["st"]
            for p in players
        ),

        "avg_runs_per_player": (
            round(
                sum(runs) / len(players),
                1
            )
            if players
            else 0
        ),

        "thousand_run_club": sum(
            1
            for r in runs
            if r >= 1000
        ),

        "hundred_wicket_club": sum(
            1
            for p in players
            if p["wkt"] >= 100
        ),

        "wicket_keepers": sum(
            1
            for p in players
            if p["st"] > 0
        ),

        "single_match_players": sum(
            1
            for p in players
            if p["mat"] == 1
        ),

        "first_debut": min(
            (
                clean_num(
                    p["first"],
                    True
                ) or 9999
                for p in players
            ),
            default=None
        ),

        "last_debut": max(
            (
                clean_num(
                    p["first"],
                    True
                ) or 0
                for p in players
            ),
            default=None
        ),

        "leaders": {
            "runs": brief(
                top_run,
                "runs"
            ),

            "wickets": brief(
                top_wkt,
                "wkt"
            ),

            "matches": brief(
                top_mat,
                "mat"
            ),

            "average": brief(
                top_avg,
                "avg"
            ),

            "catches": brief(
                top_ca,
                "ca"
            ),

            "highest_score": (
                {
                    "id": top_hs["id"],
                    "name": top_hs["name"],
                    "value": top_hs["hs"],
                }
                if top_hs
                else None
            ),
        },

        "captaincy": {
            "matches": cap_played,

            "won": cap_won,

            "lost": sum(
                c["lost"]
                for c in caps
            ),

            "tied_or_drawn": sum(
                c["tied"]
                for c in caps
            ),

            "no_result": sum(
                c["no_result"]
                for c in caps
            ),

            "win_pct": (
                round(
                    cap_won / cap_played * 100,
                    2
                )
                if cap_played
                else 0
            ),
        },

        "debut_decades": _decade_hist(players),
    }


# ============================================================
# API Endpoints
# ============================================================

@api_router.get("/")
async def root():
    return {
        "message": "SportsPulse API",
        "status": "ok",
    }


# ------------------------------------------------------------
# Overview Statistics
# ------------------------------------------------------------

@api_router.get("/stats/overview")
async def stats_overview():

    odi = DATA["odi_players"]
    test = DATA["test_players"]

    return {
        # Flat legacy keys
        "odi_players": len(odi),
        "test_players": len(test),

        "odi_captains": len(
            DATA["odi_captains"]
        ),

        "test_captains": len(
            DATA["test_captains"]
        ),

        "odi_total_runs": sum(
            p["runs"]
            for p in odi
        ),

        "odi_total_wickets": sum(
            p["wkt"]
            for p in odi
        ),

        "test_total_runs": sum(
            p["runs"]
            for p in test
        ),

        "test_total_wickets": sum(
            p["wkt"]
            for p in test
        ),

        "odi_matches": sum(
            p["mat"]
            for p in odi
        ),

        "test_matches": sum(
            p["mat"]
            for p in test
        ),

        "total_records": (
            len(odi)
            + len(test)
            + len(DATA["odi_captains"])
            + len(DATA["test_captains"])
        ),

        "decoded_cells": sum(
            len(p["decoded"])
            for p in odi + test
        ),

        "odi": _format_summary(
            odi,
            DATA["odi_captains"]
        ),

        "test": _format_summary(
            test,
            DATA["test_captains"]
        ),
    }


# ------------------------------------------------------------
# Top Performers
# ------------------------------------------------------------

@api_router.get("/stats/top-performers")
async def top_performers(
    format: str = "ODI",
    metric: str = "runs",
    limit: int = 10,
    min_mat: int = 0,
):

    src = _players(format)

    valid_metrics = (
        "runs",
        "wkt",
        "avg",
        "mat",
        "ca",
        "st",
        "hs_value",
    )

    if metric not in valid_metrics:
        metric = "runs"

    pool = [
        p
        for p in src
        if p["mat"] >= min_mat
        and p.get(metric) is not None
    ]

    return sorted(
        pool,
        key=lambda x: x.get(metric) or 0,
        reverse=True
    )[:limit]


# ------------------------------------------------------------
# Sortable Player Fields
# ------------------------------------------------------------

SORTABLE = (
    "runs",
    "wkt",
    "avg",
    "mat",
    "name",
    "id",
    "ca",
    "st",
    "bowl_avg",
    "hs_value",
    "first",
    "last",
    "inn",
    "balls",
)


# ------------------------------------------------------------
# Players
# ------------------------------------------------------------

@api_router.get("/players")
async def list_players(
    format: str = "ODI",
    q: Optional[str] = None,
    sort_by: str = "runs",
    order: str = "desc",
    limit: int = 500,
    offset: int = 0,
    min_mat: int = 0,
    role: Optional[str] = None,
):

    result = [
        p
        for p in _players(format)
        if p["mat"] >= min_mat
    ]

    if q:
        ql = q.lower()

        result = [
            p
            for p in result
            if ql in p["name"].lower()
        ]

    if role == "batting":

        result = [
            p
            for p in result
            if p["runs"] >= 1000
        ]

    elif role == "bowling":

        result = [
            p
            for p in result
            if p["wkt"] >= 50
        ]

    elif role == "keeper":

        result = [
            p
            for p in result
            if p["st"] > 0
        ]

    elif role == "allround":

        result = [
            p
            for p in result
            if p["runs"] >= 1000
            and p["wkt"] >= 50
        ]

    if sort_by not in SORTABLE:
        sort_by = "runs"

    reverse = (
        order.lower() == "desc"
    )

    if sort_by == "name":

        result.sort(
            key=lambda x: x["name"].lower(),
            reverse=reverse
        )

    elif sort_by in ("first", "last"):

        result.sort(
            key=lambda x:
                clean_num(
                    x[sort_by],
                    True
                ) or 0,
            reverse=reverse
        )

    else:

        # None values always sink to the bottom.
        result.sort(
            key=lambda x: (
                x.get(sort_by) is None,
                (
                    x.get(sort_by) or 0
                )
                * (
                    1
                    if not reverse
                    else -1
                ),
            )
        )

    return {
        "total": len(result),
        "items": result[
            offset:offset + limit
        ],
    }


# ------------------------------------------------------------
# Player Lookup By Name
# ------------------------------------------------------------

@api_router.get("/players/lookup")
async def lookup_by_name(name: str):
    """
    Resolve a name to player records
    across formats.
    """

    key = norm_name(name)

    out = []

    for fmt in ("ODI", "Test"):

        for p in _players(fmt):

            if norm_name(
                p["name"]
            ) == key:

                out.append(
                    {
                        "format": fmt,
                        "id": p["id"],
                        "name": p["name"],
                        "mat": p["mat"],
                        "runs": p["runs"],
                        "wkt": p["wkt"],
                        "avg": p["avg"],
                    }
                )

    return out


# ------------------------------------------------------------
# Player Details
# ------------------------------------------------------------

@api_router.get("/players/{format}/{player_id}")
async def player_detail(
    format: str,
    player_id: int
):

    src = _players(format)

    fmt = (
        "ODI"
        if format.lower() == "odi"
        else "Test"
    )

    for p in src:

        if p["id"] == player_id:

            other_fmt = (
                "Test"
                if fmt == "ODI"
                else "ODI"
            )

            other = next(
                (
                    o
                    for o in _players(other_fmt)
                    if norm_name(
                        o["name"]
                    )
                    == norm_name(
                        p["name"]
                    )
                ),
                None
            )

            rank_runs = (
                1
                + sum(
                    1
                    for o in src
                    if o["runs"]
                    > p["runs"]
                )
            )

            rank_wkt = (
                1
                + sum(
                    1
                    for o in src
                    if o["wkt"]
                    > p["wkt"]
                )
            )

            return {
                **p,

                "captaincy": captain_record(
                    p["name"],
                    fmt
                ),

                "other_format": (
                    {
                        "format": other_fmt,
                        "id": other["id"],
                        "mat": other["mat"],
                        "runs": other["runs"],
                        "wkt": other["wkt"],
                    }
                    if other
                    else None
                ),

                "rank_runs": rank_runs,
                "rank_wkt": rank_wkt,
                "pool": len(src),
            }

    raise HTTPException(
        status_code=404,
        detail="Player not found"
    )


# ------------------------------------------------------------
# Captains
# ------------------------------------------------------------

@api_router.get("/captains")
async def list_captains(
    format: str = "ODI"
):

    src = _captains(format)

    return {
        "total": len(src),
        "items": src,
    }


# ------------------------------------------------------------
# Names
# ------------------------------------------------------------

@api_router.get("/names")
async def all_names(
    format: str = "ODI"
):

    """
    Return just names for client-side algorithms.

    format=all returns both ODI and Test.
    """

    if format.lower() == "all":

        seen = set()
        out = []

        for p in (
            DATA["odi_players"]
            + DATA["test_players"]
        ):

            if p["name"] not in seen:

                seen.add(
                    p["name"]
                )

                out.append(
                    p["name"]
                )

        return out

    return [
        p["name"]
        for p in _players(format)
    ]


# ============================================================
# Register API Router
# ============================================================

app.include_router(api_router)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_credentials=True,

    allow_origins=os.environ.get(
        "CORS_ORIGINS",
        "*"
    ).split(","),

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s - "
        "%(name)s - "
        "%(levelname)s - "
        "%(message)s"
    ),
)


# ============================================================
# Shutdown
# ============================================================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()