from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from datetime import datetime

from app.db.base import Base


class ReviewTask(Base):
    __tablename__ = "review_tasks"

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)

    assigned_to = Column(String, nullable=True)

    status = Column(String, default="pending")  # pending, in_review, resolved

    reviewer_comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)