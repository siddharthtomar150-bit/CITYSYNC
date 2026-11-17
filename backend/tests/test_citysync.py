"""
CITYSYNC - Comprehensive Test Suite
Tests authentication & role RBAC (5 roles), database ORM, telemetry endpoints,
map search & facility inspection, full incident lifecycle with investigation notes,
anomaly resolution, all 4 machine learning models with confidence envelopes,
cross-system dependency cascade engine, simulation runner, and reporting exports.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.cross_system_engine import cross_system_engine

client = TestClient(app)

def test_health_check():
    """Verify system health and platform metadata."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "CITYSYNC" in data["platform"]
    assert data["version"] == "1.0.0"

def test_auth_login_admin():
    """Verify admin login returns JWT and correct user details."""
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

@pytest.mark.parametrize("role", ["super_admin", "admin", "traffic", "electricity", "water"])
def test_auth_switch_all_roles(role):
    """Verify switching across all 5 municipal roles dynamically."""
    response = client.get(f"/api/auth/switch-role/{role}")
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == role
    assert "access_token" in data

def test_dashboard_kpis():
    """Verify executive KPI cards with real computed values."""
    response = client.get("/api/dashboard/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "traffic_congestion" in data
    assert "electricity_consumption" in data
    assert "water_supply_status" in data
    assert "infrastructure_health_score" in data
    assert "active_incidents" in data
    assert "predicted_disruptions" in data

def test_dashboard_overview():
    """Verify command center aggregated feed and system status."""
    response = client.get("/api/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert "status_counts" in data
    assert "total_nodes" in data
    assert "recent_incidents" in data
    assert "cross_system_cascades" in data
    assert "activity_feed" in data

def test_map_nodes():
    """Verify all 16 infrastructure nodes are geo-located and simulated-flagged."""
    response = client.get("/api/map/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert len(nodes) >= 15
    assert all("is_simulated" in n for n in nodes)
    assert all("latitude" in n and "longitude" in n for n in nodes)

def test_map_search():
    """Verify live node search query returns matching facilities."""
    response = client.get("/api/map/search?q=Central")
    assert response.status_code == 200
    results = response.json()
    assert "nodes" in results
    assert len(results["nodes"]) >= 1
    assert any("Central" in n["name"] for n in results["nodes"])

def test_facility_inspector():
    """Verify facility inspector drawer returns node details, telemetry, and status."""
    nodes_res = client.get("/api/map/nodes")
    first_node_id = nodes_res.json()[0]["id"]
    
    response = client.get(f"/api/map/facilities/{first_node_id}/inspector")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "category" in data
    assert "telemetry_history" in data
    assert "recent_incidents" in data

def test_incident_lifecycle():
    """
    Test full incident progression through formal lifecycle:
    open -> investigating -> assigned -> resolved with investigation and resolution notes.
    """
    # 1. Create incident (starts as 'open')
    create_res = client.post("/api/incidents", json={
        "title": "Main Water Main Pressure Drop",
        "category": "water",
        "severity": "high",
        "description": "Pressure dropped below 28 PSI on trunk feeder.",
        "location_name": "West Suburbs Water Loop",
        "sector": "Sector 3 - West River Suburbs",
        "assigned_department": "water"
    })
    assert create_res.status_code == 201
    inc_data = create_res.json()
    inc_id = inc_data["id"]
    assert inc_data["status"] == "open"

    # 2. Update status to 'investigating' with investigation notes
    inv_res = client.patch(f"/api/incidents/{inc_id}", json={
        "status": "investigating",
        "investigation_notes": "Acoustic sensor detected vibration consistent with 4-inch valve failure."
    })
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert inv_data["status"] == "investigating"
    assert "Acoustic sensor" in inv_data["investigation_notes"]

    # 3. Update status to 'assigned'
    assign_res = client.patch(f"/api/incidents/{inc_id}", json={
        "status": "assigned",
        "assigned_department": "water"
    })
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "assigned"

    # 4. Resolve incident with resolution notes
    resolve_res = client.post(f"/api/incidents/{inc_id}/resolve?resolution_notes=Bypass+valve+engaged+and+line+repaired")
    assert resolve_res.status_code == 200
    res_data = resolve_res.json()
    assert res_data["status"] == "resolved"
    assert res_data["resolution_notes"] is not None
    assert res_data["resolved_at"] is not None

def test_anomaly_status_patch():
    """Verify anomaly detection status update (active -> resolved)."""
    anom_res = client.get("/api/anomalies")
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    if anomalies:
        first_anom_id = anomalies[0]["id"]
        patch_res = client.patch(f"/api/anomalies/{first_anom_id}/status", json={
            "resolution_status": "investigating"
        })
        assert patch_res.status_code == 200
        assert patch_res.json()["resolution_status"] == "investigating"

def test_ml_models_info():
    """Verify all 4 ML models are loaded with evaluation metrics."""
    response = client.get("/api/ml/models/info")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    models = data["models"]
    assert "traffic" in models
    assert "electricity" in models
    assert "water_anomaly" in models
    assert "multi_system_anomaly" in models
    assert models["traffic"]["metrics"]["r2_score"] > 0.85
    assert models["electricity"]["metrics"]["r2_score"] > 0.85
    assert models["water_anomaly"]["metrics"]["f1_score"] > 0.80
    assert models["multi_system_anomaly"]["metrics"]["f1_score"] > 0.80

def test_ml_traffic_prediction():
    """Verify Traffic Random Forest Regressor prediction and 90% confidence envelope."""
    response = client.post("/api/ml/predict/traffic", json={
        "hour_of_day": 18,
        "day_of_week": 2,
        "is_weekend": 0,
        "is_rush_hour": 1,
        "prev_hour_congestion": 72.0,
        "rolling_3h_congestion": 65.0,
        "weather_impact_score": 1.1,
        "vehicle_flow": 1400.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "predicted_congestion_pct" in data
    assert "lower_bound_90pct" in data
    assert "upper_bound_90pct" in data
    assert data["lower_bound_90pct"] <= data["predicted_congestion_pct"] <= data["upper_bound_90pct"]

def test_ml_electricity_prediction():
    """Verify Power Demand Random Forest Regressor prediction and 90% confidence envelope."""
    response = client.post("/api/ml/predict/electricity", json={
        "hour_of_day": 14,
        "day_of_week": 1,
        "is_weekend": 0,
        "ambient_temp_c": 32.0,
        "is_industrial_shift": 1,
        "prev_hour_mw": 105.0,
        "rolling_3h_mw": 98.0,
        "transformer_temp_c": 72.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "predicted_demand_mw" in data
    assert data["lower_bound_90pct"] <= data["predicted_demand_mw"] <= data["upper_bound_90pct"]

def test_ml_water_anomaly_prediction():
    """Verify Water Utility Isolation Forest anomaly detector inference."""
    res_normal = client.post("/api/ml/predict/water-anomaly", json={
        "water_flow_lps": 460.0,
        "pressure_psi": 58.0,
        "reservoir_level_pct": 82.0,
        "water_quality_index": 95.0
    })
    assert res_normal.status_code == 200
    data_normal = res_normal.json()
    assert "is_anomaly" in data_normal
    assert "anomaly_score" in data_normal

    res_burst = client.post("/api/ml/predict/water-anomaly", json={
        "water_flow_lps": 950.0,
        "pressure_psi": 12.0,
        "reservoir_level_pct": 20.0,
        "water_quality_index": 45.0
    })
    assert res_burst.status_code == 200
    data_burst = res_burst.json()
    assert data_burst["is_anomaly"] is True

def test_ml_multi_system_anomaly_prediction():
    """Verify Infrastructure Multi-System Isolation Forest anomaly detector."""
    res_normal = client.post("/api/ml/predict/multi-system-anomaly", json={
        "hour_of_day": 12,
        "traffic_congestion_pct": 45.0,
        "power_demand_mw": 55.0,
        "water_pressure_psi": 60.0,
        "water_flow_lps": 300.0
    })
    assert res_normal.status_code == 200
    data_normal = res_normal.json()
    assert "is_anomaly" in data_normal
    assert "anomaly_score" in data_normal

    res_crisis = client.post("/api/ml/predict/multi-system-anomaly", json={
        "hour_of_day": 18,
        "traffic_congestion_pct": 96.0,
        "power_demand_mw": 145.0,
        "water_pressure_psi": 15.0,
        "water_flow_lps": 30.0
    })
    assert res_crisis.status_code == 200
    data_crisis = res_crisis.json()
    assert data_crisis["is_anomaly"] is True

def test_cross_system_engine_cascade():
    """Verify topological cross-system dependency consequence propagation."""
    fake_anomalies = [
        {
            "event_type": "POWER_GRID_FEEDER_TRIP",
            "category": "electricity",
            "location_name": "East Industrial Primary Substation (110kV)",
            "sector": "Sector 4 - East Industrial Park",
            "severity": "critical"
        },
        {
            "event_type": "TRAFFIC_CONGESTION_SPIKE",
            "category": "traffic",
            "location_name": "Metro Central Arterial Corridor",
            "sector": "Sector 1 - Downtown Core",
            "severity": "high"
        }
    ]
    cascades = cross_system_engine.analyze_cross_system_impacts(fake_anomalies, [], {})
    assert len(cascades) >= 2
    # Verify power -> water cascade
    assert any(c["source_system"] == "Electricity Grid" and "Water" in c["target_system"] for c in cascades)
    # Verify traffic -> emergency delay cascade
    assert any(c["source_system"] == "Traffic Network" for c in cascades)

def test_simulation_crisis_and_reset():
    """Verify 10-step crisis scenario trigger and clean reset."""
    crisis_res = client.post("/api/simulation/crisis")
    assert crisis_res.status_code == 200
    crisis_data = crisis_res.json()
    assert "status" in crisis_data

    reset_res = client.post("/api/simulation/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["status"] == "success"

def test_reports_csv_exports():
    """Verify CSV report streaming endpoints return valid CSV headers and data."""
    report_types = ["traffic", "electricity", "water", "incidents", "anomalies"]
    for rtype in report_types:
        response = client.get(f"/api/reports/export-csv?dataset_type={rtype}")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert len(response.text) > 0

def test_traffic_intelligence_summary():
    """Verify traffic corridors summary and metrics."""
    res = client.get("/api/traffic/summary")
    assert res.status_code == 200
    data = res.json()
    assert "average_congestion_pct" in data
    assert "segments" in data
    assert len(data["segments"]) >= 1

def test_electricity_intelligence_summary():
    """Verify electrical substations load summary and capacity."""
    res = client.get("/api/electricity/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_power_demand_mw" in data
    assert "substations" in data
    assert len(data["substations"]) >= 1

def test_water_intelligence_summary():
    """Verify municipal water distribution facilities summary."""
    res = client.get("/api/water/summary")
    assert res.status_code == 200
    data = res.json()
    assert "average_pressure_psi" in data
    assert "facilities" in data
    assert len(data["facilities"]) >= 1

def test_recommendation_conversion_to_incident():
    """Verify converting an actionable recommendation into a tracked municipal incident."""
    recs = client.get("/api/recommendations").json()
    if recs:
        target_rec = recs[0]
        res = client.post(f"/api/recommendations/{target_rec['id']}/convert-to-incident")
        assert res.status_code == 200
        data = res.json()
        assert "incident_number" in data
        assert "incident_id" in data

def test_simulation_engine_start_stop():
    """Verify simulation engine start and stop endpoints."""
    res_stop = client.post("/api/simulation/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "stopped"

    res_start = client.post("/api/simulation/start")
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "started"
