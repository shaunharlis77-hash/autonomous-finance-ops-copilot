class ValidationService:
    REQUIRED_FIELDS = [
        "VendorName",
        "InvoiceDate",
        "InvoiceTotal"
    ]

    def validate_invoice(self, extracted_data: dict) -> dict:
        missing_fields = []
        fields = extracted_data.get("fields", {})

        for field in self.REQUIRED_FIELDS:
            field_data = fields.get(field)

            if not field_data or not field_data.get("value"):
                missing_fields.append(field)

        is_valid = len(missing_fields) == 0

        return {
            "is_valid": is_valid,
            "missing_fields": missing_fields
        }