from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import datetime

from app.database.session import get_db
from app.models.models import Incident, User
from app.schemas.schemas import IncidentCreate, IncidentUpdate, IncidentOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentOut])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status (open, investigating, assigned, resolved)"),
    severity: Optional[str] = Query(None, description="Filter by severity (critical, high, medium, low)"),
    category: Optional[str] = Query(None, description="Filter by category (traffic, electricity, water, cross_system)"),
    assigned_department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status and status != "all":
        query = query.filter(Incident.status == status)
    if severity and severity != "all":
        query = query.filter(Incident.severity == severity)
    if category and category != "all":
        query = query.filter(Incident.category == category)
    if assigned_department and assigned_department != "all":
        query = query.filter(Incident.assigned_department == assigned_department)

    return query.order_by(desc(Incident.created_at)).all()

@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.datetime.now(datetime.timezone.utc)
    incident_number = f"INC-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}"

    incident = Incident(
        incident_number=incident_number,
        title=incident_in.title,
        category=incident_in.category,
        severity=incident_in.severity,
        status="open",
        description=incident_in.description,
        location_name=incident_in.location_name,
        sector=incident_in.sector,
        node_id=incident_in.node_id,
        assigned_department=incident_in.assigned_department or current_user.role,
        reported_by=current_user.full_name,
        created_at=now,
        updated_at=now
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    incident_in: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident_in.title is not None:
        incident.title = incident_in.title
    if incident_in.severity is not None:
        incident.severity = incident_in.severity
    if incident_in.status is not None:
        valid_statuses = ["open", "investigating", "assigned", "resolved"]
        if incident_in.status in valid_statuses:
            incident.status = incident_in.status
        if incident_in.status == "resolved" and not incident.resolved_at:
            incident.resolved_at = datetime.datetime.now(datetime.timezone.utc)
            incident.resolved_by = current_user.full_name
    if incident_in.assigned_department is not None:
        incident.assigned_department = incident_in.assigned_department
    if incident_in.investigation_notes is not None:
        incident.investigation_notes = incident_in.investigation_notes
    if incident_in.resolution_notes is not None:
        incident.resolution_notes = incident_in.resolution_notes

    incident.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(
    incident_id: int,
    resolution_notes: str = "Resolved by department operator",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "resolved"
    incident.resolved_at = datetime.datetime.now(datetime.timezone.utc)
    incident.resolved_by = current_user.full_name
    incident.resolution_notes = resolution_notes
    incident.updated_at = datetime.datetime.now(datetime.timezone.utc)

    db.commit()
    db.refresh(incident)
    return incident
