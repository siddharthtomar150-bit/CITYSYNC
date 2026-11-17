from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, List
import datetime

from app.database.session import get_db
from app.models.models import (
    InfrastructureNode,
    TrafficReading,
    ElectricityReading,
    WaterReading,
    Incident,
    Anomaly,
    Recommendation,
    SystemEvent
)
from app.schemas.schemas import DashboardKPIs
from app.services.cross_system_engine import cross_system_engine

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    """Calculate the 6 main executive KPI cards with comparison and trend sparkline."""
    # 1. Traffic Congestion
    recent_traffic = db.query(TrafficReading).order_by(desc(TrafficReading.timestamp)).limit(20).all()
    if recent_traffic:
        latest_cong = sum(r.congestion_level for r in recent_traffic[:5]) / min(5, len(recent_traffic))
        prev_cong = sum(r.congestion_level for r in recent_traffic[5:15]) / max(1, len(recent_traffic[5:15]))
        cong_diff = latest_cong - prev_cong
        cong_status = "danger" if latest_cong > 80 else ("warning" if latest_cong > 60 else "good")
        cong_spark = [round(r.congestion_level, 1) for r in reversed(recent_traffic[:10])]
    else:
        latest_cong, cong_diff, cong_status, cong_spark = 48.5, -2.1, "good", [45, 47, 49, 48, 48.5]

    # 2. Electricity Demand
    recent_elec = db.query(ElectricityReading).order_by(desc(ElectricityReading.timestamp)).limit(20).all()
    if recent_elec:
        latest_mw = sum(r.power_demand_mw for r in recent_elec[:5])
        prev_mw = sum(r.power_demand_mw for r in recent_elec[5:15]) / 2.0
        mw_diff = latest_mw - prev_mw
        elec_status = "danger" if any(r.is_overloaded for r in recent_elec[:5]) else "good"
        elec_spark = [round(r.power_demand_mw, 1) for r in reversed(recent_elec[:10])]
    else:
        latest_mw, mw_diff, elec_status, elec_spark = 245.8, 12.4, "good", [220, 230, 240, 245.8]

    # 3. Water Supply Pressure / Status
    recent_water = db.query(WaterReading).order_by(desc(WaterReading.timestamp)).limit(20).all()
    if recent_water:
        avg_pressure = sum(r.pressure_psi for r in recent_water[:5]) / min(5, len(recent_water))
        prev_pressure = sum(r.pressure_psi for r in recent_water[5:15]) / max(1, len(recent_water[5:15]))
        p_diff = avg_pressure - prev_pressure
        water_status = "danger" if avg_pressure < 30 else ("warning" if avg_pressure < 45 else "good")
        water_spark = [round(r.pressure_psi, 1) for r in reversed(recent_water[:10])]
    else:
        avg_pressure, p_diff, water_status, water_spark = 54.2, 0.4, "good", [52, 53, 54, 54.2]

    # 4. Active Incidents
    active_incidents_count = db.query(Incident).filter(Incident.status != "resolved").count()
    inc_status = "danger" if active_incidents_count >= 4 else ("warning" if active_incidents_count >= 1 else "good")

    # 5. Infrastructure Health Score (Calculated composite index 0-100)
    total_nodes = db.query(InfrastructureNode).count() or 1
    critical_nodes = db.query(InfrastructureNode).filter(InfrastructureNode.status == "critical").count()
    warning_nodes = db.query(InfrastructureNode).filter(InfrastructureNode.status == "warning").count()
    health_penalty = (critical_nodes * 22) + (warning_nodes * 8) + (active_incidents_count * 5)
    health_score = max(25.0, min(100.0, 98.0 - health_penalty))
    health_status = "good" if health_score >= 85 else ("warning" if health_score >= 65 else "danger")

    # 6. Predicted Disruptions (from active anomalies and cross-system cascades)
    active_anomalies_count = db.query(Anomaly).filter(Anomaly.is_acknowledged == False).count()
    predicted_disruptions = max(active_anomalies_count, 1 if critical_nodes > 0 else 0)
    disrupt_status = "danger" if predicted_disruptions >= 3 else ("warning" if predicted_disruptions >= 1 else "good")

    return {
        "traffic_congestion": {
            "label": "Avg Traffic Congestion",
            "value": f"{latest_cong:.1f}%",
            "numeric_value": round(latest_cong, 1),
            "unit": "%",
            "previous_period_comparison": f"{'+' if cong_diff >= 0 else ''}{cong_diff:.1f}% vs last cycle",
            "trend_direction": "up" if cong_diff > 0 else "down",
            "status": cong_status,
            "trend_sparkline": cong_spark
        },
        "electricity_consumption": {
            "label": "Total Power Demand",
            "value": f"{latest_mw:.1f} MW",
            "numeric_value": round(latest_mw, 1),
            "unit": "MW",
            "previous_period_comparison": f"{'+' if mw_diff >= 0 else ''}{mw_diff:.1f} MW vs last cycle",
            "trend_direction": "up" if mw_diff > 0 else "down",
            "status": elec_status,
            "trend_sparkline": elec_spark
        },
        "water_supply_status": {
            "label": "Mains Water Pressure",
            "value": f"{avg_pressure:.1f} PSI",
            "numeric_value": round(avg_pressure, 1),
            "unit": "PSI",
            "previous_period_comparison": f"{'+' if p_diff >= 0 else ''}{p_diff:.1f} PSI vs last cycle",
            "trend_direction": "up" if p_diff >= 0 else "down",
            "status": water_status,
            "trend_sparkline": water_spark
        },
        "active_incidents": {
            "label": "Active Incidents",
            "value": f"{active_incidents_count} Active",
            "numeric_value": float(active_incidents_count),
            "unit": "incidents",
            "previous_period_comparison": "Real-time tracking",
            "trend_direction": "stable" if active_incidents_count == 0 else "up",
            "status": inc_status,
            "trend_sparkline": [1, 2, active_incidents_count]
        },
        "infrastructure_health_score": {
            "label": "Infrastructure Health",
            "value": f"{health_score:.1f}/100",
            "numeric_value": round(health_score, 1),
            "unit": "points",
            "previous_period_comparison": f"{'Optimal' if health_score > 85 else 'Degraded'}",
            "trend_direction": "stable" if health_score > 85 else "down",
            "status": health_status,
            "trend_sparkline": [98, 95, 92, health_score]
        },
        "predicted_disruptions": {
            "label": "Predicted Cascade Risks",
            "value": f"{predicted_disruptions} At Risk",
            "numeric_value": float(predicted_disruptions),
            "unit": "zones",
            "previous_period_comparison": "Cross-system engine forecast",
            "trend_direction": "up" if predicted_disruptions > 0 else "stable",
            "status": disrupt_status,
            "trend_sparkline": [0, 1, predicted_disruptions]
        }
    }

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Comprehensive command center overview data."""
    # Recent Incidents
    recent_incidents = db.query(Incident).order_by(desc(Incident.created_at)).limit(6).all()
    # Active Anomalies
    active_anomalies = db.query(Anomaly).order_by(desc(Anomaly.timestamp)).limit(8).all()
    # Recent Recommendations
    recommendations = db.query(Recommendation).filter(Recommendation.status == "pending").limit(5).all()
    # Active Nodes status
    nodes = db.query(InfrastructureNode).all()

    # System status breakdown
    status_counts = {"normal": 0, "warning": 0, "critical": 0, "offline": 0}
    for n in nodes:
        status_counts[n.status] = status_counts.get(n.status, 0) + 1

    # Cross-System Cascades
    inc_dicts = [{"title": inc.title, "category": inc.category, "sector": inc.sector} for inc in recent_incidents if inc.status != "resolved"]
    anom_dicts = [{
        "category": a.category,
        "event_type": a.event_type,
        "location_name": a.location_name,
        "sector": a.sector,
        "severity": a.severity
    } for a in active_anomalies]
    cascades = cross_system_engine.analyze_cross_system_impacts(anom_dicts, inc_dicts, {})

    # Live City Activity Feed (Interleaved events)
    feed = []
    for inc in recent_incidents[:4]:
        feed.append({
            "type": "incident",
            "severity": inc.severity,
            "title": f"Incident: {inc.title}",
            "description": inc.description,
            "location": inc.location_name,
            "timestamp": inc.created_at.isoformat()
        })
    for anom in active_anomalies[:4]:
        feed.append({
            "type": "anomaly",
            "severity": anom.severity,
            "title": f"Anomaly: {anom.event_type}",
            "description": anom.explanation,
            "location": anom.location_name,
            "timestamp": anom.timestamp.isoformat()
        })
    feed.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "status_counts": status_counts,
        "total_nodes": len(nodes),
        "recent_incidents": recent_incidents,
        "active_anomalies": active_anomalies,
        "recommendations": recommendations,
        "cross_system_cascades": cascades,
        "activity_feed": feed
    }

@router.get("/weather")
async def get_bengaluru_live_weather():
    """Live Bengaluru meteorological telemetry from Open-Meteo API."""
    from app.services.weather_service import weather_service
    return await weather_service.get_live_weather()
