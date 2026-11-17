# CITYSYNC – System Architecture & Technical Specification

## 1. Executive Architectural Overview

**CITYSYNC** is an enterprise-grade Smart City Intelligence, Monitoring & Predictive Decision Platform engineered to resolve the core urban dilemma: **"A City Out of Sync"**. 

In conventional municipalities, Traffic Control, the Electrical Power Grid, and Municipal Water Distribution operate in siloed departmental vacuums. When a perturbation occurs in one domain (e.g., a power feeder trip or an arterial multi-lane collision), traditional monitoring systems fail to model the downstream consequences. CITYSYNC introduces a **Centralized Cross-System Intelligence Engine** that connects real-time telemetry, evaluates dependency graphs, and delivers actionable decision-support advisories before urban failures cascade.

```mermaid
flowchart TD
    subgraph IoT_Telemetry["Simulated Municipal Telemetry Layer"]
        T1["Traffic Sensors (Flow, Speed, Congestion %)"]
        T2["Grid Substations (MW Demand, Load %, Temp °C)"]
        T3["Water SCADA (Flow L/s, Pressure PSI, Reservoirs)"]
    end

    subgraph Core_Backend["CITYSYNC FastAPI Backend Core"]
        SimEng["Background Simulation Engine (4s cycles)"]
        DB[(SQLite / PostgreSQL ORM)]
        
        subgraph Analytics_Engine["Analytics & Intelligence Suite"]
            StatAnom["Rolling Z-Score & Statistical Anomaly Detector"]
            DepGraph["Cross-System Infrastructure Dependency Graph"]
            ML_RF["Random Forest Regressors (Traffic & Electricity)"]
            ML_IF["Isolation Forest Unsupervised Anomaly Detector"]
            RecService["Smart Recommendation & Decision Service"]
        end

        WS_Mgr["FastAPI WebSocket Connection Manager"]
        REST_API["FastAPI REST Endpoints (/api/v1)"]
    end

    subgraph Command_Center["Frontend Command Center UI"]
        Dashboard["Overview Executive Dashboard"]
        LeafletMap["Leaflet.js Geo-Referenced Map"]
        ChartJS["Chart.js Telemetry & ML Visualizations"]
        CrisisTimeline["10-Step Crisis Demo Timeline"]
        IncidentDesk["Incident Management CRUD & Workflow"]
    end

    T1 & T2 & T3 --> SimEng
    SimEng --> DB
    SimEng --> StatAnom & ML_IF
    StatAnom & ML_IF --> DepGraph
    DepGraph --> RecService
    RecService --> DB
    SimEng --> WS_Mgr
    WS_Mgr -.->|Live Telemetry & Crisis Stream| Command_Center
    REST_API <-->|REST Inquiries & Admin Commands| Command_Center
```

---

## 2. Subsystem Architecture

### 2.1 Backend Core (Python 3 & FastAPI)
- **FastAPI Framework**: High-performance asynchronous API framework utilizing ASGI architecture with `uvicorn`.
- **SQLAlchemy 2.0 ORM**: Clean separation of data models, database sessions, and connection pooling. Configured for SQLite with WAL mode and foreign key enforcement; fully compatible with PostgreSQL.
- **Pydantic Validation**: Strict schema typing, input validation, and serialization.
- **Role-Based Access Control (RBAC)**: JWT bearer token authentication with role enforcement (`admin`, `traffic`, `electricity`, `water`).

### 2.2 Machine Learning & Predictive Analytics (`backend/ml/`)
- **Traffic Random Forest Regressor**: Predicts road segment congestion level (%) based on hour of day, rush-hour indicators, historical lag congestion, and vehicle volume.
- **Electricity Random Forest Regressor**: Forecasts grid power demand (MW) based on diurnal cycles, ambient temperature cooling load, and industrial shifts.
- **Utility Isolation Forest**: Unsupervised recursive isolation tree ensemble identifying multivariate anomalies across water flow, distribution pressure, and hydraulic ratios.
- **Uncertainty Quantification**: Point predictions supplemented by empirical 90% confidence envelopes ($\hat{y} \pm z \cdot \sigma_{\text{trees}}$).

### 2.3 Cross-System Dependency Engine (`backend/app/services/cross_system_engine.py`)
- **Dependency Topology Graph**: Encodes physical infrastructure relationships:
  - Substation $\to$ Water Pumping Station (Power Feed)
  - Arterial Corridor $\to$ Emergency & Utility Depot (Transit Access)
  - Water Trunk Mains $\to$ Subsurface Road Base (Pavement Stability)
  - Distribution Mains $\to$ Civic Fire Hydrant Network (Fire-Flow Pressure)
- **Cascade Evaluation**: When telemetry trips an anomaly threshold, the engine evaluates affected downstream nodes, projects consequence delays (in minutes), assigns cascading severity, and pushes actionable intervention plans.

### 2.4 Real-Time WebSockets (`/ws/live`)
- Maintains bi-directional persistent connections to all connected command center clients.
- Periodically pushes 4-second telemetry cycles.
- Broadcasts instant anomaly alerts, incident transitions, and crisis demonstration timeline steps.

### 2.5 Modern Command Center Interface
- Single-page application designed with HTML5, CSS3, Vanilla JavaScript.
- Interactive Leaflet.js with OpenStreetMap dark tiles and custom SVG pulse pins.
- Chart.js telemetry charts, sparklines, and confidence envelope graphs.
- 10 full navigation views with zero placeholder pages.
