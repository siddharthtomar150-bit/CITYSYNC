from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth & User Schemas ---
class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    role: str = "admin"  # super_admin, admin, traffic, electricity, water
    department: Optional[str] = "Municipal Administration"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    full_name: str
    role: str
    department: Optional[str] = None
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None

# --- Infrastructure Schemas ---
class InfrastructureNodeOut(BaseModel):
    id: int
    name: str
    code: str
    category: str
    sector: str
    latitude: float
    longitude: float
    status: str
    capacity: Optional[float] = None
    capacity_unit: Optional[str] = None
    description: Optional[str] = None
    is_simulated: bool
    latest_reading: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

# --- Telemetry Schemas ---
class TrafficReadingOut(BaseModel):
    id: int
    node_id: int
    congestion_level: float
    vehicle_flow: int
    avg_speed_kmh: float
    road_occupancy_pct: float
    is_peak_hour: bool
    timestamp: datetime
    simulated: bool

    model_config = ConfigDict(from_attributes=True)

class ElectricityReadingOut(BaseModel):
    id: int
    node_id: int
    power_demand_mw: float
    grid_load_pct: float
    voltage_kv: float
    frequency_hz: float
    transformer_temp_c: float
    is_overloaded: bool
    timestamp: datetime
    simulated: bool

    model_config = ConfigDict(from_attributes=True)

class WaterReadingOut(BaseModel):
    id: int
    node_id: int
    water_flow_lps: float
    pressure_psi: float
    reservoir_level_pct: Optional[float] = None
    water_quality_index: float
    leak_suspected: bool
    timestamp: datetime
    simulated: bool

    model_config = ConfigDict(from_attributes=True)

# --- Incident Schemas ---
class IncidentBase(BaseModel):
    title: str
    category: str
    severity: str
    description: str
    location_name: str
    sector: str
    node_id: Optional[int] = None
    assigned_department: str = "admin"

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None  # open, investigating, assigned, resolved
    assigned_department: Optional[str] = None
    investigation_notes: Optional[str] = None
    resolution_notes: Optional[str] = None

class IncidentOut(BaseModel):
    id: int
    incident_number: str
    title: str
    category: str
    severity: str
    status: str
    description: str
    location_name: str
    sector: str
    node_id: Optional[int] = None
    assigned_department: str
    reported_by: str
    investigation_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Anomaly Schemas ---
class AnomalyUpdate(BaseModel):
    resolution_status: Optional[str] = None  # detected, investigating, mitigated, resolved
    is_acknowledged: Optional[bool] = None

class AnomalyOut(BaseModel):
    id: int
    unique_id: Optional[str] = None
    event_type: str
    category: str
    node_id: Optional[int] = None
    location_name: str
    sector: str
    severity: str
    current_value: float
    baseline_value: float
    deviation_pct: float
    detection_method: str
    explanation: str
    recommended_action: str
    resolution_status: str
    is_acknowledged: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Recommendation Schemas ---
class RecommendationOut(BaseModel):
    id: int
    title: str
    category: str
    priority: str
    sector: str
    what_happened: str
    why_it_matters: str
    affected_infrastructure: str
    suggested_action: str
    status: str
    created_at: datetime
    applied_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RecommendationAction(BaseModel):
    status: str  # applied, dismissed

# --- Maintenance Schemas ---
class MaintenanceCreate(BaseModel):
    node_id: int
    department: str
    maintenance_type: str
    notes: str
    cost_estimate: float = 0.0

class MaintenanceOut(BaseModel):
    id: int
    node_id: int
    department: str
    maintenance_type: str
    notes: str
    cost_estimate: float
    status: str
    scheduled_date: datetime
    completed_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- ML & Model Information Schemas ---
class ModelInformationOut(BaseModel):
    id: int
    model_name: str
    model_type: str
    target_variable: str
    dataset_size: int
    train_samples: int
    test_samples: int
    metrics_json: str
    features_json: str
    status: str
    last_trained_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & Cross-System Schemas ---
class KPICard(BaseModel):
    label: str
    value: str
    numeric_value: float
    unit: str
    previous_period_comparison: str
    trend_direction: str
    status: str
    trend_sparkline: List[float]

class DashboardKPIs(BaseModel):
    traffic_congestion: KPICard
    electricity_consumption: KPICard
    water_supply_status: KPICard
    active_incidents: KPICard
    infrastructure_health_score: KPICard
    predicted_disruptions: KPICard
