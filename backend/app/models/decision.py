from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.db.base import Base


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    outcome = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    decided_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)