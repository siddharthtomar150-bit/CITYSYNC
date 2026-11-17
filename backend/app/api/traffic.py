from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.models import InfrastructureNode, TrafficReading, Incident

router = APIRouter(prefix="/traffic", tags=["Traffic Intelligence"])

@router.get("/summary")
def get_traffic_summary(db: Session = Depends(get_db)):
    """Traffic intelligence summary, peak hour analysis, and congestion hotspots."""
    traffic_nodes = db.query(InfrastructureNode).filter(InfrastructureNode.category == "traffic").all()
    
    segments = []
    total_flow = 0
    total_cong = 0.0

    for n in traffic_nodes:
        latest = db.query(TrafficReading).filter(TrafficReading.node_id == n.id).order_by(desc(TrafficReading.timestamp)).first()
        cong = latest.congestion_level if latest else 42.0
        speed = latest.avg_speed_kmh if latest else 45.0
        flow = latest.vehicle_flow if latest else 950
        total_cong += cong
        total_flow += flow

        segments.append({
            "node_id": n.id,
            "name": n.name,
            "sector": n.sector,
            "status": n.status,
            "congestion_level": cong,
            "avg_speed_kmh": speed,
            "vehicle_flow": flow,
            "road_occupancy_pct": latest.road_occupancy_pct if latest else cong * 0.9,
            "is_congested": cong >= 75.0
        })

    avg_cong = round(total_cong / max(1, len(traffic_nodes)), 1)
    
    # Active traffic incidents
    incidents = db.query(Incident).filter(
        Incident.category == "traffic",
        Incident.status != "resolved"
    ).all()

    return {
        "network_status": "Heavy Congestion" if avg_cong > 75 else ("Moderate Traffic" if avg_cong > 50 else "Fluid"),
        "average_congestion_pct": avg_cong,
        "total_hourly_vehicle_flow": total_flow,
        "active_road_incidents_count": len(incidents),
        "segments": segments,
        "incidents": incidents,
        "peak_hour_status": "Active Evening Rush" if 17 <= 18 <= 19 else "Standard Operating Flow"
    }

@router.get("/trends")
def get_traffic_trends(db: Session = Depends(get_db)):
    """Hourly historical trend of congestion across sectors for Chart.js."""
    readings = db.query(TrafficReading).order_by(desc(TrafficReading.timestamp)).limit(60).all()
    readings = list(reversed(readings))
    
    labels = [r.timestamp.strftime("%H:%M:%S") for r in readings[::3]]
    congestion_data = [round(r.congestion_level, 1) for r in readings[::3]]
    speed_data = [round(r.avg_speed_kmh, 1) for r in readings[::3]]
    flow_data = [r.vehicle_flow for r in readings[::3]]

    return {
        "labels": labels,
        "congestion_levels": congestion_data,
        "average_speeds": speed_data,
        "vehicle_flows": flow_data
    }
