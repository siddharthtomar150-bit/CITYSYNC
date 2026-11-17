# CITYSYNC – Comprehensive REST & WebSocket API Documentation

## 1. Overview & Architecture

CITYSYNC provides a high-performance REST and WebSocket API built on FastAPI, Pydantic v2, and SQLAlchemy. All REST endpoints are prefixed with `/api`. Live streaming data is provided via WebSockets at `/ws/live`.

- **Base URL**: `http://127.0.0.1:8000/api`
- **Interactive OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc UI**: `http://127.0.0.1:8000/redoc`
- **WebSocket Gateway**: `ws://127.0.0.1:8000/ws/live`

---

## 2. Authentication & Role Switcher (`/api/auth`)

### 2.1 Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticates user credentials and issues a JWT Bearer token valid for 24 hours.
- **Request Body**:
```json
{
  "username_or_email": "admin",
  "password": "admin123"
}
```
- **Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "admin@citysync.gov",
    "username": "admin",
    "full_name": "Elena Rostova (Chief Administrator)",
    "role": "admin",
    "department": "Municipal Administration",
    "is_active": true,
    "created_at": "2026-11-17T10:00:00Z"
  }
}
```

### 2.2 Role Switcher (Hackathon Instant RBAC)
- **Endpoint**: `GET /api/auth/switch-role/{role}`
- **Description**: Allows judges and evaluators to instantly switch perspective across all 5 municipal roles (`super_admin`, `admin`, `traffic`, `electricity`, `water`).
- **Response (200 OK)**: Returns the user object and a fresh JWT token for that role.

### 2.3 Current User Info
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Description**: Returns authenticated user profile.

---

## 3. Executive Dashboard (`/api/dashboard`)

### 3.1 KPI Cards
- **Endpoint**: `GET /api/dashboard/kpis`
- **Description**: Returns the 6 core executive cards with comparison and trend sparklines:
  1. `traffic_congestion`: Citywide average %, previous cycle delta, status.
  2. `electricity_consumption`: Total grid demand in MW, delta, status.
  3. `water_supply_status`: Mains hydraulic pressure in PSI, delta, status.
  4. `active_incidents`: Open and investigating incident count.
  5. `infrastructure_health_score`: Composite health score (0–100).
  6. `predicted_disruptions`: Zones at risk predicted by the cross-system engine.

### 3.2 Overview Feed
- **Endpoint**: `GET /api/dashboard/overview`
- **Description**: Returns node status distribution, recent incidents, active anomalies, pending recommendations, active cross-system cascades, and the chronological live activity feed.

---

## 4. Digital Twin & Interactive Map (`/api/map`)

### 4.1 Monitored Infrastructure Nodes
- **Endpoint**: `GET /api/map/nodes`
- **Query Parameters**:
  - `category` (optional): `traffic`, `electricity`, `water`, `utility`
  - `status` (optional): `normal`, `warning`, `critical`, `offline`
- **Response (200 OK)**: Array of 16 infrastructure nodes with latitude, longitude, sector, capacity, simulated telemetry badge, and latest readings.

### 4.2 Map Active Incidents Overlay
- **Endpoint**: `GET /api/map/incidents`
- **Description**: Returns geocoded active incidents with coordinates mapped to the incident's parent infrastructure node.

### 4.3 Digital Twin Global Search
- **Endpoint**: `GET /api/map/search?q={query}`
- **Description**: Searches infrastructure nodes by name, code, and sector, and incidents by title and location name.

### 4.4 Facility Telemetry Inspector
- **Endpoint**: `GET /api/map/facilities/{node_id}/inspector`
- **Description**: Returns detailed operational telemetry gauges, past 20 chronological readings, and recent facility-linked incidents for the slide-out inspector drawer.

---

## 5. Domain Telemetry APIs

### 5.1 Traffic Intelligence (`/api/traffic`)
- `GET /api/traffic/nodes`: Live traffic corridor metrics (congestion %, vehicle flow, avg speed km/h).
- `GET /api/traffic/history?node_id=1&hours=24`: Historical time-series traffic telemetry.
- `GET /api/traffic/congested-corridors`: Corridors exceeding 75% congestion threshold.

### 5.2 Energy Grid Intelligence (`/api/electricity`)
- `GET /api/electricity/substations`: Live substation metrics (power demand MW, grid load %, transformer temp °C, overload status).
- `GET /api/electricity/history?node_id=5&hours=24`: Historical power consumption telemetry.
- `GET /api/electricity/overloaded-substations`: Substations exceeding 85% rated load capacity.

### 5.3 Water & Utilities Intelligence (`/api/water`)
- `GET /api/water/facilities`: Water plants, pump stations, and reservoirs (flow L/s, pressure PSI, reservoir level %, water quality index).
- `GET /api/water/history?node_id=9&hours=24`: Historical hydraulic telemetry.
- `GET /api/water/pressure-drops`: Zones experiencing pressure drop anomalies (< 40 PSI).

---

## 6. Incident Management (`/api/incidents`)

### 6.1 List Incidents
- **Endpoint**: `GET /api/incidents`
- **Query Parameters**: `status`, `severity`, `category`, `assigned_department`
- **Supported Statuses**: `open`, `investigating`, `assigned`, `resolved`

### 6.2 Create Incident
- **Endpoint**: `POST /api/incidents`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "title": "East Main Feeder Electrical Flashover",
  "category": "electricity",
  "severity": "critical",
  "description": "Flashover on circuit breaker breaker B-102.",
  "location_name": "East Industrial Substation",
  "sector": "Sector 4 - East Industrial Park",
  "assigned_department": "electricity"
}
```

