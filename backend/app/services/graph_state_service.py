import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.graph_state import GraphState


class GraphStateService:
    @staticmethod
    def _make_json_safe(value: Any):
        try:
            json.dumps(value)
            return value
        except TypeError:
            if isinstance(value, dict):
                return {
                    str(key): GraphStateService._make_json_safe(item)
                    for key, item in value.items()
                }

            if isinstance(value, list):
                return [GraphStateService._make_json_safe(item) for item in value]

            if isinstance(value, tuple):
                return [GraphStateService._make_json_safe(item) for item in value]

            return str(value)

    @staticmethod
    def save_state(
        db: Session,
        case_id: int,
        state_payload: dict,
    ) -> GraphState:
        safe_payload = GraphStateService._make_json_safe(state_payload)
        safe_trace = GraphStateService._make_json_safe(
            safe_payload.get("trace", [])
        )

        graph_state = GraphState(
            case_id=case_id,
            workflow_status=safe_payload.get("workflow_status", "running"),
            current_stage=safe_payload.get("current_stage"),
            state_payload=safe_payload,
            trace=safe_trace,
        )

        db.add(graph_state)
        db.commit()
        db.refresh(graph_state)

        return graph_state

    @staticmethod
    def get_latest_state(
        db: Session,
        case_id: int,
    ) -> GraphState | None:
        return (
            db.query(GraphState)
            .filter(GraphState.case_id == case_id)
            .order_by(GraphState.created_at.desc())
            .first()
        )