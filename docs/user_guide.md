# CITYSYNC – Operator & Administrator User Guide

## 1. Welcome to CITYSYNC

**CITYSYNC** is a centralized smart city intelligence platform engineered to monitor interconnected urban infrastructure. It eliminates departmental silos by correlating telemetry across Traffic, the Electrical Power Grid, and Municipal Water Distribution in real time.

---

## 2. Navigation Architecture (13 Sidebar Sections)

The left navigation sidebar provides instant access to all command center modules:

| Icon | Module | Functionality |
| :--- | :--- | :--- |
| 📊 | **1. Overview** | Executive high-level command center with 6 KPI cards, sparklines, live feed, and system health status. |
| 🗺️ | **2. City Digital Twin** | Full-screen interactive Leaflet.js map with facility pins, filters, search, and click-to-inspect facility drawer. |
| 🚦 | **3. Traffic Intelligence** | Real-time congestion monitoring, vehicle flow rates, bottlenecks, and average speed analytics. |
| ⚡ | **4. Energy Intelligence** | Substation megawatt (MW) load, transformer thermal status, overload indicators, and peak demand curves. |
| 💧 | **5. Water Intelligence** | Mains pressure (PSI), reservoir storage levels, treatment plant flow rates, and burst leak detection. |
| 🔄 | **6. Cross-System Intelligence** | Topological dependency graph visualizing multi-sector consequence propagation and root causes. |
| 🤖 | **7. AI Predictions** | Interactive ML prediction sandboxes with real-time inference and 90% uncertainty envelope visualizations. |
| ⚠️ | **8. Anomaly Detection** | Streaming statistical rolling Z-score and Isolation Forest anomaly radar with operator acknowledgment. |
| 🚨 | **9. Incident Management** | Municipal incident desk with full lifecycle workflow: `open` $\to$ `investigating` $\to$ `assigned` $\to$ `resolved`. |
| 💡 | **10. Recommendations** | Actionable decision-support advisories answering the 5 key questions with one-click execution. |
| 📑 | **11. Analytics & Reports** | Municipal summary reports and one-click RFC 4180 CSV dataset downloads for all sectors. |
| 🛡️ | **12. Administration** | Monitored assets table, sector distribution, system logs, and live telemetry loop controls. |
| ⚙️ | **13. Settings** | System preferences, simulated telemetry frequency, dark theme controls, and API endpoint config. |

---

## 3. Role-Based Access Control (RBAC) & Dynamic Role Switcher

CITYSYNC enforces strict role-based data and action segregation. To allow judges and city managers to explore different departmental perspectives without re-authenticating, a **Quick Role Switcher** is embedded directly in the top right navigation bar:

1. **Super Administrator (`super_admin`)**: Full platform control, asset creation, system reset, and model retraining.
2. **City Administrator (`admin`)**: Executive overview, cross-system coordination, global incident sign-off.
3. **Traffic Department (`traffic`)**: Real-time arterial corridors, traffic signal controls, road accident dispatches.
4. **Electricity Department (`electricity`)**: High-voltage substations, transformer load shedding, grid rerouting.
5. **Water Department (`water`)**: Pumping stations, reservoir levels, acoustic leak dispatch, pressure balancing.

---

## 4. Key Workflows & Features

### 4.1 Digital Twin & Facility Inspector Slide-Out Drawer
- **Navigating the Map**: Use the interactive pan and zoom controls. Switch between CartoDB Dark Matter and OpenStreetMap standard tiles.
- **Filtering Assets**: Click the category pills (`All`, `Traffic`, `Electricity`, `Water`, `Utility`) to filter markers dynamically.
- **Global Search**: Type any asset name, corridor code, or sector into the top search bar (e.g., `Central`, `Substation`, `Sector 1`) and press Enter to snap directly to the facility.
- **Click-to-Inspect**: Clicking any facility marker opens the right-hand slide-out **Facility Inspector Drawer**, displaying live telemetry gauges, 20-cycle historical trends, and past incident logs for that specific physical asset.

### 4.2 Incident Management Workflow
1. **Reporting an Incident**: Click the **"+ New Incident"** button. Select domain category, severity (`critical`, `high`, `medium`, `low`), location name, and description.
2. **Investigation**: Click **"Investigate"** on an open incident. Record sensor observations, acoustic measurements, or dispatch orders. Status transitions to `investigating`.
3. **Department Assignment**: Assign the incident to the appropriate municipal department (`assigned`).
4. **Resolution**: Click **"Resolve"** to enter formal resolution notes and archive the ticket (`resolved`).

### 4.3 Interactive Machine Learning Sandboxes
Navigate to **AI Predictions** to interact directly with trained models:
- **Traffic Sandbox**: Adjust the hour of day, rush hour toggle, prior congestion, and vehicle flow. Click **"Run Prediction"** to observe the predicted congestion percentage and the **90% confidence interval** (Lower Bound to Upper Bound).
- **Electricity Sandbox**: Adjust ambient temperature (°C), industrial shift status, and transformer temperature. Click **"Run Forecast"** to project grid demand in megawatts.
- **Model Info Tab**: View model hyperparameters, dataset sizes, feature rankings, and mathematical evaluation scores ($R^2$, MAE, RMSE, $F_1$).

### 4.4 Hackathon Crisis Simulation ("RUN CITY CRISIS SIMULATION")
To experience the platform's core capability—understanding how one infrastructure failure cascades into another:
1. Locate the red banner at the top of the interface: **"RUN CITY CRISIS SIMULATION"**.
2. Click the button to initiate the deterministic 10-step crisis scenario.
3. Observe the live propagation across 10 steps:
   - *Step 1*: Severe traffic gridlock on the Metro Central Arterial.
   - *Step 2*: High-voltage transformer overheating at East Industrial Substation.
   - *Step 3*: Substation breaker trip cuts power to the East High-Lift Water Pump Station.
   - *Step 4*: Water trunk pressure drops critically below 20 PSI.
   - *Step 5*: Emergency fire dispatch units are caught in the traffic gridlock.
   - *Steps 6–10*: Compound multi-system anomalies detected; cross-system recommendations triggered.
4. **Resetting the Demo**: Click **"RESET DEMO"** at any time. The simulation immediately resolves synthetic crisis incidents, normalizes node status badges to green, and returns the platform to baseline telemetry.
