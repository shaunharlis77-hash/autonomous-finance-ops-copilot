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

        approval_rate = (
            round((approved_cases / total_cases) * 100, 1)
            if total_cases > 0
            else 0
        )

        rejection_rate = (
            round((rejected_cases / total_cases) * 100, 1)
            if total_cases > 0
            else 0
        )

        escalation_rate = (
            round((pending_review_cases / total_cases) * 100, 1)
            if total_cases > 0
            else 0
        )

        pending_review_tasks = (
            db.query(ReviewTask)
            .filter(ReviewTask.status == "pending")
            .count()
        )

        resolved_review_tasks = (
            db.query(ReviewTask)
            .filter(ReviewTask.status == "resolved")
            .count()
        )

        assigned_review_tasks = (
            db.query(ReviewTask)
            .filter(
                ReviewTask.status == "pending",
                ReviewTask.assigned_to.isnot(None),
            )
            .count()
        )

        unassigned_review_tasks = (
            db.query(ReviewTask)
            .filter(
                ReviewTask.status == "pending",
                ReviewTask.assigned_to.is_(None),
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
            "approval_rate": approval_rate,
            "rejection_rate": rejection_rate,
            "escalation_rate": escalation_rate,
            "pending_review_tasks": pending_review_tasks,
            "resolved_review_tasks": resolved_review_tasks,
            "assigned_review_tasks": assigned_review_tasks,
            "unassigned_review_tasks": unassigned_review_tasks,
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