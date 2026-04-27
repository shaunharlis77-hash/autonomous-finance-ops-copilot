from typing import Any, Dict, List, Optional, TypedDict


class DecisionGraphState(TypedDict, total=False):
    case_id: int
    case_type: str

    extracted_data: Dict[str, Any]
    validation_result: Dict[str, Any]
    risk_result: Dict[str, Any]
    decision_result: Dict[str, Any]

    current_stage: str
    requires_human_review: bool

    trace: List[str]
    errors: Optional[List[str]]