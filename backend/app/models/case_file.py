from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.db.base import Base


class CaseFile(Base):
    __tablename__ = "case_files"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    blob_url = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=False), server_default=func.now(), nullable=False)