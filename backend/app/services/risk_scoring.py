class RiskScoringService:
    def score_invoice(self, extracted_data: dict, validation_result: dict) -> dict:
        score = 0
        reasons = []

        fields = extracted_data.get("fields", {})

        invoice_total = fields.get("InvoiceTotal", {}).get("value")
        subtotal = fields.get("SubTotal", {}).get("value")
        vendor_name = fields.get("VendorName", {}).get("value")
        invoice_date = fields.get("InvoiceDate", {}).get("value")

        # 1. Failed validation
        if not validation_result.get("is_valid", False):
            score += 40
            reasons.append("Invoice failed completeness validation")

        # 2. Missing subtotal
        if not subtotal:
            score += 10
            reasons.append("Subtotal is missing")

        # 3. Missing vendor name
        if not vendor_name:
            score += 15
            reasons.append("Vendor name is missing")

        # 4. Missing invoice date
        if not invoice_date:
            score += 15
            reasons.append("Invoice date is missing")

        # 5. High invoice amount
        amount_value = self._extract_amount(invoice_total)
        if amount_value is not None and amount_value > 100000:
            score += 25
            reasons.append("Invoice total exceeds high-value threshold")

        risk_level = self._risk_level(score)

        return {
            "score": score,
            "risk_level": risk_level,
            "reasons": reasons
        }

    def _extract_amount(self, invoice_total):
        if invoice_total is None:
            return None

        # Azure may return a currency object
        if hasattr(invoice_total, "amount"):
            return invoice_total.amount

        # fallback for numeric/string values
        if isinstance(invoice_total, (int, float)):
            return float(invoice_total)

        try:
            return float(str(invoice_total).replace(",", "").strip())
        except (ValueError, TypeError):
            return None

    def _risk_level(self, score: int) -> str:
        if score >= 60:
            return "high"
        elif score >= 25:
            return "medium"
        return "low"