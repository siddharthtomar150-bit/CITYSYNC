# CITYSYNC – Three-Member Team Responsibilities Document

This document outlines the division of responsibilities for a 3-member engineering team developing and presenting **CITYSYNC – Smart City Intelligence, Monitoring & Predictive Decision Platform**.

---

## Member 1: Full-Stack & UI/UX Architect
**Focus Area: Command Center Frontend, Geo-Spatial Mapping, and User Experience**

### Key Responsibilities:
1. **Design System & Visual Architecture**:
   - Architected the dark-mode Command Center UI (`frontend/css/style.css`) using CSS variables, custom typography, and responsive grid layouts.
   - Built the 10-section sidebar navigation and clean view switcher.
2. **Geo-Spatial Map Integration**:
   - Implemented Leaflet.js with Dark OpenStreetMap / CartoDB tiles (`frontend/js/map.js`).
   - Designed custom SVG marker icons, color-coded status badges, and interactive popups with real-time telemetry inspection.
3. **Interactive Visualizations & Incident Management**:
   - Configured multi-axis Chart.js dashboards (`frontend/js/charts.js`) with responsive sizing and tooltips.
   - Implemented Incident Center modals for creating, updating, and resolving municipal incidents.
4. **Hackathon Presentation & Demo Coordination**:
   - Coordinates the live interactive demo ("RUN CITY CRISIS SIMULATION") during the judging pitch.

---

## Member 2: Backend, Security & Real-Time WebSockets Engineer
**Focus Area: FastAPI Core, Database Modeling, REST APIs, and Live Event Streaming**

### Key Responsibilities:
1. **FastAPI Core & Router Architecture**:
   - Engineered modular REST API endpoints under `/api/v1` for Dashboard, Traffic, Electricity, Water, Incidents, Anomalies, Simulation, and Reports.
2. **Database Modeling & Session Management**:
   - Structured SQLAlchemy 2.0 ORM models (`app/models/models.py`) with foreign keys, cascading deletes, and database indexes.
   - Implemented SQLite with WAL mode and foreign key enforcement.
3. **Security & Role-Based Access Control (RBAC)**:
   - Built password hashing and JWT token creation/decoding (`app/core/security.py`).
   - Implemented role-based dependencies (`deps.py`) protecting privileged municipal actions.
4. **WebSocket Streaming Hub & Background Simulation Engine**:
   - Developed `ConnectionManager` (`app/websocket/connection_manager.py`) with automatic pruning of dead socket connections.
   - Built background simulation engine (`app/services/simulation_engine.py`) generating physically-consistent 4-second telemetry streams.

---

## Member 3: Data Engineer, Machine Learning & Cross-System Modeling Specialist
**Focus Area: Grounded Datasets, ML Model Training, and Cascading Dependency Engine**

### Key Responsibilities:
1. **Grounded Dataset Engineering**:
   - Developed municipal dataset generator (`backend/ml/data_generator.py`) modeling diurnal traffic rush hours, industrial power peaks, and hydraulic pressure profiles.
2. **Machine Learning Pipeline (Section 25)**:
   - Built and trained Random Forest Regressors for Traffic Congestion and Power Demand forecasting (`backend/ml/models.py`).
   - Implemented unsupervised Isolation Forest for multi-sensor utility anomaly detection.
   - Evaluated models using MAE, RMSE, $R^2$, Precision, Recall, and F1 scores.
   - Serialized trained model artifacts using `joblib` with uncertainty envelope estimation.
3. **Cross-System Dependency & Recommendation Engine (Core Innovation)**:
   - Designed the Infrastructure Dependency Graph (`app/services/cross_system_engine.py`) mapping physical connections between Power, Water, Traffic, and Emergency response.
   - Developed the Decision Support Recommendation Service (`app/services/recommendation_service.py`) generating answers to: What happened? Why it matters? Which infrastructure is affected? What action is suggested? What priority?
4. **Reporting & Data Export**:
   - Built CSV streaming endpoints (`app/api/reports.py`) for downloadable municipal audit trails.
