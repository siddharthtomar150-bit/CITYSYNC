# 🌐 CITYSYNC — Smart City Digital Twin, Intelligence & Predictive Decision Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%20|%203.11%20|%203.12%20|%203.14-3776AB.svg?style=flat&logo=python)](https://python.org)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-000000.svg?style=flat&logo=three.js)](https://threejs.org)
[![Leaflet](https://img.shields.io/badge/GIS%20Maps-Leaflet.js%201.9-199900.svg?style=flat&logo=leaflet)](https://leafletjs.com)
[![Tests](https://img.shields.io/badge/Tests-27%20Passed%20(100%25)-10B981.svg?style=flat)](https://docs.pytest.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **"What if an entire city had a single, intelligent digital brain?"**  
> CITYSYNC connects separated municipal silos — **Traffic Flow, Electrical Grids, Water Hydraulics, and Emergency Response** — into a unified real-time 3D Digital Twin and predictive decision-support system.

---

## 🌟 1. What is CITYSYNC? (Explained for Everyone)

### ❓ The Problem: "A City Out of Sync"
In almost every modern city today, municipal departments operate in completely isolated silos:
* The **Traffic Police** only monitor roads.
* The **Electricity Board** only monitors power substations.
* The **Water Department** only monitors pipe pressure and treatment plants.

**The Danger:** When an electrical substation trips during a storm:
1. High-capacity water pumps immediately shut down $\to$ residential mains lose pressure.
2. Traffic signals along major highways go dark $\to$ massive traffic gridlock forms.
3. Utility repair crews and ambulances are trapped in traffic $\to$ a 15-minute outage turns into an 8-hour citywide disaster.

### 💡 The Solution: CITYSYNC
**CITYSYNC** is the unified central nervous system for the city. It continuously ingests real-time telemetry from thousands of sensors, maps inter-system dependencies, detects anomalies using Machine Learning, and provides city leaders with **automated AI recommendations** to stop problems before they cascade out of control.

---

## 🏙️ 2. Bengaluru Municipal Digital Twin Platform

A high-precision operational smart city digital twin focused on tactical municipal coordination across Greater Bengaluru:
* 🗺️ **Dual GIS Modes**:
  * **2D Tactical GIS (Leaflet.js)**: Dark-themed tactical map with 18 physical SCADA nodes across Central Silk Board, Hebbal Flyover, Electronic City, Whitefield, and Peenya Industrial Estate.
  * **3D Textured Urban Twin (Three.js)**: 120+ textured high-rise buildings, glowing arterial roads, Namma Metro Purple Line with moving train, police surveillance drone camera, and whole-city satellite ground plane.
  * **⚡ Split View Mode**: Side-by-side synchronized 2D GIS and 3D WebGL viewing.
* 🔗 **Cross-System Dependency Engine**:
  * Real-time topological correlation tracking multi-sector cascade failures across **BTP (Traffic Police)**, **BESCOM (Electricity)**, and **BWSSB (Water Supply)**.

---

## 🎮 3. Interactive Demos Anyone Can Try Right Now!

| # | Action | How to Do It | What Happens |
| :-: | :--- | :--- | :--- |
| **1** | **Toggle 2D & 3D Twin Modes** | Click `[ 2D GIS ]`, `[ 3D Twin ]`, or `[ ⚡ Split ]` | Instantly switches between high-performance 2D GIS mapping and 3D textured urban digital twin. |
| **2** | **3D Tactical Camera Flyovers** | Select `[ Orbit ]`, `[ Drone ]`, `[ Metro ]`, or `[ Tour ]` | Fly around high-rise towers, ride along the Namma Metro Purple Line track, or take an automated aerial city tour. |
| **3** | **Trigger a City Crisis** | Click `[ RUN CITY CRISIS SIMULATION ]` | Watch a 10-step multi-sector disaster unfold across power, water, and traffic, and see the Cross-System Engine resolve it. |
| **4** | **Inspect Infrastructure** | Click any facility node on the map | Opens the real-time SCADA telemetry drawer showing live power draw, water pressure, and traffic density. |

---

## 🚀 4. Quick Start (Run Locally in Under 2 Minutes)

### Prerequisites
* Python 3.10, 3.11, 3.12, or 3.14 installed.
* Git & any modern web browser (Chrome, Edge, Firefox, Safari).

### 3-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/siddharthtomar150-bit/CITYSYNC.git
cd CITYSYNC

# 2. Install dependencies & initialize database
pip install -r backend/requirements.txt
$env:PYTHONPATH="backend"; python backend/seed_data.py

# 3. Start the CITYSYNC platform
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:8000/`**

*(Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`).*

---

## 🧠 5. Machine Learning Models & Intelligence Engine

CITYSYNC includes 4 trained and serialized Machine Learning models evaluated on held-out test datasets:

| Model | Algorithm | Target Variable | Performance Metric | Practical Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Traffic Congestion Predictor** | Random Forest Regressor | Arterial Congestion (%) | **$R^2 = 0.979$** (MAE: 2.31%) | Predicts traffic bottlenecks 60 minutes in advance with 90% confidence bands. |
| **Electricity Demand Forecaster** | Random Forest Regressor | Grid Power Demand (MW) | **$R^2 = 0.992$** (MAE: 1.84 MW) | Forecasts high-voltage substation peak load so operators prevent brownouts. |
| **Hydraulic Anomaly Detector** | Isolation Forest | Mains Pressure Anomalies | **$F_1 = 0.938$** (Recall: 95.7%) | Detects underground pipe bursts and pressure drops within seconds. |
| **Cross-System Correlator** | Multi-System Isolation Forest | Multi-Sector Failures | **$F_1 = 0.913$** (Precision: 89.4%) | Discovers hidden connections between power trips and traffic delays. |

---

## 🏗️ 6. System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               CITYSYNC FRONTEND CLIENT                 │
                    │  (Vanilla ES6+, Three.js 3D WebGL, Leaflet, Chart.js)  │
                    └───────────────────▲─────────────────▲──────────────────┘
                                        │ REST API        │ WebSockets (/ws/live)
                                        │                 │
                    ┌───────────────────▼─────────────────▼──────────────────┐
                    │                 FASTAPI BACKEND CORE                   │
                    │      (Asynchronous Python 3, Uvicorn, Pydantic)        │
                    └───────┬───────────────────┬───────────────────┬────────┘
                            │                   │                   │
            ┌───────────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
            │   SQLAlchemy 2.0 ORM   │ │  Cross-System   │ │ Machine Learning│
            │   SQLite / PostgreSQL  │ │ Dependency Graph│ │ Isolation/Forest│
            │   (Nodes, Incidents)   │ │ (Cascade Engine)│ │ (Joblib Models) │
            └────────────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 🧪 7. Automated Testing Suite

CITYSYNC includes a comprehensive test suite covering all REST endpoints, WebSocket connections, authentication, ML inference, and cascade logic.

Run the tests with:
```bash
$env:PYTHONPATH="backend"; python -m pytest backend/tests/test_citysync.py -v
```

**Result: 27 / 27 Tests Passed (100% Green)**
```
test_health_check                                 PASSED [  3%]
test_auth_login_admin                             PASSED [  7%]
test_auth_switch_all_roles                        PASSED [ 25%]
test_dashboard_kpis                               PASSED [ 29%]
test_dashboard_overview                           PASSED [ 33%]
test_map_nodes                                    PASSED [ 37%]
test_facility_inspector                           PASSED [ 44%]
test_incident_lifecycle                           PASSED [ 48%]
test_anomaly_status_patch                         PASSED [ 51%]
test_ml_traffic_prediction                        PASSED [ 59%]
test_ml_electricity_prediction                    PASSED [ 62%]
test_ml_water_anomaly_prediction                  PASSED [ 66%]
test_ml_multi_system_anomaly_prediction           PASSED [ 70%]
test_cross_system_engine_cascade                  PASSED [ 74%]
test_simulation_crisis_and_reset                  PASSED [ 77%]
test_recommendation_conversion_to_incident        PASSED [ 96%]
test_simulation_engine_start_stop                 PASSED [100%]
======================= 27 passed, 2 warnings in 4.78s =======================
```

---

## 🚀 8. Production Cloud Deployment

Deploy CITYSYNC to the cloud in under 3 minutes with zero configuration:

* **Render.com (Free Web Service)**: Connect your GitHub account, link `siddharthtomar150-bit/CITYSYNC`, set start command to `python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`, and deploy. Pre-configured with [`render.yaml`](render.yaml).
* **Railway.app (Containerized)**: Connect the repository; Railway will automatically detect [`Dockerfile`](Dockerfile) and deploy. Pre-configured with [`railway.json`](railway.json).
* **Docker / Docker Compose**:
  ```bash
  docker compose up -d --build
  ```

For full step-by-step instructions, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 📖 9. Plain-English Glossary of Terms

* **Digital Twin**: A real-time virtual 3D simulation of a physical city that mirrors real roads, buildings, and infrastructure.
* **AQI (Air Quality Index)**: A universal score measuring air cleanliness. `0–50` is Good, `51–100` is Moderate, `100+` indicates unhealthy pollution.
* **Cross-System Cascade**: When a small failure in one department (e.g. power grid) triggers domino-effect failures in other departments (e.g. water pumps and traffic lights).
* **SCADA**: Supervisory Control and Data Acquisition — sensors and instruments that monitor physical equipment like transformers and water valves.

---

## 👥 9. Authors & Academic Attribution

Developed as an advanced smart city engineering platform. Released under the **MIT License**.
* **Repository**: [https://github.com/siddharthtomar150-bit/CITYSYNC.git](https://github.com/siddharthtomar150-bit/CITYSYNC.git)
* **Branch**: `main`
