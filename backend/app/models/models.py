import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), default="admin", nullable=False)  # super_admin, admin, traffic, electricity, water
    department = Column(String(60), default="Municipal Administration")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    maintenance_records = relationship("MaintenanceRecord", back_populates="technician")


class InfrastructureNode(Base):
    __tablename__ = "infrastructure_nodes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(40), index=True, nullable=False)  # traffic, electricity, water, utility
    sector = Column(String(60), index=True, nullable=False)    # Sector 1, Sector 2, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(30), default="normal", nullable=False)  # normal, warning, critical, offline
    capacity = Column(Float, nullable=True)
    capacity_unit = Column(String(30), nullable=True)
    description = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Telemetry & Child relationships
    traffic_readings = relationship("TrafficReading", back_populates="node", cascade="all, delete-orphan")
    electricity_readings = relationship("ElectricityReading", back_populates="node", cascade="all, delete-orphan")
    water_readings = relationship("WaterReading", back_populates="node", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="node")
    anomalies = relationship("Anomaly", back_populates="node")
    maintenance_records = relationship("MaintenanceRecord", back_populates="node")


class TrafficReading(Base):
    __tablename__ = "traffic_readings"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("infrastructure_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    congestion_level = Column(Float, nullable=False)  # 0.0 to 100.0 %
    vehicle_flow = Column(Integer, nullable=False)     # vehicles / hr
    avg_speed_kmh = Column(Float, nullable=False)     # km/h
    road_occupancy_pct = Column(Float, nullable=False) # %
    is_peak_hour = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    simulated = Column(Boolean, default=True)

    node = relationship("InfrastructureNode", back_populates="traffic_readings")


class ElectricityReading(Base):
    __tablename__ = "electricity_readings"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("infrastructure_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    power_demand_mw = Column(Float, nullable=False)    # Megawatts
    grid_load_pct = Column(Float, nullable=False)      # 0.0 to 100.0 %
    voltage_kv = Column(Float, nullable=False)         # Kilovolts
    frequency_hz = Column(Float, default=50.0)         # Hertz
    transformer_temp_c = Column(Float, nullable=False) # Celsius
    is_overloaded = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    simulated = Column(Boolean, default=True)

    node = relationship("InfrastructureNode", back_populates="electricity_readings")


class WaterReading(Base):
    __tablename__ = "water_readings"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("infrastructure_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    water_flow_lps = Column(Float, nullable=False)     # Liters / second
    pressure_psi = Column(Float, nullable=False)       # PSI (normal: 45-65 PSI)
    reservoir_level_pct = Column(Float, nullable=True) # 0-100%
    water_quality_index = Column(Float, default=95.0)  # 0-100
    leak_suspected = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    simulated = Column(Boolean, default=True)

    node = relationship("InfrastructureNode", back_populates="water_readings")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(40), index=True, nullable=False)  # traffic, electricity, water, cross_system
    severity = Column(String(20), index=True, nullable=False)  # critical, high, medium, low
    status = Column(String(30), default="open", index=True, nullable=False)  # open, investigating, assigned, resolved
    description = Column(Text, nullable=False)
    location_name = Column(String(150), nullable=False)
    sector = Column(String(60), nullable=False)
    node_id = Column(Integer, ForeignKey("infrastructure_nodes.id", ondelete="SET NULL"), nullable=True)
    assigned_department = Column(String(40), default="admin", nullable=False)  # super_admin, admin, traffic, electricity, water
    reported_by = Column(String(80), default="System AI", nullable=False)
    investigation_notes = Column(Text, nullable=True)
    resolved_by = Column(String(80), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    node = relationship("InfrastructureNode", back_populates="incidents")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(50), unique=True, index=True, nullable=True)
    event_type = Column(String(100), nullable=False)
    category = Column(String(40), index=True, nullable=False)  # traffic, electricity, water, cross_system
    node_id = Column(Integer, ForeignKey("infrastructure_nodes.id", ondelete="SET NULL"), nullable=True)
    location_name = Column(String(150), nullable=False)
    sector = Column(String(60), nullable=False)
    severity = Column(String(20), nullable=False)  # critical, high, medium, low
    current_value = Column(Float, nullable=False)
    baseline_value = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    detection_method = Column(String(50), default="statistical_zscore")  # statistical_zscore, isolation_forest_ml, physical_threshold
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    resolution_status = Column(String(30), default="detected")  # detected, investigating, mitigated, resolved
    is_acknowledged = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)

    node = relationship("InfrastructureNode", back_populates="anomalies")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(40), index=True, nullable=False)  # traffic, electricity, water, cross_system
    priority = Column(String(20), index=True, nullable=False)  # urgent, high, medium, routine
    sector = Column(String(60), nullable=False)
    what_happened = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    affected_infrastructure = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    status = Column(String(30), default="pending")  # pending, applied, dismissed
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("infrastructure_nodes.id", ondelete="CASCADE"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    department = Column(String(40), nullable=False)
    maintenance_type = Column(String(60), nullable=False)  # Preventive, Emergency, Calibration
    notes = Column(Text, nullable=False)
    cost_estimate = Column(Float, default=0.0)
    scheduled_date = Column(DateTime(timezone=True), default=utcnow)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="scheduled")  # scheduled, in_progress, completed
    created_at = Column(DateTime(timezone=True), default=utcnow)

    node = relationship("InfrastructureNode", back_populates="maintenance_records")
    technician = relationship("User", back_populates="maintenance_records")


class ModelInformation(Base):
    __tablename__ = "model_information"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(120), unique=True, nullable=False)
    model_type = Column(String(60), nullable=False)
    target_variable = Column(String(60), nullable=False)
    dataset_size = Column(Integer, nullable=False)
    train_samples = Column(Integer, nullable=False)
    test_samples = Column(Integer, nullable=False)
    metrics_json = Column(Text, nullable=False)
    features_json = Column(Text, nullable=False)
    status = Column(String(30), default="active")
    last_trained_at = Column(DateTime(timezone=True), default=utcnow)


class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(80), index=True, nullable=False)  # SIMULATION, ALERT, RESOLUTION, AUTH, SYSTEM
    source = Column(String(80), nullable=False)
    severity = Column(String(20), default="info")  # info, warning, error, critical
    message = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
