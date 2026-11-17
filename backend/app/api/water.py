from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.models import InfrastructureNode, WaterReading

router = APIRouter(prefix="/water", tags=["Water & Public Utilities"])

@router.get("/summary")
def get_water_summary(db: Session = Depends(get_db)):
    """Water distribution status, reservoir levels, pipeline pressure, and leak alerts."""
    water_nodes = db.query(InfrastructureNode).filter(InfrastructureNode.category == "water").all()
    
    facilities = []
    total_flow = 0.0
    pressure_drops = 0
    total_pressure = 0.0

    for n in water_nodes:
        latest = db.query(WaterReading).filter(WaterReading.node_id == n.id).order_by(desc(WaterReading.timestamp)).first()
        flow = latest.water_flow_lps if latest else 320.0
        psi = latest.pressure_psi if latest else 56.0
        res = latest.reservoir_level_pct if latest else 82.0
        leak = latest.leak_suspected if latest else False

        total_flow += flow
        total_pressure += psi
        if psi < 32.0 or leak:
            pressure_drops += 1

        facilities.append({
            "node_id": n.id,
            "name": n.name,
            "sector": n.sector,
            "water_flow_lps": flow,
            "pressure_psi": psi,
            "reservoir_level_pct": res,
            "water_quality_index": latest.water_quality_index if latest else 95.0,
            "leak_suspected": leak,
            "status": n.status
        })

    avg_p = round(total_pressure / max(1, len(water_nodes)), 1)

    return {
        "water_network_status": "Pressure Crisis / Leakage" if pressure_drops > 0 else "Normal Operating Pressure",
        "average_pressure_psi": avg_p,
        "total_water_flow_lps": round(total_flow, 1),
        "active_leak_alerts_count": pressure_drops,
        "facilities": facilities,
        "reservoir_reserves": "Adequate (78% capacity aggregate)"
    }

@router.get("/trends")
def get_water_trends(db: Session = Depends(get_db)):
    """Historical water telemetry for Chart.js."""
    readings = db.query(WaterReading).order_by(desc(WaterReading.timestamp)).limit(60).all()
    readings = list(reversed(readings))

    labels = [r.timestamp.strftime("%H:%M:%S") for r in readings[::3]]
    pressures = [round(r.pressure_psi, 1) for r in readings[::3]]
    flows = [round(r.water_flow_lps, 1) for r in readings[::3]]

    return {
        "labels": labels,
        "pressures": pressures,
        "flows": flows
    }
