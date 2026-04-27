from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        case_id: int,
        event_type: str,
        event_detail: str | None = None,
    ) -> AuditEvent:
        audit_event = AuditEvent(
            case_id=case_id,
            event_type=event_type,
            event_detail=event_detail,
        )

        db.add(audit_event)
        db.commit()
        db.refresh(audit_event)

        return audit_event
