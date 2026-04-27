from sqlalchemy.orm import Session

from app.models.case import Case


class AnalyticsService:
    @staticmethod
    def get_summary(db: Session):
        total_cases = db.query(Case).count()

        approved_cases = db.query(Case).filter(Case.status == "approved").count()

        rejected_cases = db.query(Case).filter(Case.status == "rejected").count()

        pending_review_cases = (
            db.query(Case).filter(Case.status == "pending_review").count()
        )

        awaiting_information_cases = (
            db.query(Case).filter(Case.status == "awaiting_information").count()
        )

        return {
            "total_cases": total_cases,
            "approved_cases": approved_cases,
            "rejected_cases": rejected_cases,
            "pending_review_cases": pending_review_cases,
            "awaiting_information_cases": awaiting_information_cases,
        }