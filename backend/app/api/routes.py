from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
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
from app.services.audit_service import AuditService
from app.services.n8n_service import N8NService
from app.models.review_task import ReviewTask
import ast
from app.workflows.decision_graph import build_decision_graph
from app.services.review_service import ReviewService
from app.services.analytics_service import AnalyticsService
from app.services.graph_state_service import GraphStateService


router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Autonomous Finance Ops Copilot backend is running",
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

    AuditService.log_event(
        db, new_case.id, "case_created", f"Case created for {new_case.case_type}"
    )

    blob_service = BlobStorageService()
    blob_name = f"{new_case.id}-{uuid4()}-{file.filename}"

    from io import BytesIO

    upload_stream = UploadFile(filename=file.filename, file=BytesIO(file_bytes))

    file_url = await blob_service.upload_file(upload_stream, blob_name)

    new_case_file = CaseFile(
        case_id=new_case.id, file_name=file.filename, blob_url=file_url
    )
    db.add(new_case_file)
    db.commit()
    db.refresh(new_case_file)

    AuditService.log_event(
        db, new_case.id, "file_uploaded", f"Uploaded file: {new_case_file.file_name}"
    )

    extraction_result = {}
    validation_result = {}
    risk_result = {}
    decision_result = {}

    if case_type.lower() == "invoice":
        doc_service = DocumentIntelligenceService()
        extraction_result = doc_service.extract_invoice_data(file_bytes)

        AuditService.log_event(
            db, new_case.id, "extraction_completed", "Invoice extraction completed"
        )

        decision_graph = build_decision_graph()

        graph_result = decision_graph.invoke(
            {
                "case_id": new_case.id,
                "case_type": new_case.case_type,
                "extracted_data": extraction_result,
                "trace": [],
            }
        )

        GraphStateService.save_state(
            db=db,
            case_id=new_case.id,
            state_payload=graph_result,
        )

        AuditService.log_event(
            db,
            new_case.id,
            "graph_state_persisted",
            f"Graph state persisted with workflow_status={graph_result.get('workflow_status')}",
        )

        validation_result = graph_result.get("validation_result", {})
        risk_result = graph_result.get("risk_result", {})
        decision_result = graph_result.get("decision_result", {})
        graph_trace = graph_result.get("trace", [])
        requires_human_review = graph_result.get("requires_human_review", False)

        AuditService.log_event(
            db,
            new_case.id,
            "validation_completed",
            f"Validation result: {validation_result}",
        )

        AuditService.log_event(db, new_case.id, "risk_scored", f"Risk result: {risk_result}")

        AuditService.log_event(
            db, new_case.id, "decision_graph_completed", f"Graph trace: {graph_trace}"
        )

        if requires_human_review:
            AuditService.log_event(
                db,
                new_case.id,
                "human_review_required",
                "Decision graph routed case to human review checkpoint",
            )

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

        AuditService.log_event(
            db,
            new_case.id,
            "case_status_updated",
            f"Case moved to status={new_case.status}, stage={new_case.current_stage}",
        )

        decision_record = Decision(
            case_id=new_case.id,
            outcome=decision_result["decision"],
            reason=decision_result["reason"],
        )
        db.add(decision_record)
        db.commit()
        db.refresh(decision_record)

        AuditService.log_event(
            db,
            new_case.id,
            "decision_recorded",
            f"Decision recorded: {decision_record.outcome}",
        )

        if decision_result["decision"] == "escalate":
            review_task = ReviewTask(case_id=new_case.id, status="pending")
            db.add(review_task)
            db.commit()
            db.refresh(review_task)

            AuditService.log_event(
                db,
                new_case.id,
                "review_task_created",
                f"Review task created with status={review_task.status}",
            )

        n8n_result = {}

        n8n_service = N8NService()
        n8n_payload = {
            "event_type": "case_decision_created",
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
            "risk_reasons": risk_result.get("reasons", []),
            "review_task_created": decision_result["decision"] == "escalate",
            "timestamp": str(decision_record.decided_at),
        }
        n8n_result = await n8n_service.send_decision_event(n8n_payload)

        AuditService.log_event(
            db, new_case.id, "n8n_notified", f"n8n webhook result: {n8n_result}"
        )

        for field_name, field_data in extraction_result.get("fields", {}).items():
            field_value = field_data.get("value")
            confidence = field_data.get("confidence")

            normalized_amount = None
            normalized_currency = None

            if field_name in ["InvoiceTotal", "SubTotal"]:
                parsed_value = field_value

                if isinstance(field_value, str):
                    try:
                        parsed_value = ast.literal_eval(field_value)
                    except (ValueError, SyntaxError):
                        parsed_value = field_value

                if isinstance(parsed_value, dict):
                    normalized_amount = parsed_value.get("amount")
                    normalized_currency = parsed_value.get("currencyCode")
                else:
                    amount_value = getattr(parsed_value, "amount", None)
                    currency_code = getattr(parsed_value, "currency_code", None)

                    if currency_code is None:
                        currency_code = getattr(parsed_value, "currencyCode", None)

                    normalized_amount = amount_value
                    normalized_currency = currency_code

            if field_name in ["InvoiceTotal", "SubTotal"] and (
                normalized_amount is not None or normalized_currency is not None
            ):
                if normalized_amount is not None:
                    db.add(
                        ExtractedField(
                            case_id=new_case.id,
                            field_name=f"{field_name}Amount",
                            field_value=str(normalized_amount),
                            confidence=confidence,
                        )
                    )

                if normalized_currency is not None:
                    db.add(
                        ExtractedField(
                            case_id=new_case.id,
                            field_name=f"{field_name}CurrencyCode",
                            field_value=str(normalized_currency),
                            confidence=confidence,
                        )
                    )
            else:
                db.add(
                    ExtractedField(
                        case_id=new_case.id,
                        field_name=field_name,
                        field_value=(
                            str(field_value) if field_value is not None else None
                        ),
                        confidence=confidence,
                    )
                )

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


