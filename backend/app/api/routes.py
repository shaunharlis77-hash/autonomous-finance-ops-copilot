from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.models.case import Case
from app.models.case_file import CaseFile
from app.models.extracted_field import ExtractedField
from app.services.blob_storage import BlobStorageService
from app.services.document_intelligence import DocumentIntelligenceService
from app.services.validation import ValidationService
from app.services.risk_scoring import RiskScoringService
from app.services.decision import DecisionService
from app.models.decision import Decision
from app.models.audit_event import AuditEvent
from app.services.n8n_service import N8NService

router = APIRouter()

def log_audit_event(db: Session, case_id: int, event_type: str, event_detail: str = None):
    audit_event = AuditEvent(
        case_id=case_id,
        event_type=event_type,
        event_detail=event_detail
    )
    db.add(audit_event)
    db.commit()
    db.refresh(audit_event)
    return audit_event


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Autonomous Finance Ops Copilot backend is running"
    }


@router.post("/cases/upload")
async def create_case_with_file(
    case_type: str = Form(...),
    submitter_name: str = Form(...),
    submitter_email: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()

    new_case = Case(
        case_type=case_type,
        submitter_name=submitter_name,
        submitter_email=submitter_email,
        status="new",
        current_stage="uploaded",
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    log_audit_event(
        db,
        new_case.id,
        "case_created",
        f"Case created for {new_case.case_type}"
    )

    blob_service = BlobStorageService()
    blob_name = f"{new_case.id}-{uuid4()}-{file.filename}"

    from io import BytesIO
    upload_stream = UploadFile(
        filename=file.filename,
        file=BytesIO(file_bytes)
    )

    file_url = await blob_service.upload_file(upload_stream, blob_name)

    new_case_file = CaseFile(
        case_id=new_case.id,
        file_name=file.filename,
        blob_url=file_url
    )
    db.add(new_case_file)
    db.commit()
    db.refresh(new_case_file)

    log_audit_event(
        db,
        new_case.id,
        "file_uploaded",
        f"Uploaded file: {new_case_file.file_name}"
    )

    extraction_result = {}
    validation_result = {}
    risk_result = {}
    decision_result = {}

    if case_type.lower() == "invoice":
        doc_service = DocumentIntelligenceService()
        extraction_result = doc_service.extract_invoice_data(file_bytes)

        log_audit_event(
            db,
            new_case.id,
            "extraction_completed",
            "Invoice extraction completed"
        )

        validator = ValidationService()
        validation_result = validator.validate_invoice(extraction_result)

        log_audit_event(
            db,
            new_case.id,
            "validation_completed",
            f"Validation result: {validation_result}"
        )

        risk_service = RiskScoringService()
        risk_result = risk_service.score_invoice(extraction_result, validation_result)

        log_audit_event(
            db,
            new_case.id,
            "risk_scored",
            f"Risk result: {risk_result}"
        )

        decision_service = DecisionService()
        decision_result = decision_service.decide_invoice(validation_result, risk_result)

        if decision_result["decision"] == "approve":
            new_case.status = "approved"
            new_case.current_stage = "completed"
        elif decision_result["decision"] == "escalate":
            new_case.status = "pending_review"
            new_case.current_stage = "review"
        elif decision_result["decision"] == "reject":
            new_case.status = "rejected"
            new_case.current_stage = "closed"

        db.commit()
        db.refresh(new_case)

        log_audit_event(
            db,
            new_case.id,
            "case_status_updated",
            f"Case moved to status={new_case.status}, stage={new_case.current_stage}"
        )
        
        decision_record = Decision(
            case_id=new_case.id,
            outcome=decision_result["decision"],
            reason=decision_result["reason"]
        )
        db.add(decision_record)
        db.commit()
        db.refresh(decision_record)

        log_audit_event(
            db,
            new_case.id,
            "decision_recorded",
            f"Decision recorded: {decision_record.outcome}"
        )

        n8n_result = {}

        n8n_service = N8NService()
        n8n_payload = {
            "case_id": new_case.id,
            "case_type": new_case.case_type,
            "submitter_name": new_case.submitter_name,
            "submitter_email": new_case.submitter_email,
            "status": new_case.status,
            "current_stage": new_case.current_stage,
            "decision": decision_result["decision"],
            "decision_reason": decision_result["reason"],
            "risk_level": risk_result.get("risk_level"),
            "risk_score": risk_result.get("score"),
            "timestamp": str(decision_record.decided_at),
        }
        n8n_result = await n8n_service.send_decision_event(n8n_payload)

        log_audit_event(
            db,
            new_case.id,
            "n8n_notified",
            f"n8n webhook result: {n8n_result}"
        )


        for field_name, field_data in extraction_result.get("fields", {}).items():
            extracted_field = ExtractedField(
                case_id=new_case.id,
                field_name=field_name,
                field_value=str(field_data.get("value")) if field_data.get("value") is not None else None,
                confidence=field_data.get("confidence"),
            )
            db.add(extracted_field)

        db.commit()

    audit_events = db.query(AuditEvent).filter(AuditEvent.case_id == new_case.id).all()

    return {
        "case": {
            "id": new_case.id,
            "case_type": new_case.case_type,
            "submitter_name": new_case.submitter_name,
            "submitter_email": new_case.submitter_email,
            "status": new_case.status,
            "current_stage": new_case.current_stage,
        },
        "file": {
            "id": new_case_file.id,
            "file_name": new_case_file.file_name,
            "blob_url": new_case_file.blob_url,
        },
        "extraction_result": extraction_result,
        "validation_result": validation_result,
        "risk_result": risk_result,
        "decision_result": decision_result,
        "decision_record": {
            "id": decision_record.id,
            "case_id": decision_record.case_id,
            "outcome": decision_record.outcome,
            "reason": decision_record.reason,
            "decided_at": decision_record.decided_at,
        },
        "audit_events": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "event_detail": event.event_detail,
                "created_at": event.created_at,
            }
            for event in audit_events
        ],
        "n8n_result": n8n_result,   
    }


    