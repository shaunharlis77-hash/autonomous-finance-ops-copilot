from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, func

from app.db.base import Base


class GraphState(Base):
    __tablename__ = "graph_states"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)

    workflow_status = Column(String(100), nullable=False, default="running")
    current_stage = Column(String(100), nullable=True)

    state_payload = Column(JSON, nullable=False)
    trace = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=False),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )