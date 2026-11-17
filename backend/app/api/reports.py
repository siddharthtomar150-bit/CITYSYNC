import io
import csv
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.models import (
    InfrastructureNode,
    TrafficReading,
    ElectricityReading,
    WaterReading,
    Incident,
    Anomaly
)

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/daily-summary")
def get_daily_summary_report(db: Session = Depends(get_db)):
    """Executive structured municipal report summary."""
    total_nodes = db.query(InfrastructureNode).count()
    incidents_count = db.query(Incident).count()
    open_incidents = db.query(Incident).filter(Incident.status != "resolved").count()
    anomalies_count = db.query(Anomaly).count()
    critical_anomalies = db.query(Anomaly).filter(Anomaly.severity == "critical").count()

    traffic_avg = db.query(TrafficReading).order_by(desc(TrafficReading.timestamp)).limit(10).all()
    avg_cong = sum(r.congestion_level for r in traffic_avg) / max(1, len(traffic_avg))

    elec_avg = db.query(ElectricityReading).order_by(desc(ElectricityReading.timestamp)).limit(10).all()
    avg_mw = sum(r.power_demand_mw for r in elec_avg) / max(1, len(elec_avg))

    water_avg = db.query(WaterReading).order_by(desc(WaterReading.timestamp)).limit(10).all()
    avg_psi = sum(r.pressure_psi for r in water_avg) / max(1, len(water_avg))

    return {
        "report_title": "CITYSYNC Executive Daily Infrastructure Intelligence Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_monitored_assets": total_nodes,
        "key_metrics": {
            "average_traffic_congestion_pct": round(avg_cong, 1),
            "average_power_demand_mw": round(avg_mw, 1),
            "average_water_pressure_psi": round(avg_psi, 1),
            "active_incidents_count": open_incidents,
            "total_incidents_recorded": incidents_count,
            "anomalies_detected_today": anomalies_count,
            "critical_anomalies": critical_anomalies
        },
        "executive_verdict": (
            "Cross-System synchronization active. "
            f"Currently monitoring {total_nodes} nodes across 5 sectors. "
            f"{open_incidents} active incidents under operational management."
        )
    }

@router.get("/export-csv")
def export_csv_report(
    dataset_type: str = Query("incidents", description="Dataset to export (incidents, anomalies, traffic, electricity, water, predictions)"),
    db: Session = Depends(get_db)
):
    """Generate and stream downloadable CSV report data for all municipal domains."""
    output = io.StringIO()
    writer = None

    if dataset_type == "incidents":
        records = db.query(Incident).order_by(desc(Incident.created_at)).all()
        fieldnames = ["incident_number", "title", "category", "severity", "status", "location_name", "sector", "assigned_department", "investigation_notes", "created_at"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "incident_number": r.incident_number,
                "title": r.title,
                "category": r.category,
                "severity": r.severity,
                "status": r.status,
                "location_name": r.location_name,
                "sector": r.sector,
                "assigned_department": r.assigned_department,
                "investigation_notes": r.investigation_notes or "",
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else ""
            })

    elif dataset_type == "anomalies":
        records = db.query(Anomaly).order_by(desc(Anomaly.timestamp)).all()
        fieldnames = ["event_type", "category", "location_name", "sector", "severity", "current_value", "baseline_value", "deviation_pct", "detection_method", "resolution_status", "timestamp"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "event_type": r.event_type,
                "category": r.category,
                "location_name": r.location_name,
                "sector": r.sector,
                "severity": r.severity,
                "current_value": r.current_value,
                "baseline_value": r.baseline_value,
                "deviation_pct": r.deviation_pct,
                "detection_method": r.detection_method or "statistical_zscore",
                "resolution_status": r.resolution_status or "detected",
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S") if r.timestamp else ""
            })

    elif dataset_type == "traffic":
        records = db.query(TrafficReading).order_by(desc(TrafficReading.timestamp)).limit(300).all()
        fieldnames = ["node_id", "congestion_level", "vehicle_flow", "avg_speed_kmh", "road_occupancy_pct", "timestamp"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "node_id": r.node_id,
                "congestion_level": r.congestion_level,
                "vehicle_flow": r.vehicle_flow,
                "avg_speed_kmh": r.avg_speed_kmh,
                "road_occupancy_pct": r.road_occupancy_pct,
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S") if r.timestamp else ""
            })

    elif dataset_type == "electricity":
        records = db.query(ElectricityReading).order_by(desc(ElectricityReading.timestamp)).limit(300).all()
        fieldnames = ["node_id", "power_demand_mw", "grid_load_pct", "voltage_kv", "frequency_hz", "transformer_temp_c", "timestamp"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "node_id": r.node_id,
                "power_demand_mw": r.power_demand_mw,
                "grid_load_pct": r.grid_load_pct,
                "voltage_kv": r.voltage_kv,
                "frequency_hz": r.frequency_hz,
                "transformer_temp_c": r.transformer_temp_c,
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S") if r.timestamp else ""
            })

    elif dataset_type == "water":
        records = db.query(WaterReading).order_by(desc(WaterReading.timestamp)).limit(300).all()
        fieldnames = ["node_id", "water_flow_lps", "pressure_psi", "reservoir_level_pct", "water_quality_index", "leak_suspected", "timestamp"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "node_id": r.node_id,
                "water_flow_lps": r.water_flow_lps,
                "pressure_psi": r.pressure_psi,
                "reservoir_level_pct": r.reservoir_level_pct,
                "water_quality_index": r.water_quality_index,
                "leak_suspected": r.leak_suspected,
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S") if r.timestamp else ""
            })

    elif dataset_type == "predictions":
        # Export sample predictions comparison
        from ml.service import ml_service
        meta = ml_service.get_models_metadata()
        sample_traffic = meta.get("models", {}).get("traffic", {}).get("sample_comparison", [])
        fieldnames = ["sample_index", "actual", "predicted", "lower_bound", "upper_bound", "uncertainty"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in sample_traffic:
            writer.writerow(row)

    output.seek(0)
    filename = f"citysync_{dataset_type}_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
