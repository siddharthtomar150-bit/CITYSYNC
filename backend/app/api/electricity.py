from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.models import InfrastructureNode, ElectricityReading, Incident

router = APIRouter(prefix="/electricity", tags=["Electricity Monitoring"])

@router.get("/summary")
def get_electricity_summary(db: Session = Depends(get_db)):
    """Electricity grid load, substation status, transformer temperatures, and overload alerts."""
    elec_nodes = db.query(InfrastructureNode).filter(InfrastructureNode.category == "electricity").all()
    
    substations = []
    total_mw = 0.0
    total_capacity = 0.0
    overload_count = 0

    for n in elec_nodes:
        latest = db.query(ElectricityReading).filter(ElectricityReading.node_id == n.id).order_by(desc(ElectricityReading.timestamp)).first()
        mw = latest.power_demand_mw if latest else 65.0
        grid_load = latest.grid_load_pct if latest else 65.0
        temp = latest.transformer_temp_c if latest else 52.0
        cap = n.capacity or 100.0
        
        total_mw += mw
        total_capacity += cap
        if grid_load >= 90.0 or (latest and latest.is_overloaded):
            overload_count += 1

        substations.append({
            "node_id": n.id,
            "name": n.name,
            "sector": n.sector,
            "capacity_mw": cap,
            "current_demand_mw": mw,
            "grid_load_pct": grid_load,
            "transformer_temp_c": temp,
            "frequency_hz": latest.frequency_hz if latest else 50.0,
            "status": n.status,
            "is_overloaded": grid_load >= 90.0
        })

    overall_load = round((total_mw / max(1.0, total_capacity)) * 100, 1)

    return {
        "grid_status": "CRITICAL OVERLOAD" if overload_count > 0 else ("High Demand" if overall_load > 80 else "Stable"),
        "total_power_demand_mw": round(total_mw, 1),
        "total_grid_capacity_mw": round(total_capacity, 1),
        "overall_grid_load_pct": overall_load,
        "active_overload_count": overload_count,
        "substations": substations,
        "grid_frequency_hz": 50.02,
        "predicted_peak_window": "14:00 - 16:30 (HVAC & Industrial Concurrence)"
    }

@router.get("/trends")
def get_electricity_trends(db: Session = Depends(get_db)):
    """Historical power demand readings for Chart.js."""
    readings = db.query(ElectricityReading).order_by(desc(ElectricityReading.timestamp)).limit(60).all()
    readings = list(reversed(readings))

    labels = [r.timestamp.strftime("%H:%M:%S") for r in readings[::3]]
    power_demand = [round(r.power_demand_mw, 1) for r in readings[::3]]
    grid_loads = [round(r.grid_load_pct, 1) for r in readings[::3]]
    temps = [round(r.transformer_temp_c, 1) for r in readings[::3]]

    return {
        "labels": labels,
        "power_demands": power_demand,
        "grid_loads": grid_loads,
        "temperatures": temps
    }
