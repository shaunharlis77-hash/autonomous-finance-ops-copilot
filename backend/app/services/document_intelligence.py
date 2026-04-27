from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

from app.core.config import settings


class DocumentIntelligenceService:
    def __init__(self):
        self.client = DocumentIntelligenceClient(
            endpoint=settings.azure_document_intelligence_endpoint,
            credential=AzureKeyCredential(settings.azure_document_intelligence_key)
        )

    def _normalize_currency_code(self, field, extracted_currency_code):
        raw_content = (getattr(field, "content", "") or "").strip()

        # Stronger South African Rand heuristic:
        # if displayed amount starts with "R", treat it as ZAR
        if raw_content.startswith("R"):
            return "ZAR"

        return extracted_currency_code

    def _safe_field_value(self, field):
        if not field:
            return None

        candidate_attrs = [
            "value_string",
            "value_date",
            "value_time",
            "value_phone_number",
            "value_number",
            "value_integer",
            "value_selection_mark",
            "value_signature",
            "value_currency",
            "value_address",
            "value_boolean",
            "value_country_region",
            "value_array",
            "value_object",
        ]

        for attr in candidate_attrs:
            if hasattr(field, attr):
                value = getattr(field, attr)
                if value is not None:
                    if attr == "value_currency":
                        try:
                            amount = getattr(value, "amount", None)
                            currency_code = getattr(value, "currency_code", None)

                            currency_code = self._normalize_currency_code(
                                field,
                                currency_code
                            )

                            return {
                                "amount": amount,
                                "currencyCode": currency_code,
                            }
                        except Exception:
                            return str(value)

                    return value

        if hasattr(field, "content") and field.content is not None:
            return field.content

        return None

    def extract_invoice_data(self, file_bytes: bytes) -> dict:
        poller = self.client.begin_analyze_document(
            "prebuilt-invoice",
            body=file_bytes
        )
        result = poller.result()

        extracted_fields = {}

        if result.documents:
            document = result.documents[0]
            for field_name, field_value in document.fields.items():
                extracted_fields[field_name] = {
                    "value": self._safe_field_value(field_value),
                    "content": getattr(field_value, "content", None),
                    "confidence": getattr(field_value, "confidence", None),
                }

        return {
            "fields": extracted_fields,
            "page_count": len(result.pages) if getattr(result, "pages", None) else 0,
            "field_names": list(extracted_fields.keys()),
        }