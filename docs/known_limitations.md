# CITYSYNC – Known Limitations & Architectural Boundaries

## 1. Scope & Design Context

CITYSYNC was engineered as a high-fidelity, production-style hackathon platform that balances real, verifiable engineering with rapid deployability. To ensure maximum stability and zero external infrastructure dependencies, certain deliberate design trade-offs were made.

---

## 2. Technical Limitations

### 2.1 Single-Process WebSocket Connection Manager
- **Current State**: WebSockets are coordinated in-memory within the active FastAPI process via `backend/app/websocket/connection_manager.py`.
- **Limitation**: If scaled horizontally across multiple ASGI worker processes (e.g. `gunicorn -w 4`) or Kubernetes pods, clients connected to Worker A will not receive broadcast events generated on Worker B.
- **Production Solution**: Integrate a Redis Pub/Sub backplane (or RabbitMQ / Kafka) to distribute telemetry events across arbitrary numbers of worker instances.

### 2.2 Database Concurrency & File-Locking (SQLite Local Mode)
- **Current State**: The local development mode uses SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and foreign keys enabled.
- **Limitation**: While WAL mode allows concurrent reads, concurrent writes are serialized at the file lock level. Sustained write loads exceeding 1,000 writes/second will encounter database lock contention.
- **Production Solution**: Switch the `DATABASE_URL` in `.env` to PostgreSQL. All SQLAlchemy models, relationships, and queries are 100% PostgreSQL-ready with zero code modifications needed.

### 2.3 Simulated vs. Industrial SCADA Protocols
- **Current State**: The platform utilizes a deterministic, physics-grounded background simulation engine running at 4-second intervals to generate telemetry for 16 infrastructure nodes.
- **Limitation**: The system does not directly ingest legacy industrial automation protocols such as DNP3, Modbus TCP, OPC-UA, or IEC 60870-5-104 without an edge protocol gateway.
- **Production Solution**: Deploy an IoT Edge Ingestion Bridge that normalizes Modbus/DNP3 telemetry into JSON messages delivered to CITYSYNC over MQTT or secure REST webhooks.

### 2.4 ML Model Compute Architecture
- **Current State**: The Random Forest Regressors and Isolation Forest models are implemented in pure Python with zero native C/C++ DLL dependencies to ensure flawless, sandboxed cross-platform execution (avoiding Windows WDAC and platform DLL blocks).
- **Limitation**: While inference takes less than 1 millisecond per request, batch retraining over datasets exceeding 1,000,000 records would benefit from compiled vectorized execution or GPU acceleration (e.g. ONNX Runtime or RAPIDS cuML).
- **Production Solution**: In high-throughput industrial deployments, export models to ONNX format or serve via Triton Inference Server.

### 2.5 Geographical Scope
- **Current State**: The City Digital Twin is mapped to a metropolitan urban grid across 5 defined municipal sectors.
- **Limitation**: The system currently models a single unified urban municipality rather than multi-tenant cross-county federations.
- **Production Solution**: Introduce tenant-partitioned database schemas for regional inter-city governance.
