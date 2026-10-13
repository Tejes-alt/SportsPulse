"""SportsPulse backend API tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cricket-metrics-hub.preview.emergentagent.com").rstrip("/")
# Fallback to reading from frontend/.env
if not BASE_URL or "None" in BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---- Overview ----
def test_overview(s):
    r = s.get(f"{API}/stats/overview", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d.get("odi_players") == 241
    assert d.get("test_players") == 303
    assert d.get("odi_captains") == 25
    assert d.get("test_captains") == 31
    assert d.get("decoded_cells", 0) > 0
    assert "odi" in d and "test" in d
    # leaders
    odi_leader = d["odi"].get("leaders", {}).get("runs", {}).get("name") or d["odi"].get("leaders", {}).get("most_runs", {}).get("name")
    test_leader = d["test"].get("leaders", {}).get("runs", {}).get("name") or d["test"].get("leaders", {}).get("most_runs", {}).get("name")
    assert odi_leader == "Sachin Tendulkar"
    assert test_leader == "Sachin Tendulkar"
    dd = d.get("debut_decades") or d["odi"].get("debut_decades")
    assert isinstance(dd, list) and len(dd) > 0


# ---- Players endpoints ----
def test_player_test_269_kohli(s):
    r = s.get(f"{API}/players/test/269", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "Kohli" in d.get("name", "")
    assert d.get("hundreds_fifties") == "27/25" or d.get("100s_50s") == "27/25"
    cap = d.get("captaincy") or {}
    assert abs(float(cap.get("win_pct", 0)) - 59.01) < 0.5
    of = d.get("other_format") or {}
    assert str(of.get("id")) == "175"


def test_player_test_207_dravid(s):
    r = s.get(f"{API}/players/test/207", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "Dravid" in d.get("name", "")
    assert int(d.get("mat", 0)) == 164
    assert d.get("bbi") == "1/18"
    decoded = d.get("decoded") or []
    assert "bbi" in decoded


def test_player_odi_74_sachin(s):
    r = s.get(f"{API}/players/odi/74", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "Tendulkar" in d.get("name", "")
    assert d.get("bbm") == "5/32"
    assert "bbm" in (d.get("decoded") or [])
    cap = d.get("captaincy") or {}
    assert int(cap.get("played", 0)) == 73


def test_players_filter_sort(s):
    r = s.get(f"{API}/players", params={"format": "odi", "sort_by": "avg", "order": "desc", "min_mat": 20, "limit": 3}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    items = d if isinstance(d, list) else d.get("items") or d.get("players") or []
    assert len(items) >= 1
    assert "Kohli" in items[0].get("name", "")
    assert abs(float(items[0].get("avg", 0)) - 59.07) < 0.5


def test_players_role_filters(s):
    for role in ("batting", "bowling", "keeper", "allround"):
        r = s.get(f"{API}/players", params={"format": "odi", "role": role}, timeout=15)
        assert r.status_code == 200, f"role={role}"


def test_players_sort_name(s):
    r = s.get(f"{API}/players", params={"format": "odi", "sort_by": "name"}, timeout=15)
    assert r.status_code == 200


def test_players_unknown_sort_fallback(s):
    r = s.get(f"{API}/players", params={"format": "odi", "sort_by": "xyzzz"}, timeout=15)
    assert r.status_code == 200


def test_lookup_dhoni(s):
    r = s.get(f"{API}/players/lookup", params={"name": "MS Dhoni"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    items = d if isinstance(d, list) else d.get("results") or d.get("items") or []
    assert len(items) == 2
    ids = {str(i.get("id")) for i in items}
    assert "157" in ids and "251" in ids


def test_names_all(s):
    r = s.get(f"{API}/names", params={"format": "all"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    items = d if isinstance(d, list) else d.get("names") or d.get("items") or []
    assert len(items) == 376


def test_captains_test(s):
    r = s.get(f"{API}/captains", params={"format": "Test"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    items = d if isinstance(d, list) else d.get("captains") or d.get("items") or []
    total = d.get("total") if isinstance(d, dict) else None
    assert (total == 31) or (len(items) == 31)


def test_top_performers_test_wkt(s):
    r = s.get(f"{API}/stats/top-performers", params={"format": "Test", "metric": "wkt", "limit": 5}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    items = d if isinstance(d, list) else d.get("items") or d.get("results") or []
    assert "Kumble" in items[0].get("name", "")
    assert int(items[0].get("wkt", items[0].get("wickets", 0))) == 619


def test_player_not_found(s):
    r = s.get(f"{API}/players/odi/99999", timeout=15)
    assert r.status_code == 404


def test_ai_insight(s):
    r = s.post(f"{API}/insights/player", json={"format": "ODI", "player_id": 74}, timeout=45)
    assert r.status_code == 200
    d = r.json()
    summ = d.get("summary") or d.get("insight") or ""
    assert isinstance(summ, str) and len(summ) > 0
