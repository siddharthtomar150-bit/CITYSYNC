# CITYSYNC – Database Entity-Relationship (ER) Documentation

## 1. Database Model & Schema Design

CITYSYNC utilizes a relational database architecture managed through **SQLAlchemy 2.0 ORM**. While configured by default for SQLite for local zero-configuration development, the data types, foreign key constraints, and relational indexes are structured for instant deployment to PostgreSQL in high-throughput production environments.

---

## 2. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ MAINTENANCE_RECORDS : performs
    INFRASTRUCTURE_NODES ||--o{ TRAFFIC_READINGS : emits
    INFRASTRUCTURE_NODES ||--o{ ELECTRICITY_READINGS : emits
    INFRASTRUCTURE_NODES ||--o{ WATER_READINGS : emits
    INFRASTRUCTURE_NODES ||--o{ INCIDENTS : relates_to
    INFRASTRUCTURE_NODES ||--o{ ANOMALIES : triggers
    INFRASTRUCTURE_NODES ||--o{ MAINTENANCE_RECORDS : receives

    USERS {
        int id PK
        string email UK
        string username UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    INFRASTRUCTURE_NODES {
        int id PK
        string name
        string code UK
        string category
        string sector
        float latitude
        float longitude
        string status
        float capacity
        string capacity_unit
        text description
        boolean is_simulated
        datetime created_at
        datetime updated_at
    }

    TRAFFIC_READINGS {
        int id PK
        int node_id FK
        float congestion_level
        int vehicle_flow
        float avg_speed_kmh
        float road_occupancy_pct
        boolean is_peak_hour
        datetime timestamp
        boolean simulated
    }

    ELECTRICITY_READINGS {
        int id PK
        int node_id FK
        float power_demand_mw
        float grid_load_pct
        float voltage_kv
        float frequency_hz
        float transformer_temp_c
        boolean is_overloaded
        datetime timestamp
        boolean simulated
    }

    WATER_READINGS {
        int id PK
        int node_id FK
        float water_flow_lps
        float pressure_psi
        float reservoir_level_pct
        float water_quality_index
        boolean leak_suspected
        datetime timestamp
        boolean simulated
    }

    INCIDENTS {
        int id PK
        string incident_number UK
        string title
        string category
        string severity
        string status
        text description
        string location_name
        string sector
        int node_id FK
        string assigned_department
        string reported_by
        string resolved_by
        text resolution_notes
        datetime created_at
        datetime updated_at
        datetime resolved_at
    }

    ANOMALIES {
        int id PK
        string event_type
        string category
        int node_id FK
        string location_name
        string sector
        string severity
        float current_value
        float baseline_value
        float deviation_pct
        text explanation
        text recommended_action
        boolean is_acknowledged
        datetime timestamp
    }

    RECOMMENDATIONS {
        int id PK
        string title
        string category
        string priority
        string sector
        text what_happened
        text why_it_matters
        text affected_infrastructure
        text suggested_action
        string status
        datetime created_at
        datetime applied_at
    }

    MAINTENANCE_RECORDS {
        int id PK
        int node_id FK
        int technician_id FK
        string department
        string maintenance_type
        text notes
        float cost_estimate
        datetime scheduled_date
        datetime completed_date
        string status
        datetime created_at
    }

    SYSTEM_EVENTS {
        int id PK
        string event_type
        string source
        string severity
        text message
        text details_json
        datetime created_at
    }
```

---

## 3. Key Relationships & Integrity Constraints

1. **Infrastructure Telemetry Cascade**: `TrafficReading`, `ElectricityReading`, and `WaterReading` enforce `CASCADE ON DELETE` against `infrastructure_nodes.id`.
2. **Incident Tracking**: `Incident` models link optionally to `infrastructure_nodes.id` with `SET NULL ON DELETE` so historical municipal incidents are retained even if an asset is decommissioned.
3. **Database Indexes**: Indexed on `node_id`, `timestamp`, `category`, `status`, and `severity` to guarantee sub-millisecond query latency for live dashboards and time-series charts.
