

# 🟢 SportsPulse

### Sports Performance Analytics Platform

<p align="center">
  <b>Turning cricket statistics into interactive insights through data structures and advanced algorithms.</b>
</p>

---

## 🏏 Overview

**SportsPulse** is a full-stack sports analytics platform built around **ODI and Test cricket data**.

It combines a modern analytics interface with a custom algorithm engine to explore player performance, compare athletes, analyze captaincy records, search large datasets, and visualize advanced DSA concepts through real-world sports data.

---

## ✨ Features

| Module | Description |
|---|---|
| 📊 **Dashboard** | Performance KPIs, leaders and dataset overview |
| 👤 **Players** | Search, filter, sort and explore player statistics |
| ⚔️ **Compare** | Head-to-head player performance analysis |
| 🔎 **Smart Search** | Algorithm-powered player and pattern search |
| 🧪 **Algorithm Lab** | Interactive demonstrations of implemented algorithms |
| 🗃️ **Dataset** | Explore the underlying cricket records |
| 👑 **Captains** | ODI & Test captaincy performance analytics |
| 📈 **Player Profiles** | Detailed batting, bowling and fielding analysis |

---

## 🧠 Algorithm Engine

SportsPulse connects advanced DSA concepts directly to real sports-data problems.

### String Algorithms

```text
Naive String Matching
KMP
Z-Function
Rabin-Karp
Trie
Aho-Corasick
````

### Dynamic Programming

```text
Wagner-Fischer
Levenshtein Edit Distance
```

The Algorithm Lab makes intermediate algorithm states visible, allowing the computational process to be explored rather than treating algorithms as black boxes.

---

## 🏗️ Architecture

```text
                 ┌─────────────────┐
                 │   Cricket Data  │
                 │   ODI + Test    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  FastAPI Backend│
                 │ Data Processing │
                 └────────┬────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │     DSA Engine         │
              │ Search • Matching • DP │
              └───────────┬────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  React Frontend │
                 │ Analytics + UI  │
                 └─────────────────┘
```

---

## 🛠️ Tech Stack

**Frontend**

* React
* Tailwind CSS
* Framer Motion
* Recharts
* Axios
* Lucide React

**Backend**

* Python
* FastAPI
* Uvicorn

**Data**

* CSV-based ODI & Test cricket datasets

---

## 📂 Project Structure

```text
SportsPulse/
│
├── backend/
│   ├── data/
│   │   ├── AllOdiPlayers.csv
│   │   ├── AllOdicaptains.csv
│   │   ├── AllTestplayers.csv
│   │   └── AllTestcaptains.csv
│   ├── server.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   ├── package.json
│   └── craco.config.js
│
└── README.md
```

---

## 🚀 Run Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

The application will run at:

```text
http://localhost:3000
```

---

## 🎯 Project Goal

SportsPulse was built to demonstrate how **advanced algorithms can solve practical problems instead of existing only as textbook concepts**.

Instead of:

> Data → Table

SportsPulse aims for:

> **Data → Algorithms → Analysis → Insight**

---

## 👨‍💻 Built With

Designed and developed as an academic **Data Structures & Algorithms project**, combining algorithm implementation, backend engineering, data processing, and modern frontend development.

---

### 🟢 SportsPulse

**Explore the data. Understand the algorithm. Discover the performance.**


## SportsPulse 2.0: Intelligent cricket team selection

The original dashboard and all existing player, comparison, search, dataset and algorithm-lab pages remain available. Three additional routes follow the project's dark emerald design:

- `/team-builder`: search and select a candidate squad, configure 11 role slots, check feasibility, and assign players using min-cost max-flow or a fast greedy heuristic.
- `/best-xi`: optimize a historical XI using all eligible ODI or Test players. Compare balanced, batting-focused and bowling-focused objectives, remove unwanted players, export CSV, and save results locally in your browser.
- `/discover`: refresh a uniformly sampled collection of eligible players using streaming reservoir sampling.

### New API endpoints

- `POST /api/teams/build`: JSON request supports `format`, `strategy`, `quotas`, `min_matches`, optional `candidate_ids`, `exclude_ids`, and `method` (`optimal` or `quick`). Returns selection, role coverage, score and feasibility details.
- `GET /api/teams/discover?format=ODI&count=8&min_matches=10&role=bowling` (role optional): random eligible players and pool size.

### Data and modeling limitations

The provided CSV records hold career aggregates, not official position annotations, ball-by-ball match data, salaries or opponent-adjusted form. Player eligibility for batting, bowling, all-rounder and keeper is therefore inferred from the recorded career statistics and **must not** be interpreted as official player positions. The optimizer maximizes an explicitly defined historical score, not expected future match performance. The exact max-flow assignment is globally optimal for this *additive role-score formulation*, not for arbitrary selection constraints. The quick greedy method is not guaranteed to be optimal or feasible when an optimal solution is feasible. Saved lineups use local browser storage (no login or server persistence).

### Testing

Run backend tests from the repository root with `python -m pytest -n 0 backend/tests/test_team_engine.py`. Frontend builds with `cd frontend && npm ci && npm run build` when npm dependencies are available. The existing backend environment configuration and CSV datasets are retained.
