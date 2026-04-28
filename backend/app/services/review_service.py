from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.review_task import ReviewTask
from app.models.decision import Decision
from app.services.audit_service import AuditService
from app.services.n8n_service import N8NService
from app.workflows.decision_nodes import resume_after_review_node
from app.services.graph_state_service import GraphStateService


class ReviewService:
    ALLOWED_ACTIONS = ["approve", "reject", "request_info"]

    @staticmethod
    async def process_review_action(
        db: Session,
        case_id: int,
        action: str,
        reviewer_name: str,
        comment: str | None = None,
    ):
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        review_task = (
            db.query(ReviewTask)
            .filter(ReviewTask.case_id == case_id, ReviewTask.status == "pending")
            .first()
        )
        if not review_task:
            raise HTTPException(status_code=404, detail="Pending review task not found")

        if action not in ReviewService.ALLOWED_ACTIONS:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid action. Must be one of: "
                    f"{', '.join(ReviewService.ALLOWED_ACTIONS)}"
                ),
            )

        decision_reason = ReviewService._apply_review_outcome(
            case=case,
            action=action,
            reviewer_name=reviewer_name,
            comment=comment,
        )

        review_task.status = "resolved"
        review_task.assigned_to = reviewer_name
        review_task.reviewer_comment = comment

        decision_record = Decision(
            case_id=case.id,
            outcome=action,
            reason=decision_reason,
        )
        db.add(decision_record)

        db.commit()
        db.refresh(case)
        db.refresh(review_task)
        db.refresh(decision_record)

        AuditService.log_event(
            db,
            case.id,
            "review_completed",
            (
                f"Reviewer {reviewer_name} completed review with action={action}. "
                f"Comment: {comment or 'No comment provided'}"
            ),
        )

        resume_state = resume_after_review_node(
            {
                "case_id": case.id,
                "case_type": case.case_type,
                "current_stage": case.current_stage,
                "workflow_status": "paused_for_human_review",
                "requires_human_review": True,
                "review_status": "pending",
                "reviewer_decision": action,
                "reviewer_comment": comment,
                "trace": [],
            }
        )

        GraphStateService.save_state(
            db=db,
            case_id=case.id,
            state_payload=resume_state,
        )

        AuditService.log_event(
            db,
            case.id,
            "decision_graph_resumed",
            (
                "Graph resumed and state persisted after human review. "
                f"Reviewer decision={action}. "
                f"Workflow status={resume_state.get('workflow_status')}. "
                f"Trace={resume_state.get('trace')}"
            ),
        )

        n8n_result = await ReviewService._notify_n8n(
            case=case,
            action=action,
            reviewer_name=reviewer_name,
            comment=comment,
            decision_record=decision_record,
        )

        AuditService.log_event(
            db,
            case.id,
            "n8n_notified",
            f"n8n webhook result: {n8n_result}",
        )

        return {
            "message": "Review action recorded successfully",
            "case": {
                "id": case.id,
                "status": case.status,
                "current_stage": case.current_stage,
            },
            "review_task": {
                "id": review_task.id,
                "status": review_task.status,
                "assigned_to": review_task.assigned_to,
                "reviewer_comment": review_task.reviewer_comment,
            },
            "decision_record": {
                "id": decision_record.id,
                "outcome": decision_record.outcome,
                "reason": decision_record.reason,
                "decided_at": decision_record.decided_at,
            },
        }

    @staticmethod
    def _apply_review_outcome(
        case: Case,
        action: str,
        reviewer_name: str,
        comment: str | None,
    ) -> str:
        if action == "approve":
            case.status = "approved"
            case.current_stage = "completed"
            return comment or f"Case approved by reviewer {reviewer_name}"

        if action == "reject":
            case.status = "rejected"
            case.current_stage = "closed"
            return comment or f"Case rejected by reviewer {reviewer_name}"

        if action == "request_info":
            case.status = "awaiting_information"
            case.current_stage = "waiting_on_submitter"
            return comment or f"More information requested by reviewer {reviewer_name}"

        raise HTTPException(status_code=400, detail="Invalid review action")

    @staticmethod
    async def _notify_n8n(
        case: Case,
        action: str,
        reviewer_name: str,
        comment: str | None,
        decision_record: Decision,
    ):
        n8n_service = N8NService()

        n8n_payload = {
            "event_type": "case_review_completed",
            "case_id": case.id,
            "case_type": case.case_type,
            "submitter_name": case.submitter_name,
            "submitter_email": case.submitter_email,
            "status": case.status,
            "current_stage": case.current_stage,
            "review_action": action,
            "reviewer_name": reviewer_name,
            "review_comment": comment,
            "decision_id": decision_record.id,
            "timestamp": str(decision_record.decided_at),
        }

        return await n8n_service.send_decision_event(n8n_payload)

    @staticmethod
    async def assign_reviewer(
        db: Session,
        case_id: int,
        reviewer_name: str,
    ):
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        review_task = (
            db.query(ReviewTask)
            .filter(ReviewTask.case_id == case_id, ReviewTask.status == "pending")
            .first()
        )
        if not review_task:
            raise HTTPException(status_code=404, detail="Pending review task not found")

        review_task.assigned_to = reviewer_name
        db.commit()
        db.refresh(review_task)

        AuditService.log_event(
            db,
            case.id,
            "review_task_assigned",
            f"Review task assigned to {reviewer_name}",
        )

        n8n_result = await ReviewService._notify_assignment(
            case=case,
            review_task=review_task,
            reviewer_name=reviewer_name,
        )

        AuditService.log_event(
            db,
            case.id,
            "n8n_notified",
            f"n8n webhook result: {n8n_result}",
        )

        return {
            "message": "Review task assigned successfully",
            "review_task": {
                "id": review_task.id,
                "case_id": review_task.case_id,
                "assigned_to": review_task.assigned_to,
                "status": review_task.status,
            },
        }

    @staticmethod
    async def _notify_assignment(
        case: Case,
        review_task: ReviewTask,
        reviewer_name: str,
    ):
        reviewer_email_map = {
            "Shaun": "shaunharlis77@gmail.com",
        }

        assigned_to_email = reviewer_email_map.get(
            reviewer_name,
            "shaunharlis77@gmail.com",
        )

        n8n_service = N8NService()

        n8n_payload = {
            "event_type": "review_task_assigned",
            "case_id": case.id,
            "case_type": case.case_type,
            "submitter_name": case.submitter_name,
            "submitter_email": case.submitter_email,
            "status": case.status,
            "current_stage": case.current_stage,
            "assigned_to": reviewer_name,
            "assigned_to_email": assigned_to_email,
            "review_task_id": review_task.id,
        }

        return await n8n_service.send_decision_event(n8n_payload)
