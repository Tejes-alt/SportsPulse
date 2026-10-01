

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

