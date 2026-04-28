from sqlalchemy.orm import Session

from app.models.graph_state import GraphState


class GraphStateService:
    @staticmethod
    def save_state(
        db: Session,
        case_id: int,
        state_payload: dict,
    ) -> GraphState:
        graph_state = GraphState(
            case_id=case_id,
            workflow_status=state_payload.get("workflow_status", "running"),
            current_stage=state_payload.get("current_stage"),
            state_payload=state_payload,
            trace=state_payload.get("trace", []),
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