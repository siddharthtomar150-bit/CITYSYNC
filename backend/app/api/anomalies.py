from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database.session import get_db
from app.models.models import Anomaly
from app.schemas.schemas import AnomalyOut, AnomalyUpdate

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("", response_model=List[AnomalyOut])
def list_anomalies(
    category: Optional[str] = Query(None, description="Filter by category (traffic, electricity, water, cross_system)"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by resolution status (detected, investigating, mitigated, resolved)"),
    detection_method: Optional[str] = Query(None, description="Filter by detection method"),
    db: Session = Depends(get_db)
):
    query = db.query(Anomaly)
    if category and category != "all":
        query = query.filter(Anomaly.category == category)
    if severity and severity != "all":
        query = query.filter(Anomaly.severity == severity)
    if status and status != "all":
        query = query.filter(Anomaly.resolution_status == status)
    if detection_method and detection_method != "all":
        query = query.filter(Anomaly.detection_method == detection_method)

    return query.order_by(desc(Anomaly.timestamp)).limit(60).all()

@router.patch("/{anomaly_id}/status", response_model=AnomalyOut)
def update_anomaly_status(anomaly_id: int, update_in: AnomalyUpdate, db: Session = Depends(get_db)):
    """Update anomaly investigation or mitigation status."""
    anom = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    if update_in.resolution_status is not None:
        anom.resolution_status = update_in.resolution_status
    if update_in.is_acknowledged is not None:
        anom.is_acknowledged = update_in.is_acknowledged

    db.commit()
    db.refresh(anom)
    return anom

@router.post("/{anomaly_id}/acknowledge", response_model=AnomalyOut)
def acknowledge_anomaly(anomaly_id: int, db: Session = Depends(get_db)):
    """Acknowledge an anomaly alert."""
    anom = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    anom.is_acknowledged = True
    db.commit()
    db.refresh(anom)
    return anom
