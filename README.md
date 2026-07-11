# 🚦 AAI Traffic Simulator
### Smart AI-Based Traffic Management System
**VTU ADA (Analysis and Design of Algorithms) Mini Project – 2024-25**

---

## 📋 Project Overview

AAI Traffic Simulator is a **real-time, AI-powered traffic management system** that uses classical ADA algorithms to solve urban traffic problems including congestion, emergency vehicle delays, accident-based blockages, and poor signal timing.

### 🎯 Key Features
- **Real-time Canvas Simulation** – 4-way intersection with live vehicle movement
- **Smart Signal Optimization** – Greedy Algorithm dynamically adjusts signal timing
- **Emergency Priority System** – Priority Queue for ambulance/police/fire truck
- **Shortest Path Routing** – Dijkstra's Algorithm for optimal route finding
- **Traffic Prediction** – Dynamic Programming for congestion forecasting
- **Live Analytics Dashboard** – Real-time charts, KPIs, and heatmaps
- **Voice Alert System** – AI voice notifications for events
- **Admin Control Panel** – Full simulation management

---

## 🧮 ADA Algorithms Implemented

| Algorithm | Purpose | Complexity |
|-----------|---------|------------|
| Dijkstra's Algorithm | Shortest path routing | O((V+E) log V) |
| Greedy Algorithm | Signal optimization | O(n log n) |
| Priority Queue (Max-Heap) | Emergency handling | O(log n) |
| Dynamic Programming | Traffic prediction | O(T × R) |
| Graph BFS/DFS | Road network modeling | O(V + E) |
| Bubble/Merge/Quick Sort | Vehicle prioritization | O(n²) / O(n log n) |
| Linear/Binary Search | Route discovery | O(n) / O(log n) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Framer Motion |
| Visualization | HTML5 Canvas API, Recharts |
| Backend | Python Flask 3.0 |
| Database | SQLite |
| Styling | Glassmorphism, Dark theme |

---

## 📁 Project Structure

```
AAI-Traffic-Simulator/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages (Landing, Simulator, Dashboard...)
│   │   ├── simulator/        # Canvas simulation engine
│   │   ├── context/          # Global state (TrafficContext)
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Helper functions
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py                # Flask application entry point
│   ├── algorithms/           # All ADA algorithm implementations
│   │   ├── dijkstra.py
│   │   ├── greedy.py
│   │   ├── priority_queue.py
│   │   ├── dynamic_programming.py
│   │   ├── sorting.py
│   │   ├── searching.py
│   │   └── graph.py
│   ├── routes/               # Flask API routes
│   └── database/             # SQLite setup
├── docs/                     # Architecture diagrams
├── report-material/          # VTU report content
├── README.md
└── setup.md
```

---

## 🚀 Quick Start

See **[setup.md](setup.md)** for detailed installation instructions.

### One-line setup (after installing Node.js and Python):

**Terminal 1 – Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 📊 Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Hero page with project overview |
| Simulator | `/simulator` | Real-time traffic simulation |
| Dashboard | `/dashboard` | Live analytics and charts |
| Algorithms | `/algorithms` | Interactive algorithm visualizations |
| Admin | `/admin` | Control panel |
| Docs | `/docs` | VTU documentation and viva Q&A |

---

## 👥 Team

| Member | Role | USN |
|--------|------|-----|
| Team Member 1 | Algorithm Design & Backend | 1XX22CS001 |
| Team Member 2 | Frontend & UI/UX | 1XX22CS002 |
| Team Member 3 | Simulation & Testing | 1XX22CS003 |
| Team Member 4 | Documentation & Report | 1XX22CS004 |

**Guide:** Prof. [Guide Name]  
**Department:** Computer Science & Engineering  
**College:** [College Name], VTU

---

## 📄 License
This project is developed for VTU academic purposes.
