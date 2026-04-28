from typing import Any, Dict, List, Optional, TypedDict


class DecisionGraphState(TypedDict, total=False):
    case_id: int
    case_type: str

    extracted_data: Dict[str, Any]
    validation_result: Dict[str, Any]
    risk_result: Dict[str, Any]
    decision_result: Dict[str, Any]

    current_stage: str
    workflow_status: str

    requires_human_review: bool
    review_status: Optional[str]
    reviewer_decision: Optional[str]
    reviewer_comment: Optional[str]

    retry_count: int
    trace: List[str]
    errors: Optional[List[str]]