### 6.3 Update Incident Status & Investigation Notes
- **Endpoint**: `PATCH /api/incidents/{incident_id}`
- **Request Body**:
```json
{
  "status": "investigating",
  "investigation_notes": "Emergency repair crew dispatched; insulation tester deployed."
}
```

### 6.4 Resolve Incident
- **Endpoint**: `POST /api/incidents/{incident_id}/resolve?resolution_notes=Circuit+isolated+and+backup+routed`
- **Description**: Marks incident as resolved with timestamp and resolver credentials.

---

## 7. Anomaly Management (`/api/anomalies`)

- `GET /api/anomalies`: List recent anomalies filtered by category, severity, status, or detection method (`statistical_zscore`, `isolation_forest_water`, `isolation_forest_multi_system`).
- `PATCH /api/anomalies/{anomaly_id}/status`: Update resolution status (`detected`, `investigating`, `mitigated`, `resolved`).
- `POST /api/anomalies/{anomaly_id}/acknowledge`: Mark anomaly alert as acknowledged by operator.

---

## 8. Cross-System Cascades & Recommendations (`/api/recommendations`)

- `GET /api/recommendations`: Retrieve actionable multi-sector advisories answering:
  1. What happened?
  2. Why did it happen?
  3. What systems will be affected next?
  4. What preventive action should be taken?
  5. What is the expected outcome?
- `POST /api/recommendations/{recommendation_id}/apply`: Execute a recommended municipal mitigation action.
- `POST /api/recommendations/{recommendation_id}/dismiss`: Dismiss recommendation with recorded justification.

---

## 9. Machine Learning Endpoints (`/api/ml`)

### 9.1 Model Metadata & Registry
- **Endpoint**: `GET /api/ml/models/info`
- **Description**: Returns algorithm types, dataset sizes, input feature lists, evaluation metrics (MAE, RMSE, $R^2$, Precision, Recall, $F_1$), and comparison test samples for all 4 models.

### 9.2 Traffic Congestion Prediction
- **Endpoint**: `POST /api/ml/predict/traffic`
- **Request Body**:
```json
{
  "hour_of_day": 18,
  "day_of_week": 2,
  "is_weekend": 0,
  "is_rush_hour": 1,
  "prev_hour_congestion": 72.0,
  "rolling_3h_congestion": 65.0,
  "weather_impact_score": 1.1,
  "vehicle_flow": 1400.0
}
```
- **Response (200 OK)**:
```json
{
  "model": "RandomForestRegressor (Traffic Congestion)",
  "predicted_congestion_pct": 76.4,
  "uncertainty_sigma": 3.2,
  "lower_bound_90pct": 71.1,
  "upper_bound_90pct": 81.7
}
```

### 9.3 Power Demand Prediction
- **Endpoint**: `POST /api/ml/predict/electricity`
- **Request Body**: Ambient temperature, industrial shift, lag MW, transformer temperature.
- **Response**: Predicted demand in MW with 90% confidence envelope.

### 9.4 Water Utility Anomaly Detection
- **Endpoint**: `POST /api/ml/predict/water-anomaly`
- **Request Body**: Flow rate, pressure, reservoir level, water quality index.
- **Response**: `is_anomaly` (boolean), `anomaly_score`, and `decision_threshold`.

### 9.5 Multi-System Infrastructure Anomaly Detection
- **Endpoint**: `POST /api/ml/predict/multi-system-anomaly`
- **Request Body**: Diurnal hour, traffic congestion %, power demand MW, water pressure PSI, water flow L/s.
- **Response**: Compound anomaly classification and multi-system risk evaluation.

### 9.6 Model Retraining
- **Endpoint**: `POST /api/ml/train`
- **Description**: Re-runs training pipelines, updates `.joblib` files, updates database registry, and hot-reloads models in memory.

---

## 10. Simulation Engine Controls (`/api/simulation`)

- `GET /api/simulation/status`: Checks if background simulation loop is active, total cycles run, and crisis state.
- `POST /api/simulation/start`: Starts 4-second periodic background telemetry loop.
- `POST /api/simulation/stop`: Pauses background loop.
- `POST /api/simulation/crisis`: Executes the 10-step Hackathon Crisis Demonstration sequence.
- `POST /api/simulation/reset`: Resets all nodes, clears crisis anomalies, resolves demo incidents, and returns system to baseline.

---

## 11. Reports & Data Streaming (`/api/reports`)

- `GET /api/reports/daily-summary`: Returns structured executive municipal report with aggregate statistics and key indicators.
- `GET /api/reports/export-csv?dataset_type={type}`: Streams RFC 4180-compliant CSV files. Supported types: `traffic`, `electricity`, `water`, `incidents`, `anomalies`, `predictions`.

---

## 12. WebSocket Real-Time Telemetry Gateway (`/ws/live`)

### Handshake & Protocol
- **URL**: `ws://127.0.0.1:8000/ws/live`
- **Heartbeat**: Client sends `"ping"`, server returns `"pong"`.
- **Payload Broadcast Format**:
```json
{
  "type": "telemetry_update",
  "cycle": 142,
  "timestamp": "2026-11-17T11:00:00Z",
  "crisis_mode": false,
  "kpis": { ... },
  "nodes": [ ... ],
  "new_anomalies": [ ... ],
  "cascades": [ ... ]
}
```
When crisis mode is triggered:
```json
{
  "type": "crisis_event",
  "crisis_step": 3,
  "headline": "WATER TRUNK PRESSURE PLUMMETS",
  "description": "Substation outage disabled East High-Lift Water Pump #2...",
  "cascades": [ ... ]
}
```
Client WebSocket automatically handles reconnection with exponential backoff.
