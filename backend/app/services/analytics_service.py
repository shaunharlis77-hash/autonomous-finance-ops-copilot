from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.review_task import ReviewTask


class AnalyticsService:
    @staticmethod
    def get_summary(db: Session):
        total_cases = db.query(Case).count()

        approved_cases = db.query(Case).filter(Case.status == "approved").count()

        rejected_cases = db.query(Case).filter(Case.status == "rejected").count()

        pending_review_cases = (
            db.query(Case).filter(Case.status == "pending_review").count()
        )

        awaiting_information_cases = (
            db.query(Case).filter(Case.status == "awaiting_information").count()
        )

        sla_cutoff = datetime.utcnow() - timedelta(hours=48)

        overdue_review_cases = (
            db.query(ReviewTask)
            .filter(
                ReviewTask.status == "pending",
                ReviewTask.created_at < sla_cutoff,
            )
            .count()
        )

        return {
            "total_cases": total_cases,
            "approved_cases": approved_cases,
            "rejected_cases": rejected_cases,
            "pending_review_cases": pending_review_cases,
            "awaiting_information_cases": awaiting_information_cases,
            "overdue_review_cases": overdue_review_cases,
        }
    
    
    @staticmethod
    def get_recent_activity(db: Session):
        from app.models.audit_event import AuditEvent

        recent_events = (
            db.query(AuditEvent)
            .order_by(AuditEvent.created_at.desc())
            .limit(8)
            .all()
        )

        return [
            {
                "id": event.id,
                "case_id": event.case_id,
                "event_type": event.event_type,
                "event_detail": event.event_detail,
                "created_at": str(event.created_at),
            }
            for event in recent_events
        ]