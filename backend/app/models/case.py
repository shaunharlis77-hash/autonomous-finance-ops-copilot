from sqlalchemy import Column, DateTime, Integer, String, func

from app.db.base import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_type = Column(String(50), nullable=False)
    submitter_name = Column(String(100), nullable=True)
    submitter_email = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="new")
    current_stage = Column(String(100), nullable=False, default="uploaded")
    created_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now(), nullable=False)