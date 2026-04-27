from datetime import datetime

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


        # 6. Subtotal vs invoice total mismatch
        subtotal_value = self._extract_amount(subtotal)
        if (
            subtotal_value is not None
            and amount_value is not None
            and abs(subtotal_value - amount_value) > 1
        ):
            score += 25
            reasons.append("Subtotal and invoice total mismatch")

        # 7. Future-dated invoice
        if invoice_date:
            try:
                if hasattr(invoice_date, "date"):
                    invoice_dt = invoice_date.date()
                else:
                    invoice_date_str = str(invoice_date).strip()

                    if "T" in invoice_date_str:
                        invoice_dt = datetime.fromisoformat(invoice_date_str).date()
                    else:
                        invoice_dt = datetime.strptime(invoice_date_str[:10], "%Y-%m-%d").date()

                if invoice_dt > datetime.utcnow().date():
                    score += 25
                    reasons.append("Invoice date is in the future")
            except Exception:
                reasons.append(f"Could not parse invoice date for risk check: {invoice_date}")

        # 8. Suspicious vendor name patterns
        if vendor_name:
            suspicious_keywords = ["test vendor", "demo company", "fake ltd"]
            if any(keyword in str(vendor_name).lower() for keyword in suspicious_keywords):
                 score += 25
                 reasons.append("Vendor name appears suspicious")

        risk_level = self._risk_level(score)

        return {
            "score": score,
            "risk_level": risk_level,
            "reasons": reasons
        }

    def _extract_amount(self, invoice_total):
        if invoice_total is None:
            return None

        # dict form, e.g. {"amount": 122500.0, "currencyCode": "ZAR"}
        if isinstance(invoice_total, dict):
            amount = invoice_total.get("amount")
            if amount is not None:
                try:
                    return float(amount)
                except (ValueError, TypeError):
                    return None

        # Azure object form
        if hasattr(invoice_total, "amount"):
            return invoice_total.amount

        # numeric form
        if isinstance(invoice_total, (int, float)):
            return float(invoice_total)

        # string fallback
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