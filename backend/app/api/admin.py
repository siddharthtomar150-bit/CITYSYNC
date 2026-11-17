from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import platform
import sys

from app.database.session import get_db
from app.models.models import User, InfrastructureNode, Incident, Anomaly
from app.schemas.schemas import UserOut
from app.api.deps import require_admin
from app.services.simulation_engine import simulation_engine
from ml.service import ml_service

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/users", response_model=list[UserOut])
def list_system_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """List registered users and assigned municipal roles."""
    return db.query(User).all()

@router.get("/system-health")
def get_system_health(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Diagnostics and system health parameters."""
    return {
        "platform_os": platform.platform(),
        "python_version": sys.version,
        "database": "SQLite (WAL Mode Enabled, Foreign Keys Active)",
        "db_connected": True,
        "simulation_engine": {
            "is_running": simulation_engine.is_running,
            "interval_seconds": simulation_engine.interval_seconds,
            "cycles_run": simulation_engine.total_cycles_run,
            "crisis_mode": simulation_engine.crisis_mode
        },
        "machine_learning_service": {
            "models_loaded": bool(ml_service.traffic_model and ml_service.electricity_model and ml_service.isolation_forest),
            "pipeline_version": ml_service.metadata.get("pipeline_version", "1.0.0"),
            "last_trained_at": ml_service.metadata.get("last_trained_at")
        },
        "counts": {
            "infrastructure_nodes": db.query(InfrastructureNode).count(),
            "incidents": db.query(Incident).count(),
            "anomalies": db.query(Anomaly).count()
        }
    }
