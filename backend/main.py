from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models.case import Case  # noqa: F401
from app.models.case_file import CaseFile  # noqa: F401
from app.models.extracted_field import ExtractedField  # noqa: F401
from app.models.decision import Decision  # noqa: F401
from app.models.audit_event import AuditEvent  # noqa: F401
from app.models.review_task import ReviewTask  # noqa: F401
from app.models.graph_state import GraphState  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Autonomous Finance Operations Copilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "app": "Autonomous Finance Operations Copilot API",
        "environment": settings.environment,
    }
