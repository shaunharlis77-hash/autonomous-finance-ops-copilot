import httpx

from app.core.config import settings


class N8NService:
    async def send_decision_event(self, payload: dict) -> dict:
        if not settings.n8n_webhook_url:
            return {
                "sent": False,
                "reason": "N8N webhook URL not configured"
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.n8n_webhook_url,
                json=payload
            )

        return {
            "sent": response.status_code >= 200 and response.status_code < 300,
            "status_code": response.status_code,
            "response_text": response.text
        }