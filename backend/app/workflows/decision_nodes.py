from app.services.validation import ValidationService
from app.services.risk_scoring import RiskScoringService
from app.services.decision import DecisionService
from app.workflows.graph_state import DecisionGraphState


def validate_fields_node(state: DecisionGraphState) -> DecisionGraphState:
    validator = ValidationService()

    validation_result = validator.validate_invoice(state.get("extracted_data", {}))

    trace = state.get("trace", [])
    trace.append("validate_fields_node completed")

    return {
        **state,
        "validation_result": validation_result,
        "current_stage": "validated",
        "trace": trace,
    }


def score_risk_node(state: DecisionGraphState) -> DecisionGraphState:
    risk_service = RiskScoringService()

    risk_result = risk_service.score_invoice(
        state.get("extracted_data", {}),
        state.get("validation_result", {}),
    )

    trace = state.get("trace", [])
    trace.append(
        f"score_risk_node completed: score={risk_result.get('score')}, level={risk_result.get('risk_level')}"
    )

    return {
        **state,
        "risk_result": risk_result,
        "current_stage": "risk_scored",
        "trace": trace,
    }


def make_decision_node(state: DecisionGraphState) -> DecisionGraphState:
    decision_service = DecisionService()

    decision_result = decision_service.decide_invoice(
        state.get("validation_result", {}),
        state.get("risk_result", {}),
    )

    requires_human_review = decision_result.get("decision") == "escalate"

    trace = state.get("trace", [])
    trace.append(
        f"make_decision_node completed: decision={decision_result.get('decision')}"
    )

    return {
        **state,
        "decision_result": decision_result,
        "requires_human_review": requires_human_review,
        "current_stage": "decision_made",
        "trace": trace,
    }


def human_review_required_node(state: DecisionGraphState) -> DecisionGraphState:
    trace = state.get("trace", [])
    trace.append("human_review_required")

    state["current_stage"] = "human_review"
    state["workflow_status"] = "paused_for_human_review"
    state["requires_human_review"] = True
    state["review_status"] = "pending"

    return state


def finalize_case_node(state: DecisionGraphState) -> DecisionGraphState:
    trace = state.get("trace", [])
    trace.append("workflow_finalized")

    state["current_stage"] = "finalized"
    state["workflow_status"] = "completed"
    state["requires_human_review"] = False

    return state


def decision_router(state: DecisionGraphState) -> str:
    decision = state.get("decision_result", {}).get("decision")

    if decision == "escalate":
        return "human_review"

    return "finalize"


def resume_after_review_node(
    state: DecisionGraphState,
) -> DecisionGraphState:
    trace = state.get("trace", [])
    trace.append("workflow_resumed_after_review")

    reviewer_decision = state.get("reviewer_decision", "approve")

    state["workflow_status"] = "resumed"
    state["review_status"] = "resolved"
    state["requires_human_review"] = False

    state["decision_result"] = {
        "outcome": reviewer_decision,
        "source": "human_review",
    }

    state["current_stage"] = "post_review_resolution"

    return state
