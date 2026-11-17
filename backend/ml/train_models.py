"""
CITYSYNC - Machine Learning Model Training & Evaluation Pipeline
Trains:
1. Traffic Congestion Random Forest Regressor
2. Electricity Demand Random Forest Regressor
3. Water Utility Isolation Forest Anomaly Detector
4. Multi-System Infrastructure Isolation Forest Anomaly Detector
Evaluates MAE, RMSE, R2, Precision, Recall, F1, and saves artifacts with Joblib.
"""
import csv
import json
try:
    import joblib
except ImportError:
    import pickle as joblib
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Tuple

from app.core.logger import logger
from ml.data_generator import generate_all_datasets, DATASETS_DIR
from ml.models import (
    RandomForestRegressor,
    IsolationForest,
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    classification_metrics
)

SAVED_MODELS_DIR = Path(__file__).resolve().parent / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_test_split(X: List[List[float]], y: List[Any], test_ratio: float = 0.20, seed: int = 42) -> Tuple:
    import random
    rng = random.Random(seed)
    indices = list(range(len(X)))
    rng.shuffle(indices)
    
    split_idx = int(len(X) * (1.0 - test_ratio))
    train_idx = indices[:split_idx]
    test_idx = indices[split_idx:]
    
    X_train = [X[i] for i in train_idx]
    y_train = [y[i] for i in train_idx]
    X_test = [X[i] for i in test_idx]
    y_test = [y[i] for i in test_idx]
    
    return X_train, X_test, y_train, y_test

def train_traffic_model() -> Dict[str, Any]:
    dataset_path = DATASETS_DIR / "traffic_dataset.csv"
    if not dataset_path.exists():
        generate_all_datasets()
        
    features = [
        "hour_of_day", "day_of_week", "is_weekend", "is_rush_hour",
        "prev_hour_congestion", "rolling_3h_congestion", "weather_impact_score", "vehicle_flow"
    ]
    target = "congestion_level"
    
    X, y = [], []
    with open(dataset_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            X.append([float(row[feat]) for feat in features])
            y.append(float(row[target]))
            
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_ratio=0.20, seed=42)
    
    logger.info(f"Training Traffic Random Forest on {len(X_train)} samples...")
    model = RandomForestRegressor(n_estimators=18, max_depth=8, min_samples_split=4, random_state=42)
    model.fit(X_train, y_train, feature_names=features)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    model_path = SAVED_MODELS_DIR / "traffic_model.joblib"
    joblib.dump(model, model_path)
    logger.info(f"Traffic Model trained! Test R²={r2:.4f}, MAE={mae:.2f}%, RMSE={rmse:.2f}%")
    
    sample_comparison = []
    for i in range(min(15, len(y_test))):
        intervals = model.predict_with_intervals([X_test[i]])[0]
        sample_comparison.append({
            "sample_index": i + 1,
            "actual": round(y_test[i], 1),
            "predicted": intervals["predicted"],
            "lower_bound": intervals["lower_bound"],
            "upper_bound": intervals["upper_bound"],
            "uncertainty": intervals["uncertainty_std"]
        })
        
    return {
        "model_name": "Traffic Congestion Random Forest Regressor",
        "model_type": "RandomForestRegressor",
        "target_variable": "congestion_level (%)",
        "dataset_file": "traffic_dataset.csv",
        "total_samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": features,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(r2, 4)
        },
        "sample_comparison": sample_comparison,
        "saved_path": str(model_path.name)
    }

def train_electricity_model() -> Dict[str, Any]:
    dataset_path = DATASETS_DIR / "electricity_dataset.csv"
    if not dataset_path.exists():
        generate_all_datasets()
        
    features = [
        "hour_of_day", "day_of_week", "is_weekend", "ambient_temp_c",
        "is_industrial_shift", "prev_hour_mw", "rolling_3h_mw", "transformer_temp_c"
    ]
    target = "power_demand_mw"
    
    X, y = [], []
    with open(dataset_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            X.append([float(row[feat]) for feat in features])
            y.append(float(row[target]))
            
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_ratio=0.20, seed=43)
    
    logger.info(f"Training Electricity Demand Random Forest on {len(X_train)} samples...")
    model = RandomForestRegressor(n_estimators=18, max_depth=8, min_samples_split=4, random_state=43)
    model.fit(X_train, y_train, feature_names=features)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    model_path = SAVED_MODELS_DIR / "electricity_model.joblib"
    joblib.dump(model, model_path)
    logger.info(f"Electricity Model trained! Test R²={r2:.4f}, MAE={mae:.2f} MW, RMSE={rmse:.2f} MW")
    
    sample_comparison = []
    for i in range(min(15, len(y_test))):
        intervals = model.predict_with_intervals([X_test[i]])[0]
        sample_comparison.append({
            "sample_index": i + 1,
            "actual": round(y_test[i], 2),
            "predicted": intervals["predicted"],
            "lower_bound": intervals["lower_bound"],
            "upper_bound": intervals["upper_bound"],
            "uncertainty": intervals["uncertainty_std"]
        })
        
    return {
        "model_name": "Power Demand Forecasting Random Forest Regressor",
        "model_type": "RandomForestRegressor",
        "target_variable": "power_demand_mw (MW)",
        "dataset_file": "electricity_dataset.csv",
        "total_samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": features,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(r2, 4)
        },
        "sample_comparison": sample_comparison,
        "saved_path": str(model_path.name)
    }

