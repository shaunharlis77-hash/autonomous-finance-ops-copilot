class DecisionService:
    def decide_invoice(self, validation_result: dict, risk_result: dict) -> dict:
        if not validation_result.get("is_valid", False):
            return {
                "decision": "reject",
                "reason": "Invoice failed validation checks"
            }

        risk_level = risk_result.get("risk_level", "low")

        if risk_level in ["medium", "high"]:
            return {
                "decision": "escalate",
                "reason": f"Invoice assessed as {risk_level} risk"
            }

        return {
            "decision": "approve",
            "reason": "Invoice passed validation and is low risk"
        }