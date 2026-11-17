"""
CITYSYNC - Machine Learning Inference Service
Loads 4 trained models (Traffic RF, Electricity RF, Water IF, Multi-System IF) via joblib,
provides predictions with uncertainty intervals, and surfaces model telemetry.
"""
import json
try:
    import joblib
except ImportError:
    import pickle as joblib
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.core.logger import logger

SAVED_MODELS_DIR = Path(__file__).resolve().parent / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

class MLService:
    def __init__(self):
        self.traffic_model = None
        self.electricity_model = None
        self.water_isolation_forest = None
        self.multi_system_isolation_forest = None
        self.metadata = {}
        self.load_models()

    def load_models(self):
        meta_path = SAVED_MODELS_DIR / "model_metadata.json"
        traffic_path = SAVED_MODELS_DIR / "traffic_model.joblib"
        elec_path = SAVED_MODELS_DIR / "electricity_model.joblib"
        water_if_path = SAVED_MODELS_DIR / "water_isolation_forest.joblib"
        multi_if_path = SAVED_MODELS_DIR / "multi_system_isolation_forest.joblib"

        if not (meta_path.exists() and traffic_path.exists() and elec_path.exists() and water_if_path.exists() and multi_if_path.exists()):
            logger.info("Trained ML models missing or incomplete. Running training pipeline...")
            from ml.train_models import train_all_models
            self.metadata = train_all_models()
        else:
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load metadata: {e}")

        try:
            self.traffic_model = joblib.load(traffic_path)
            self.electricity_model = joblib.load(elec_path)
            self.water_isolation_forest = joblib.load(water_if_path)
            self.multi_system_isolation_forest = joblib.load(multi_if_path)
            logger.info("Successfully loaded all 4 ML models into memory.")
        except Exception as e:
            logger.error(f"Error loading model artifacts: {e}. Retraining...")
            self.metadata = train_all_models()
            self.traffic_model = joblib.load(traffic_path)
            self.electricity_model = joblib.load(elec_path)
            self.water_isolation_forest = joblib.load(water_if_path)
            self.multi_system_isolation_forest = joblib.load(multi_if_path)

    def predict_traffic(
        self,
        hour_of_day: int,
        day_of_week: int,
        is_weekend: int,
        is_rush_hour: int,
        prev_hour_congestion: float,
        rolling_3h_congestion: float,
        weather_impact_score: float,
        vehicle_flow: float
    ) -> Dict[str, Any]:
        features = [[
            float(hour_of_day),
            float(day_of_week),
            float(is_weekend),
            float(is_rush_hour),
            float(prev_hour_congestion),
            float(rolling_3h_congestion),
            float(weather_impact_score),
            float(vehicle_flow)
        ]]
        interval = self.traffic_model.predict_with_intervals(features, confidence=0.90)[0]
        return {
            "model": "RandomForestRegressor (Traffic Congestion)",
            "predicted_congestion_pct": interval["predicted"],
            "lower_bound_90pct": interval["lower_bound"],
            "upper_bound_90pct": interval["upper_bound"],
            "uncertainty_std": interval["uncertainty_std"],
            "features_used": self.traffic_model.feature_names
        }

    def predict_electricity(
        self,
        hour_of_day: int,
        day_of_week: int,
        is_weekend: int,
        ambient_temp_c: float,
        is_industrial_shift: int,
        prev_hour_mw: float,
        rolling_3h_mw: float,
        transformer_temp_c: float
    ) -> Dict[str, Any]:
        features = [[
            float(hour_of_day),
            float(day_of_week),
            float(is_weekend),
            float(ambient_temp_c),
            float(is_industrial_shift),
            float(prev_hour_mw),
            float(rolling_3h_mw),
            float(transformer_temp_c)
        ]]
        interval = self.electricity_model.predict_with_intervals(features, confidence=0.90)[0]
        return {
            "model": "RandomForestRegressor (Power Demand Forecasting)",
            "predicted_demand_mw": interval["predicted"],
            "lower_bound_90pct": interval["lower_bound"],
            "upper_bound_90pct": interval["upper_bound"],
            "uncertainty_std": interval["uncertainty_std"],
            "features_used": self.electricity_model.feature_names
        }

    def detect_water_anomaly(
        self,
        water_flow_lps: float,
        pressure_psi: float,
        reservoir_level_pct: float,
        water_quality_index: float
    ) -> Dict[str, Any]:
        flow_pressure_ratio = round(water_flow_lps / max(1.0, pressure_psi), 2)
        features = [[
            float(water_flow_lps),
            float(pressure_psi),
            float(reservoir_level_pct),
            float(flow_pressure_ratio),
            float(water_quality_index)
        ]]
        score = self.water_isolation_forest.decision_function(features)[0]
        is_anomaly = bool(score >= self.water_isolation_forest.threshold)
        return {
            "model": "IsolationForest (Water Utilities)",
            "anomaly_score": score,
            "decision_threshold": self.water_isolation_forest.threshold,
            "is_anomaly": is_anomaly,
            "features_used": self.water_isolation_forest.feature_names
        }

    def detect_multi_system_anomaly(
        self,
        hour_of_day: int,
        traffic_congestion_pct: float,
        power_demand_mw: float,
        water_pressure_psi: float,
        water_flow_lps: float
    ) -> Dict[str, Any]:
        features = [[
            float(hour_of_day),
            float(traffic_congestion_pct),
            float(power_demand_mw),
            float(water_pressure_psi),
            float(water_flow_lps)
        ]]
        score = self.multi_system_isolation_forest.decision_function(features)[0]
        is_anomaly = bool(score >= self.multi_system_isolation_forest.threshold)
        return {
            "model": "IsolationForest (Cross-System Infrastructure)",
            "anomaly_score": score,
            "decision_threshold": self.multi_system_isolation_forest.threshold,
            "is_anomaly": is_anomaly,
            "features_used": self.multi_system_isolation_forest.feature_names
        }

    def get_models_metadata(self) -> Dict[str, Any]:
        return self.metadata

ml_service = MLService()