def train_water_isolation_forest_model() -> Dict[str, Any]:
    dataset_path = DATASETS_DIR / "water_dataset.csv"
    if not dataset_path.exists():
        generate_all_datasets()
        
    features = [
        "water_flow_lps", "pressure_psi", "reservoir_level_pct",
        "flow_pressure_ratio", "water_quality_index"
    ]
    target = "is_anomaly"
    
    X, y = [], []
    with open(dataset_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            X.append([float(row[feat]) for feat in features])
            y.append(int(row[target]))
            
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_ratio=0.20, seed=44)
    
    logger.info(f"Training Water Utility Isolation Forest on {len(X_train)} samples...")
    model = IsolationForest(n_estimators=30, max_samples=256, contamination=0.05, random_state=44)
    model.fit(X_train, feature_names=features)
    
    y_pred = model.predict(X_test)
    eval_metrics = classification_metrics(y_test, y_pred)
    
    model_path = SAVED_MODELS_DIR / "water_isolation_forest.joblib"
    joblib.dump(model, model_path)
    logger.info(f"Water Isolation Forest trained! Precision={eval_metrics['precision']}, Recall={eval_metrics['recall']}, F1={eval_metrics['f1_score']}")
    
    return {
        "model_name": "Water Utility Isolation Forest Anomaly Detector",
        "model_type": "IsolationForest",
        "target_variable": "is_anomaly (Water Hydraulics)",
        "dataset_file": "water_dataset.csv",
        "total_samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": features,
        "contamination": 0.05,
        "calibrated_threshold": model.threshold,
        "metrics": eval_metrics,
        "saved_path": str(model_path.name)
    }

def train_multi_system_isolation_forest_model() -> Dict[str, Any]:
    dataset_path = DATASETS_DIR / "multi_system_anomaly_dataset.csv"
    if not dataset_path.exists():
        generate_all_datasets()

    features = [
        "hour_of_day", "traffic_congestion_pct", "power_demand_mw",
        "water_pressure_psi", "water_flow_lps"
    ]
    target = "is_multi_system_anomaly"

    X, y = [], []
    with open(dataset_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            X.append([float(row[feat]) for feat in features])
            y.append(int(row[target]))

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_ratio=0.20, seed=45)

    logger.info(f"Training Multi-System Infrastructure Isolation Forest on {len(X_train)} samples...")
    model = IsolationForest(n_estimators=30, max_samples=256, contamination=0.04, random_state=45)
    model.fit(X_train, feature_names=features)

    y_pred = model.predict(X_test)
    eval_metrics = classification_metrics(y_test, y_pred)

    model_path = SAVED_MODELS_DIR / "multi_system_isolation_forest.joblib"
    joblib.dump(model, model_path)
    logger.info(f"Multi-System Isolation Forest trained! Precision={eval_metrics['precision']}, Recall={eval_metrics['recall']}, F1={eval_metrics['f1_score']}")

    return {
        "model_name": "Infrastructure Multi-System Isolation Forest Anomaly Detector",
        "model_type": "IsolationForest",
        "target_variable": "is_multi_system_anomaly (Cross-System)",
        "dataset_file": "multi_system_anomaly_dataset.csv",
        "total_samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": features,
        "contamination": 0.04,
        "calibrated_threshold": model.threshold,
        "metrics": eval_metrics,
        "saved_path": str(model_path.name)
    }

def train_all_models() -> Dict[str, Any]:
    logger.info("Initializing CITYSYNC Machine Learning Training Pipeline for all 4 models...")
    generate_all_datasets()
    
    traffic_meta = train_traffic_model()
    elec_meta = train_electricity_model()
    water_if_meta = train_water_isolation_forest_model()
    multi_if_meta = train_multi_system_isolation_forest_model()
    
    metadata = {
        "pipeline_version": "2.0.0",
        "last_trained_at": datetime.now(timezone.utc).isoformat(),
        "training_environment": "Python 3.14 + Joblib Engine",
        "models": {
            "traffic": traffic_meta,
            "electricity": elec_meta,
            "water_anomaly": water_if_meta,
            "multi_system_anomaly": multi_if_meta
        }
    }
    
    meta_path = SAVED_MODELS_DIR / "model_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Sync with DB ModelInformation table
    try:
        from app.database.session import SessionLocal, engine, Base
        from app.models.models import ModelInformation
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        for key, m in metadata["models"].items():
            db_mod = db.query(ModelInformation).filter(ModelInformation.model_name == m["model_name"]).first()
            if not db_mod:
                db_mod = ModelInformation(
                    model_name=m["model_name"],
                    model_type=m["model_type"],
                    target_variable=m["target_variable"],
                    dataset_size=m["total_samples"],
                    train_samples=m["train_samples"],
                    test_samples=m["test_samples"],
                    metrics_json=json.dumps(m["metrics"]),
                    features_json=json.dumps(m["features"]),
                    status="active",
                    last_trained_at=datetime.now(timezone.utc)
                )
                db.add(db_mod)
            else:
                db_mod.dataset_size = m["total_samples"]
                db_mod.train_samples = m["train_samples"]
                db_mod.test_samples = m["test_samples"]
                db_mod.metrics_json = json.dumps(m["metrics"])
                db_mod.features_json = json.dumps(m["features"])
                db_mod.last_trained_at = datetime.now(timezone.utc)
        db.commit()
        db.close()
    except Exception as e:
        logger.warning(f"Could not sync ModelInformation to DB: {e}")
        
    logger.info(f"All 4 ML models trained and saved to {SAVED_MODELS_DIR}")
    return metadata

if __name__ == "__main__":
    train_all_models()
