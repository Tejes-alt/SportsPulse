
<div align="center">

# 🟢 SportsPulse

### Cricket Performance Analytics & Algorithmic Team Selection

**Explore the data. Understand the algorithms. Build a better XI.**

A full-stack, data-driven cricket analytics platform combining historical ODI and Test records, interactive visualizations, custom data structures, and constrained team optimization.

[**🌐 Live Demo**](https://sports-pulse-alpha.vercel.app/) · [**Features**](#-features) · [**Algorithms**](#-algorithms--applications) · [**Run Locally**](#-getting-started) · [**API**](#-api-reference)

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)
![DSA](https://img.shields.io/badge/Focus-Advanced%20DSA-16A34A)

</div>

---

## 📖 Overview

**SportsPulse** is an academic, full-stack cricket analytics project focused on historical **Indian ODI and Test cricket**. It turns tabular career records into searchable player profiles, visual performance insights, leadership analytics, and intelligently constructed playing XIs.

Beyond a conventional statistics dashboard, SportsPulse implements and demonstrates **string matching, prefix data structures, edit-distance dynamic programming, network-flow optimization, greedy heuristics, and randomized sampling**. The platform is designed to help users understand **where an algorithm is useful, why it is selected, and how it works**.

> **Project workflow:** Cricket records → Parsing and validation → Analytics and algorithms → Interactive insights and team decisions.

### What makes SportsPulse different?

- **Real data, practical algorithms:** Apply DSA techniques to cricket-name search, approximate matching, and selection under constraints.
- **Explainable algorithm implementations:** Visualize matching, intermediate states, and algorithm behavior rather than only viewing final outputs.
- **Two team-selection approaches:** Compare exact minimum-cost assignment against a faster greedy heuristic.
- **Transparent modeling:** Distinguish career-based statistical scores from official roles or predictions about future matches.
- **Modular full-stack design:** React-based visualization, browser-side string algorithms, and Python-based analytics and optimization.

## ✨ Features

| Module | Route | What it does |
|---|---|---|
| 📊 **Dashboard** | `/` | Dataset summaries, performance KPIs, leading players, and statistical charts. |
| 👥 **Players** | `/players` | Search, filter, sort, and browse ODI/Test player records. |
| 📈 **Player Profile** | `/players/:format/:id` | Explore individual batting, bowling, fielding, and derived metrics. |
| ⚔️ **Compare** | `/compare` | Compare two players using numerical metrics and visualizations. |
| 🔎 **Smart Search** | `/search` | Exact, prefix, substring, and fuzzy player-name search with selectable algorithms. |
| 🧪 **Algorithm Lab** | `/lab` | Study algorithms using interactive demonstrations, traces, and benchmarks. |
| 🗂️ **Dataset Explorer** | `/dataset` | Inspect source-derived records with filtering, sorting, and pagination. |
| 👑 **Captain Analytics** | `/captains` | Explore ODI/Test captaincy records, outcomes, rankings, and timelines. |
| 🧩 **Smart Team Builder** | `/team-builder` | Choose candidates, configure roles, and construct an XI using an exact or quick method. |
| 🏆 **Best XI Optimizer** | `/best-xi` | Optimize a historical XI over the eligible dataset with configurable objectives. |
| 🎲 **Discover Players** | `/discover` | Discover eligible players via uniform reservoir sampling. |

### Intelligent team selection (SportsPulse 2.0)

The **Smart Team Builder** allows users to create a candidate squad, exclude players, choose a format, set a minimum-match threshold, and assign **11 role slots** across batters, bowlers, all-rounders, and wicketkeepers.

The **Best XI Optimizer** applies the same optimization engine to a broader historical player pool. Both interfaces support:

- **Balanced**, **batting-focused**, or **bowling-focused** scoring strategies.
- **Optimal assignment:** minimum-cost maximum-flow to maximize the implemented additive role score subject to eligibility and quota constraints.
- **Quick selection:** a greedy heuristic for a faster, non-guaranteed alternative.
- **Role-coverage and feasibility feedback**, including explanations when 11 positions cannot be filled.
- **Lineup comparisons**, player exclusions, CSV export, and browser-local saved lineups.

The default quotas are **4 batting + 4 bowling + 2 all-round + 1 keeper = 11**. They are configurable, but must always total 11.

## 🧠 Algorithms & Applications

| Area | Algorithm / technique | Where used | Why it matters |
|---|---|---|---|
| String matching | **Naive matching** | Algorithm Lab | Establishes a straightforward baseline for substring searches. |
| String matching | **Knuth–Morris–Pratt (KMP)** | Smart Search, Algorithm Lab | Avoids unnecessary text comparisons using the LPS array. |
| String matching | **Z-function** | Smart Search, Algorithm Lab | Uses prefix information for efficient pattern discovery. |
| String matching | **Rabin–Karp** | Smart Search, Algorithm Lab | Uses rolling hashes to identify candidate substring matches. |
| Prefix search | **Trie** | Smart Search, Algorithm Lab | Supports exact/prefix lookup and autocomplete suggestions. |
| Multi-pattern search | **Aho–Corasick** | Algorithm Lab | Finds multiple patterns in one pass after preprocessing. |
| Dynamic programming | **Wagner–Fischer / Levenshtein distance** | Smart Search, Algorithm Lab | Provides typo-tolerant player-name matching. |
| Network optimization | **Minimum-cost maximum-flow** | Team Builder, Best XI | Finds the highest-scoring feasible role assignment under the model. |
| Shortest paths | **Bellman–Ford relaxation** | Team optimization engine | Finds augmenting paths in the residual flow network, including reverse edges. |
| Heuristics | **Greedy role assignment** | Team Builder, Best XI | Provides a simpler alternative without an optimality guarantee. |
| Randomized algorithms | **Reservoir sampling** | Discover Players | Selects uniformly random eligible records using a fixed-size sample. |
| General analytics | **Filtering, ranking, aggregation, normalization** | Dashboard, Players, Compare, Captains | Converts raw career records into interpretable comparisons. |

### Algorithm details

**KMP:** Builds an LPS array and matches a pattern in **O(n + m)** time, where `n` is the text length and `m` is the pattern length. This avoids restarting comparisons after every mismatch.

**Rabin–Karp:** Uses rolling hashes for candidate substring matches. It generally performs efficiently but must account for hash collisions.

**Trie:** Organizes names by shared prefixes, supporting prefix traversal based on query length rather than repeatedly comparing every complete name.

**Levenshtein distance:** Uses a dynamic-programming table to find the minimum insertions, deletions, and substitutions needed to transform one name into another. Its implemented full-matrix form uses **O(nm)** time and space.

**Minimum-cost maximum-flow:** Builds a flow network:

```text
Source → Eligible Players → Role Slots → Sink
            cap: 1          role quotas
```

Each player can occupy at most one position. Eligible player-to-role edges are assigned costs derived from their performance score, so minimizing total cost maximizes the **defined additive score** for the selected XI.

**Reservoir sampling:** Selects `k` records from `n` eligible records in **O(n)** time and **O(k)** auxiliary space, without needing to shuffle the whole dataset.

> **Accuracy note:** The greedy team builder is a heuristic, not a formally established approximation algorithm. The exact solver optimizes only the implemented additive role-score formulation; it does not prove which players would perform best in a future match.

## 🎓 DSA-3 Syllabus Alignment

| Module | Coverage in SportsPulse |
|---|---|
| **1 — Advanced Algorithmic Problems** | Algorithm selection, runtime comparisons, practical complexity trade-offs. |
| **2 — String Algorithms** | Naive, KMP, Z-function, Rabin–Karp, Trie, and Aho–Corasick. |
| **3 — Advanced Dynamic Programming** | Wagner–Fischer edit distance and fuzzy name matching. |
| **4 — Network Flow** | Role-assignment network, residual paths, and minimum-cost maximum-flow. |
| **5 — NP-Completeness & Approximation** | Greedy heuristic comparison; no NP-completeness proof or approximation guarantee is claimed. |
| **6 — Randomized & Parallel Algorithms** | Reservoir sampling; parallel algorithms are not implemented in this project. |

These are **implemented examples** aligned with course themes, **not complete coverage** of every topic in the syllabus.

## 🏗️ System Architecture

```text
                   ┌─────────────────────────────┐
                   │       React Frontend        │
                   │  Pages • Charts • Controls  │
                   └─────────────┬───────────────┘
                                 │
                   ┌─────────────┴───────────────┐
                   │                             │
                   ▼                             ▼
       ┌───────────────────────┐     ┌─────────────────────────┐
       │ Browser DSA Engine    │     │ Axios HTTP / JSON API   │
       │ KMP • Trie • Z • DP   │     └────────────┬────────────┘
       │ Lab traces / search   │                  │
       └───────────────────────┘                  ▼
                                    ┌─────────────────────────┐
                                    │    Python + FastAPI     │
                                    │ Parsing • APIs • Scoring│
                                    │ Min-cost flow • Sampling│
                                    └────────────┬────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────────┐
                                    │ Historical CSV Datasets │
                                    │ ODI/Test players        │
                                    │ ODI/Test captains       │
                                    └─────────────────────────┘
```

**Architectural distinction:** String algorithms and their visual traces execute in the **frontend**, while data processing and team-selection algorithms execute in the **backend**. The backend also initializes a MongoDB client via environment configuration; the historical cricket statistics used by these features are read from bundled CSV files.

## 🛠️ Technology Stack

| Layer | Tools | Role |
|---|---|---|
| Frontend | **React 18, JavaScript, React Router** | Component-based pages and client-side navigation. |
| Styling and UI | **Tailwind CSS, Radix UI components, Framer Motion, Lucide React** | Responsive layouts, interactions, animations, and icons. |
| Visualization | **Recharts** | Statistical charts, comparisons, and visual analytics. |
| API client | **Axios** | Browser-to-backend HTTP requests. |
| Backend | **Python, FastAPI, Uvicorn** | REST endpoints, parsing, validation, and algorithm execution. |
| Data processing | **Python CSV utilities; Pandas/NumPy dependencies** | Historical data manipulation and calculations. |
| Source data | **CSV** | ODI and Test player/captain career records. |
| Config / optional integration | **python-dotenv, Motor/MongoDB client** | Backend startup configuration and MongoDB client initialization. |
| Browser persistence | **localStorage** | Local lineup saving without user accounts. |
| Frontend deployment | **Vercel (live demo URL)** | Public access to the React application. |

## 📂 Repository Structure

```text
SportsPulse/
├── backend/
│   ├── data/
│   │   ├── AllOdiPlayers.csv
│   │   ├── AllOdicaptains.csv
│   │   ├── AllTestplayers.csv
│   │   └── AllTestcaptains.csv
│   ├── tests/
│   │   ├── backend_test.py
│   │   └── test_team_engine.py
│   ├── server.py                 # FastAPI + CSV parsing + analytics
│   ├── team_engine.py            # Scores + optimization + sampling
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Shared UI and algorithm visualizers
│   │   ├── pages/               # Dashboard, Players, Lab, TeamStudio, etc.
│   │   ├── lib/
│   │   │   ├── algorithms.js     # String algorithms and DP
│   │   │   ├── traces.js         # Step-by-step algorithm states
│   │   │   └── api.js           # Axios API functions
│   │   └── App.js               # Application routes
│   ├── package.json
│   ├── package-lock.json
│   └── craco.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Python 3** with `pip` and virtual environment support.
- **Node.js** and **npm** compatible with the project's React/CRACO toolchain.
- A local or remote **MongoDB connection**, because the current backend initializes a MongoDB client on import. Cricket analytics data itself is CSV-based.
- The four CSV datasets under `backend/data/`.

### 1. Clone the project

```bash
git clone <YOUR_REPOSITORY_URL>
cd SportsPulse
```

If using the supplied ZIP instead, extract it and open the `SportsPulse` folder. Replace the placeholder Git URL above with your own repository URL.

### 2. Configure and run the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

**Windows (PowerShell):**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

Install the requirements:

```bash
pip install -r requirements.txt
```

Create `backend/.env` with the required environment variables:

```dotenv
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=sportspulse
```

Use your own valid MongoDB connection values. Do **not** commit real credentials or production `.env` files.

Start the API from inside `backend/`:

```bash
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

- API root: `http://localhost:8000/api/`
- Interactive OpenAPI documentation: `http://localhost:8000/docs`

### 3. Configure and run the frontend

Open a **second terminal**, then:

```bash
cd SportsPulse/frontend
```

If you are already in the repository root, use `cd frontend` instead.

Create `frontend/.env`:

```dotenv
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Important:** The client appends `/api` to this value automatically. Do not include `/api` in `REACT_APP_BACKEND_URL`.

Install dependencies and start React:

```bash
npm ci --legacy-peer-deps
npm start
```

If the lockfile and local npm version do not work together, try `npm install --legacy-peer-deps` instead.

Open **http://localhost:3000** in your browser. Keep both the backend and frontend processes running.

### Production build

```bash
cd frontend
npm run build
```

When deploying, configure `REACT_APP_BACKEND_URL` to the publicly reachable backend origin and configure allowed CORS origins appropriately. Deploying the React frontend alone does not automatically deploy the Python API.

## 🔌 API Reference

Base path: **`/api`**. The interactive API documentation is available at `/docs` when FastAPI is running.

### Analytics and records

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/` | Basic API status. |
| `GET` | `/api/stats/overview` | Overall dataset statistics. |
| `GET` | `/api/stats/top-performers` | Ranked player records by format and metric. |
| `GET` | `/api/players` | Player records with query, format, sort, role, and match filters. |
| `GET` | `/api/players/lookup` | Look up a player by name. |
| `GET` | `/api/players/{format}/{player_id}` | Detailed individual player data. |
| `GET` | `/api/captains` | Captaincy records and supported filters. |
| `GET` | `/api/names` | Player-name data used by browser-side search. |

### Team-building and discovery

**`POST /api/teams/build`** — construct an XI using an optimal or greedy method.

Example request:

```json
{
  "format": "ODI",
  "strategy": "balanced",
  "quotas": {
    "batting": 4,
    "bowling": 4,
    "allround": 2,
    "keeper": 1
  },
  "min_matches": 10,
  "candidate_ids": null,
  "exclude_ids": [],
  "method": "optimal"
}
```

- `format`: `ODI` or `Test`.
- `strategy`: `balanced`, `batting`, or `bowling`.
- `quotas`: All four role keys are required and must sum to **11**.
- `candidate_ids`: Optional list restricting selection to particular players; `null` uses the eligible pool.
- `exclude_ids`: Optional list of players to omit.
- `method`: `optimal` (min-cost max-flow) or `quick` (greedy).

The response includes a selected `team`, `score`, assigned roles, player/role coverage information, a `feasible` indicator, and descriptive feedback.

**`GET /api/teams/discover`** — randomly sample eligible players.

Example:

```http
GET /api/teams/discover?format=ODI&count=8&min_matches=10&role=bowling
```

The optional `role` filter accepts the role keys used by the team engine. The response includes the eligible-pool count and sampled player items.

## 🧪 Testing

From the **repository root**, run the team-engine tests:

```bash
python -m pytest -n 0 backend/tests/test_team_engine.py
```

To run the available backend test suite:

```bash
python -m pytest -n 0 backend/tests
```

To build-check the frontend:

```bash
cd frontend
npm ci --legacy-peer-deps
npm run build
```

**Note:** The presence of test files does not imply every deployment, API route, or browser interaction has been verified. Run the commands in your environment and inspect their actual results.

## 📊 Data & Model Limitations

SportsPulse is an **analytics and educational decision-support system**. The source datasets contain career aggregates, not full match-by-match context or certified role labels.

1. **Historical data:** Figures reflect the bundled ODI/Test CSV files; they are not a live cricket data feed.
2. **Inferred roles:** Batting, bowling, all-rounder, and keeper eligibility is inferred from runs, wickets, matches, and stumpings. It may differ from official playing positions.
3. **Heuristic scoring:** Batting, bowling, and fielding indicators are transformed into weighted role scores. These are design choices, not calibrated forecasts.
4. **Optimization scope:** Minimum-cost maximum-flow optimizes the formulated additive assignment under its quotas and eligibility rules. It does not account for every real-world cricket selection factor.
5. **Greedy limitations:** Quick selection does not guarantee the optimal score, and it may fail to fill every role even when a globally feasible assignment exists.
6. **Local saves:** Saved lineups reside in the browser's `localStorage`; there is no login-based cloud persistence for them.
7. **Search and explorer scope:** Some pages fetch bounded result sets, so client-side operations may not represent every source record at once.

## 🔐 Security & Configuration

- Store credentials in local environment files or hosting-platform secrets.
- Do not commit `.env` files containing passwords, API keys, or private connection strings.
- Review repository history for credentials before making a project public.
- Restrict production CORS settings to trusted frontend origins.
- Use HTTPS for publicly deployed frontend/backend traffic.

## 🛣️ Future Enhancements

Potential improvements include official player role annotations, richer match-level data, backend-driven pagination and indexing, improved team-optimization performance, additional syllabus algorithms, and stronger end-to-end test coverage.

These are **future improvements**, not claims about features already implemented.

## 🎯 Project Objective

SportsPulse demonstrates how advanced algorithms can move beyond textbook exercises into a cohesive application that processes real data, explains algorithmic decisions, and supports constrained optimization.

<div align="center">

### 🟢 SportsPulse

**Data → Algorithms → Analysis → Insight**

*Built as an academic Data Structures & Algorithms project.*

[**Explore the Live Application ↗**](https://sports-pulse-alpha.vercel.app/)

</div>
