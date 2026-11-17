from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.models.models import (
    InfrastructureNode,
    TrafficReading,
    ElectricityReading,
    WaterReading,
    Incident
)

router = APIRouter(prefix="/map", tags=["Live Map & Digital Twin"])

@router.get("/nodes")
def get_map_nodes(
    category: Optional[str] = Query(None, description="Filter by category (traffic, electricity, water, utility)"),
    status: Optional[str] = Query(None, description="Filter by status (normal, warning, critical, offline)"),
    db: Session = Depends(get_db)
):
    query = db.query(InfrastructureNode)
    if category and category != "all":
        query = query.filter(InfrastructureNode.category == category)
    if status and status != "all":
        query = query.filter(InfrastructureNode.status == status)

    nodes = query.all()
    results = []

    for n in nodes:
        latest = None
        if n.category == "traffic":
            tr = db.query(TrafficReading).filter(TrafficReading.node_id == n.id).order_by(TrafficReading.timestamp.desc()).first()
            if tr:
                latest = {
                    "congestion_level": tr.congestion_level,
                    "avg_speed_kmh": tr.avg_speed_kmh,
                    "vehicle_flow": tr.vehicle_flow,
                    "timestamp": tr.timestamp.isoformat()
                }
        elif n.category == "electricity":
            er = db.query(ElectricityReading).filter(ElectricityReading.node_id == n.id).order_by(ElectricityReading.timestamp.desc()).first()
            if er:
                latest = {
                    "power_demand_mw": er.power_demand_mw,
                    "grid_load_pct": er.grid_load_pct,
                    "transformer_temp_c": er.transformer_temp_c,
                    "timestamp": er.timestamp.isoformat()
                }
        elif n.category == "water":
            wr = db.query(WaterReading).filter(WaterReading.node_id == n.id).order_by(WaterReading.timestamp.desc()).first()
            if wr:
                latest = {
                    "water_flow_lps": wr.water_flow_lps,
                    "pressure_psi": wr.pressure_psi,
                    "reservoir_level_pct": wr.reservoir_level_pct,
                    "timestamp": wr.timestamp.isoformat()
                }

        results.append({
            "id": n.id,
            "name": n.name,
            "code": n.code,
            "category": n.category,
            "sector": n.sector,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "status": n.status,
            "capacity": n.capacity,
            "capacity_unit": n.capacity_unit,
            "description": n.description,
            "is_simulated": True,
            "data_notice": "DEMO / SIMULATED SENSOR TELEMETRY",
            "latest_reading": latest
        })

    return results

@router.get("/incidents")
def get_map_incidents(db: Session = Depends(get_db)):
    """Retrieve active incidents for map overlay."""
    incidents = db.query(Incident).filter(Incident.status != "resolved").all()
    results = []
    for inc in incidents:
        node = inc.node
        lat = node.latitude if node else 28.6139
        lng = node.longitude if node else 77.2090
        results.append({
            "id": inc.id,
            "incident_number": inc.incident_number,
            "title": inc.title,
            "category": inc.category,
            "severity": inc.severity,
            "status": inc.status,
            "description": inc.description,
            "location_name": inc.location_name,
            "sector": inc.sector,
            "latitude": lat,
            "longitude": lng,
            "assigned_department": inc.assigned_department,
            "created_at": inc.created_at.isoformat()
        })
    return results

@router.get("/search")
def search_digital_twin(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Global search across infrastructure nodes, locations, and incidents."""
    term = f"%{q}%"
    nodes = db.query(InfrastructureNode).filter(
        (InfrastructureNode.name.ilike(term)) |
        (InfrastructureNode.code.ilike(term)) |
        (InfrastructureNode.sector.ilike(term))
    ).limit(10).all()

    incidents = db.query(Incident).filter(
        (Incident.title.ilike(term)) |
        (Incident.incident_number.ilike(term)) |
        (Incident.location_name.ilike(term))
    ).limit(10).all()

    return {
        "nodes": [{"id": n.id, "name": n.name, "code": n.code, "sector": n.sector, "lat": n.latitude, "lng": n.longitude, "category": n.category} for n in nodes],
        "incidents": [{"id": i.id, "number": i.incident_number, "title": i.title, "severity": i.severity, "status": i.status} for i in incidents]
    }

@router.get("/facilities/{node_id}/inspector")
def get_facility_inspector(node_id: int, db: Session = Depends(get_db)):
    """Inspect facility telemetry gauges, history, and active incident records."""
    node = db.query(InfrastructureNode).filter(InfrastructureNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Facility node not found")

    telemetry_history = []
    if node.category == "traffic":
        readings = db.query(TrafficReading).filter(TrafficReading.node_id == node_id).order_by(desc(TrafficReading.timestamp)).limit(20).all()
        telemetry_history = [{"time": r.timestamp.strftime("%H:%M"), "value": r.congestion_level, "metric": "Congestion %"} for r in reversed(readings)]
    elif node.category == "electricity":
        readings = db.query(ElectricityReading).filter(ElectricityReading.node_id == node_id).order_by(desc(ElectricityReading.timestamp)).limit(20).all()
        telemetry_history = [{"time": r.timestamp.strftime("%H:%M"), "value": r.power_demand_mw, "metric": "Power Demand MW"} for r in reversed(readings)]
    elif node.category == "water":
        readings = db.query(WaterReading).filter(WaterReading.node_id == node_id).order_by(desc(WaterReading.timestamp)).limit(20).all()
        telemetry_history = [{"time": r.timestamp.strftime("%H:%M"), "value": r.pressure_psi, "metric": "Pressure PSI"} for r in reversed(readings)]

    incidents = db.query(Incident).filter(Incident.node_id == node_id).order_by(desc(Incident.created_at)).limit(5).all()

    return {
        "id": node.id,
        "name": node.name,
        "code": node.code,
        "category": node.category,
        "sector": node.sector,
        "status": node.status,
        "capacity": node.capacity,
        "capacity_unit": node.capacity_unit,
        "description": node.description,
        "telemetry_history": telemetry_history,
        "recent_incidents": [{"id": i.id, "number": i.incident_number, "title": i.title, "severity": i.severity, "status": i.status, "date": i.created_at.strftime("%Y-%m-%d %H:%M")} for i in incidents]
    }
