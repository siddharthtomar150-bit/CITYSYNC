from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from pydantic import BaseModel, Field

from ml.service import ml_service
from ml.train_models import train_all_models

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

class TrafficPredictionInput(BaseModel):
    hour_of_day: int = Field(17, ge=0, le=23)
    day_of_week: int = Field(2, ge=0, le=6)
    is_weekend: int = Field(0, ge=0, le=1)
    is_rush_hour: int = Field(1, ge=0, le=1)
    prev_hour_congestion: float = Field(68.0, ge=0.0, le=100.0)
    rolling_3h_congestion: float = Field(62.0, ge=0.0, le=100.0)
    weather_impact_score: float = Field(1.05, ge=0.5, le=2.0)
    vehicle_flow: float = Field(1250.0, ge=0.0)

class ElectricityPredictionInput(BaseModel):
    hour_of_day: int = Field(14, ge=0, le=23)
    day_of_week: int = Field(2, ge=0, le=6)
    is_weekend: int = Field(0, ge=0, le=1)
    ambient_temp_c: float = Field(31.5, ge=-10.0, le=55.0)
    is_industrial_shift: int = Field(1, ge=0, le=1)
    prev_hour_mw: float = Field(98.0, ge=0.0)
    rolling_3h_mw: float = Field(94.0, ge=0.0)
    transformer_temp_c: float = Field(68.0, ge=0.0, le=130.0)

class WaterAnomalyInput(BaseModel):
    water_flow_lps: float = Field(320.0, ge=0.0)
    pressure_psi: float = Field(22.0, ge=0.0)
    reservoir_level_pct: float = Field(78.0, ge=0.0, le=100.0)
    water_quality_index: float = Field(92.0, ge=0.0, le=100.0)

class MultiSystemAnomalyInput(BaseModel):
    hour_of_day: int = Field(16, ge=0, le=23)
    traffic_congestion_pct: float = Field(89.0, ge=0.0, le=100.0)
    power_demand_mw: float = Field(125.0, ge=0.0)
    water_pressure_psi: float = Field(19.0, ge=0.0)
    water_flow_lps: float = Field(25.0, ge=0.0)

@router.get("/models/info")
def get_ml_models_info():
    """Retrieve model type, dataset size, features, evaluation metrics, and comparison samples for all 4 models."""
    return ml_service.get_models_metadata()

@router.post("/predict/traffic")
def predict_traffic_congestion(payload: TrafficPredictionInput):
    """Predict traffic congestion percentage using trained Random Forest Regressor with 90% uncertainty band."""
    return ml_service.predict_traffic(
        hour_of_day=payload.hour_of_day,
        day_of_week=payload.day_of_week,
        is_weekend=payload.is_weekend,
        is_rush_hour=payload.is_rush_hour,
        prev_hour_congestion=payload.prev_hour_congestion,
        rolling_3h_congestion=payload.rolling_3h_congestion,
        weather_impact_score=payload.weather_impact_score,
        vehicle_flow=payload.vehicle_flow
    )

@router.post("/predict/electricity")
def predict_electricity_demand(payload: ElectricityPredictionInput):
    """Predict power demand in MW using trained Random Forest Regressor with 90% uncertainty band."""
    return ml_service.predict_electricity(
        hour_of_day=payload.hour_of_day,
        day_of_week=payload.day_of_week,
        is_weekend=payload.is_weekend,
        ambient_temp_c=payload.ambient_temp_c,
        is_industrial_shift=payload.is_industrial_shift,
        prev_hour_mw=payload.prev_hour_mw,
        rolling_3h_mw=payload.rolling_3h_mw,
        transformer_temp_c=payload.transformer_temp_c
    )

@router.post("/predict/water-anomaly")
def detect_water_anomaly(payload: WaterAnomalyInput):
    """Evaluate hydraulic telemetry using trained Water Isolation Forest for anomaly score and flag."""
    return ml_service.detect_water_anomaly(
        water_flow_lps=payload.water_flow_lps,
        pressure_psi=payload.pressure_psi,
        reservoir_level_pct=payload.reservoir_level_pct,
        water_quality_index=payload.water_quality_index
    )

@router.post("/predict/multi-system-anomaly")
def detect_multi_system_anomaly(payload: MultiSystemAnomalyInput):
    """Evaluate cross-system multi-sensor telemetry using trained Multi-System Isolation Forest."""
    return ml_service.detect_multi_system_anomaly(
        hour_of_day=payload.hour_of_day,
        traffic_congestion_pct=payload.traffic_congestion_pct,
        power_demand_mw=payload.power_demand_mw,
        water_pressure_psi=payload.water_pressure_psi,
        water_flow_lps=payload.water_flow_lps
    )

@router.post("/train")
def retrain_models():
    """Re-run the training pipeline for all 4 models, update joblib artifacts, and reload models in memory."""
    new_metadata = train_all_models()
    ml_service.load_models()
    return {
        "status": "success",
        "message": "All 4 ML models retrained and reloaded successfully.",
        "metadata": new_metadata
    }
