# CITYSYNC – Security & Governance Architecture

## 1. Security Overview

CITYSYNC is designed with defense-in-depth principles appropriate for municipal critical infrastructure intelligence. The application enforces strong authentication, granular role-based authorization, parameterized query execution, robust input validation, and clear data classification boundaries.

---

## 2. Authentication & Credential Security

### 2.1 Password Storage & Cryptographic Hashing
- **Algorithm**: Bcrypt (`bcrypt.hashpw` / `bcrypt.checkpw`) with automatic 12-round salt generation.
- **Resilient Fallback**: PBKDF2-HMAC-SHA256 with 100,000 iterations for cross-platform zero-dependency compatibility.
- **Zero Plaintext Storage**: Passwords are never written to disk, database rows, or log files in plaintext.

### 2.2 Token-Based Session Management
- **Standard**: JSON Web Tokens (JWT) adhering to RFC 7519.
- **Signature Algorithm**: HMAC-SHA256 (`HS256`) signed with an environment-configured secret key.
- **Token Claims**: Subject (`sub` = username), assigned role (`role`), and UTC expiration (`exp`).
- **Token Lifetime**: 24 hours (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`).
- **Transport**: Standard HTTP `Authorization: Bearer <TOKEN>` header.

---

## 3. Role-Based Access Control (RBAC) Matrix

CITYSYNC segregates administrative, tactical, and operational responsibilities across 5 distinct municipal personas:

| Action / Capability | `super_admin` | `admin` | `traffic` | `electricity` | `water` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Command Center Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Interactive Digital Twin Map | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Telemetry History | ✅ | ✅ | ✅ | ✅ | ✅ |
| Run ML Predictive Inference | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Municipal Incidents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Investigate & Update Incidents | ✅ | ✅ | Category Match | Category Match | Category Match |
| Resolve Incidents | ✅ | ✅ | Category Match | Category Match | Category Match |
| Acknowledge Anomaly Alerts | ✅ | ✅ | Category Match | Category Match | Category Match |
| Apply Cross-System Recommendations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Trigger Hackathon Crisis Simulation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Retrain Machine Learning Models | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modify Monitored Asset Definitions | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Threat Modeling & Attack Surface Mitigation

### 4.1 SQL Injection (SQLi) Prevention
- **Architecture**: 100% of database access is mediated through the **SQLAlchemy 2.0 ORM**.
- **Mechanisms**: Queries use compiled, parameterized statements. Raw SQL string concatenation is strictly prohibited across the entire backend code base.

### 4.2 Cross-Site Scripting (XSS) Prevention
- **Frontend Architecture**: Written in standard Vanilla JavaScript (ES6+).
- **Sanitization**: Dynamic UI updates bind user-controlled input (incident titles, descriptions, investigation notes) using DOM `element.textContent` or strict HTML attribute escaping rather than raw `innerHTML` injection.

### 4.3 Input Validation & Schema Hardening
- **Validation Engine**: Pydantic v2 schemas (`backend/app/schemas/schemas.py`).
- **Constraint Enforcement**:
  - Diurnal hours bounded: `0 <= hour <= 23`.
  - Congestion levels bounded: `0.0 <= congestion <= 100.0`.
  - Ambient temperatures bounded: `-10.0 <= temp <= 55.0`.
  - Non-conforming or maliciously injected payloads are rejected at the ASGI routing layer with HTTP 422 Unprocessable Entity before reaching database transactions.

### 4.4 Cross-Origin Resource Sharing (CORS)
- In development, CORS is configured via FastAPI middleware with explicit method declarations (`GET`, `POST`, `PATCH`, `DELETE`). In production, `allow_origins` is restricted to authorized municipal domain origins.

### 4.5 WebSocket Resource Protection
- The `/ws/live` connection manager continuously verifies socket health. Dead connections, hung clients, or disconnected browser tabs are immediately pruned from the active pool, preventing file descriptor leaks and memory denial-of-service.

---

## 5. Data Classification & Integrity Notice

To maintain strict regulatory integrity:
- **Simulated Telemetry Badge**: All generated sensor readings, mock SCADA telemetry, and crisis demonstration data carry the explicit flag:
  ```json
  "is_simulated": true,
  "data_notice": "DEMO / SIMULATED SENSOR TELEMETRY"
  ```
- **Clear Demarcation**: Simulated sensor telemetry is visibly badged on the frontend UI, clearly distinguishing synthetic scenario data from potential live municipal SCADA feeds.
