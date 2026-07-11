# 🔧 Setup & Installation Guide
## AAI Traffic Simulator – VTU ADA Mini Project

---

## ✅ Prerequisites

Make sure these are installed on your system:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| Python | v3.9+ | https://python.org |
| npm | v9+ | (comes with Node.js) |
| pip | latest | (comes with Python) |

Check versions:
```bash
node --version
python --version
npm --version
```

---

## 📦 Installation

### Step 1 – Clone / Open the project
```
Open the folder: AI TRAFFIC SIMULATOR
```

### Step 2 – Install Frontend Dependencies
```bash
cd frontend
npm install
```
This installs: React, Vite, Tailwind CSS, Framer Motion, Recharts, React Router, Axios, Lucide React.

### Step 3 – Install Backend Dependencies
```bash
cd backend
pip install flask flask-cors
```
Or using requirements.txt:
```bash
pip install -r requirements.txt
```

---

## ▶️ Running the Project

You need **two terminals** open simultaneously.

### Terminal 1 – Start Backend (Flask)
```bash
cd backend
python app.py
```
Backend runs at: **http://localhost:5000**

You should see:
```
============================================================
  AAI Traffic Simulator – Backend Server
  Running on http://localhost:5000
  API Health: http://localhost:5000/api/health
============================================================
```

### Terminal 2 – Start Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Frontend runs at: **http://localhost:3000**

---

## 🌐 Open in Browser

Navigate to: **http://localhost:3000**

The app will load with the landing page. Click **"Launch Simulator"** to start.

---

## 🎮 How to Use

### Simulator Page (`/simulator`)
1. Click **▶ Start** to begin simulation
2. Watch vehicles move on the 4-way intersection
3. Signals automatically optimize using **Greedy Algorithm**
4. Click **🚑 Deploy Ambulance** to trigger emergency priority
5. Click **⚠️ North** to simulate an accident
6. Toggle **🔥 Peak Hour** for heavy traffic mode

### Dashboard Page (`/dashboard`)
- View real-time charts updating every second
- Monitor KPIs: vehicles, wait time, congestion, throughput
- Check alert log for events

### Algorithms Page (`/algorithms`)
- Click each algorithm to see interactive visualization
- Run **Dijkstra** to see shortest path animation
- Adjust sliders in **Greedy** to see signal decisions
- Add vehicles to **Priority Queue** and process them

### Admin Page (`/admin`)
- Add/reduce vehicles
- Set custom signal timings
- Trigger voice alerts
- Toggle peak hour mode

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/traffic/state` | Get simulation state |
| POST | `/api/traffic/start` | Start simulation |
| POST | `/api/traffic/stop` | Stop simulation |
| POST | `/api/traffic/reset` | Reset simulation |
| POST | `/api/traffic/emergency` | Trigger emergency |
| POST | `/api/traffic/accident` | Trigger accident |
| POST | `/api/algorithms/dijkstra` | Run Dijkstra |
| POST | `/api/algorithms/greedy` | Run Greedy |
| POST | `/api/algorithms/sort` | Run sorting |
| GET | `/api/algorithms/graph` | Get road network |
| GET | `/api/analytics/history` | Get analytics history |

---

## ⚠️ Troubleshooting

### "npm install" fails
```bash
npm install --legacy-peer-deps
```

### Port 3000 already in use
Edit `frontend/vite.config.js` and change `port: 3000` to `port: 3001`

### Port 5000 already in use
Edit `backend/app.py` and change `port=5000` to `port=5001`
Also update `frontend/vite.config.js` proxy target.

### Python module not found
```bash
pip install flask flask-cors
```

### Frontend works without backend
The frontend is **fully standalone** – all simulation logic runs in the browser.
The backend is optional and provides persistent analytics storage.

---

## 🏗️ Build for Production

```bash
cd frontend
npm run build
```
Output in `frontend/dist/` – can be served by any static file server.

---

## 📋 Demo Checklist for VTU Internals

- [ ] Show Landing Page with animations
- [ ] Start simulation – show vehicles moving
- [ ] Demonstrate Greedy signal optimization (explain which road gets green and why)
- [ ] Deploy ambulance – show emergency priority corridor
- [ ] Trigger accident – show rerouting alert
- [ ] Show Dashboard with live charts
- [ ] Open Algorithms page – run Dijkstra visualization step by step
- [ ] Show Priority Queue with emergency vehicles
- [ ] Open Docs page – show abstract and viva Q&A
- [ ] Explain time/space complexity of each algorithm
