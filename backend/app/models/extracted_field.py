from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func

from app.db.base import Base


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_value = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)