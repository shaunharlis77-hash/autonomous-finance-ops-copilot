from app.workflows.decision_graph import build_decision_graph


sample_extracted_data = {
    "fields": {
        "VendorName": {
            "value": "Apex Office Solutions",
            "confidence": 0.99,
        },
        "InvoiceDate": {
            "value": "2026-04-23",
            "confidence": 0.99,
        },
        "InvoiceTotal": {
            "value": {
                "amount": 122500.00,
                "currencyCode": "ZAR",
            },
            "confidence": 0.99,
        },
        "SubTotal": {
            "value": {
                "amount": 122500.00,
                "currencyCode": "ZAR",
            },
            "confidence": 0.99,
        },
    }
}


graph = build_decision_graph()

initial_state = {
    "case_id": 999,
    "case_type": "invoice",
    "extracted_data": sample_extracted_data,
    "trace": [],
}

result = graph.invoke(initial_state)

print("\n--- GRAPH RESULT ---")
print("Validation:", result.get("validation_result"))
print("Risk:", result.get("risk_result"))
print("Decision:", result.get("decision_result"))
print("Requires human review:", result.get("requires_human_review"))
print("Current stage:", result.get("current_stage"))
print("Trace:", result.get("trace"))