@router.post("/cases/{case_id}/review")
async def review_case(
    case_id: int,
    action: str = Form(...),
    reviewer_name: str = Form(...),
    comment: str = Form(None),
    db: Session = Depends(get_db),
):
    return await ReviewService.process_review_action(
        db=db,
        case_id=case_id,
        action=action,
        reviewer_name=reviewer_name,
        comment=comment,
    )


@router.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.id.desc()).all()

    return [
        {
            "id": case.id,
            "case_type": case.case_type,
            "submitter_name": case.submitter_name,
            "submitter_email": case.submitter_email,
            "status": case.status,
            "current_stage": case.current_stage,
            "created_at": case.created_at,
            "updated_at": case.updated_at,
        }
        for case in cases
    ]


@router.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
):
    return AnalyticsService.get_summary(db)


@router.get("/analytics/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
):
    return AnalyticsService.get_recent_activity(db)


@router.get("/cases/{case_id}")
def get_case_detail(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_files = db.query(CaseFile).filter(CaseFile.case_id == case_id).all()
    extracted_fields = (
        db.query(ExtractedField).filter(ExtractedField.case_id == case_id).all()
    )
    decisions = (
        db.query(Decision)
        .filter(Decision.case_id == case_id)
        .order_by(Decision.id.desc())
        .all()
    )
    audit_events = (
        db.query(AuditEvent)
        .filter(AuditEvent.case_id == case_id)
        .order_by(AuditEvent.id.desc())
        .all()
    )
    review_task = db.query(ReviewTask).filter(ReviewTask.case_id == case_id).first()

    return {
        "case": {
            "id": case.id,
            "case_type": case.case_type,
            "submitter_name": case.submitter_name,
            "submitter_email": case.submitter_email,
            "status": case.status,
            "current_stage": case.current_stage,
            "created_at": case.created_at,
            "updated_at": case.updated_at,
        },
        "files": [
            {
                "id": f.id,
                "file_name": f.file_name,
                "blob_url": f.blob_url,
            }
            for f in case_files
        ],
        "extracted_fields": [
            {
                "id": field.id,
                "field_name": field.field_name,
                "field_value": field.field_value,
                "confidence": field.confidence,
            }
            for field in extracted_fields
        ],
        "decisions": [
            {
                "id": d.id,
                "outcome": d.outcome,
                "reason": d.reason,
                "decided_at": d.decided_at,
            }
            for d in decisions
        ],
        "audit_events": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "event_detail": event.event_detail,
                "created_at": event.created_at,
            }
            for event in audit_events
        ],
        "review_task": (
            {
                "id": review_task.id,
                "case_id": review_task.case_id,
                "assigned_to": review_task.assigned_to,
                "status": review_task.status,
                "reviewer_comment": review_task.reviewer_comment,
                "created_at": review_task.created_at,
                "resolved_at": review_task.resolved_at,
            }
            if review_task
            else None
        ),
    }

@router.get("/cases/{case_id}/graph-state")
def get_case_graph_state(
    case_id: int,
    db: Session = Depends(get_db),
):
    graph_state = GraphStateService.get_latest_state(
        db=db,
        case_id=case_id,
    )

    if not graph_state:
        raise HTTPException(
            status_code=404,
            detail="No graph state found for this case",
        )

    return {
        "id": graph_state.id,
        "case_id": graph_state.case_id,
        "workflow_status": graph_state.workflow_status,
        "current_stage": graph_state.current_stage,
        "trace": graph_state.trace,
        "state_payload": graph_state.state_payload,
        "created_at": graph_state.created_at,
        "updated_at": graph_state.updated_at,
    }

@router.post("/cases/{case_id}/assign")
async def assign_review_task(
    case_id: int,
    reviewer_name: str = Form(...),
    db: Session = Depends(get_db),
):
    return await ReviewService.assign_reviewer(
        db=db,
        case_id=case_id,
        reviewer_name=reviewer_name,
    )
