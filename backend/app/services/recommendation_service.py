"""
CITYSYNC - Smart Recommendation & Decision-Support Service
Generates context-aware, actionable interventions explaining:
- What happened?
- Why it matters?
- Which infrastructure is affected?
- What action is suggested?
- What priority should be assigned?
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Recommendation, Anomaly, Incident
from app.core.logger import logger

class RecommendationService:
    @staticmethod
    def generate_recommendations_from_events(
        db: Session,
        cross_impacts: List[Dict[str, Any]],
        anomalies: List[Dict[str, Any]]
    ) -> List[Recommendation]:
        """Synthesize cross-system alerts into prioritized actionable decisions."""
        generated = []

        for impact in cross_impacts:
            if not impact.get("is_active"):
                continue
            
            title = f"Cross-System Alert: {impact['source_system']} affecting {impact['target_system']}"
            
            # Check if active recommendation already exists
            existing = db.query(Recommendation).filter(
                Recommendation.title == title,
                Recommendation.status == "pending"
            ).first()
            
            if existing:
                continue

            priority = "urgent" if impact["severity"] == "critical" else "high"
            affected_nodes = f"{impact['source_location']} -> {impact['target_infrastructure']}"
            consequences_text = " ".join(impact.get("chain_of_consequences", []))
            
            rec = Recommendation(
                title=title,
                category="cross_system",
                priority=priority,
                sector=", ".join(impact.get("affected_sectors", ["Citywide"])),
                what_happened=(
                    f"Cascading incident detected: {impact['source_event']} at {impact['source_location']} "
                    f"is propagating into {impact['target_system']}."
                ),
                why_it_matters=(
                    f"{impact['consequence_summary']} {consequences_text} "
                    f"Estimated escalation impact: {impact.get('estimated_delay_mins', 15)} mins delay."
                ),
                affected_infrastructure=affected_nodes,
                suggested_action=impact["recommended_action"],
                status="pending",
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            generated.append(rec)
            logger.info(f"Generated Smart Recommendation: {title}")

        return generated

    @staticmethod
    def update_recommendation_status(db: Session, rec_id: int, status: str) -> Optional[Recommendation]:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if rec:
            rec.status = status
            if status == "applied":
                rec.applied_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            db.refresh(rec)
        return rec

recommendation_service = RecommendationService()
