# Deployment Notes

## Overview

The **Autonomous Finance Operations Copilot** is implemented as a **local + cloud hybrid portfolio system**.

The application runs locally during development while integrating with real cloud services and workflow automation platforms to simulate a production-ready enterprise finance operations environment.

This architecture is intentionally designed to demonstrate realistic enterprise patterns rather than a simplified demo application.

---

## Core Integrated Services

The system integrates with the following components:

- PostgreSQL
- Azure Blob Storage
- Azure Document Intelligence
- LangGraph (workflow orchestration)
- n8n (workflow automation)

These services work together to support document ingestion, validation, decisioning, workflow orchestration, escalation handling, and audit reporting.

---

## Local Development Setup

### Backend

#### Run Backend

```bash
cd backend
uvicorn main:app --reload
```

#### Base URL

```
http://127.0.0.1:8000
```

#### Key Endpoints

| Endpoint | Purpose |
|--------|--------|
| `/health` | Service health check |
| `/docs` | FastAPI Swagger documentation |
| `/analytics/summary` | Executive reporting and metrics |
| `/cases` | Case management APIs |
| `/reviews` | Human review task APIs |

---

### Frontend

#### Run Frontend

```bash
cd frontend
npm run dev
```

#### Base URL

```
http://localhost:3000
```

#### Main Pages

| Route | Purpose |
|------|--------|
| `/dashboard` | Executive operations dashboard |
| `/cases` | Case management view |
| `/reviews` | Human review queue |
| `/cases/{id}` | Individual case investigation |

---

## Configuration

### Environment Variables

Use the `.env.example` file as the reference for required configuration.

This includes:

- database connection
- Azure services
- storage access
- workflow webhooks
- orchestration settings

---

### Required External Services

The following must be configured:

- PostgreSQL database
- Azure Blob Storage account
- Azure Document Intelligence resource
- n8n webhook URL

---

### Security Notice

**Never commit credentials, API keys, or secrets to GitHub.**

Use:

- `.env` files  
- environment variables  
- secret management tools  

for secure configuration.

---

## Production Deployment Considerations

A full production deployment would require:

- hosted PostgreSQL database
- deployed FastAPI backend
- deployed Next.js frontend
- secure secret management
- production n8n workflows
- authentication and access control
- role-based reviewer permissions
- centralized logging and monitoring
- backup and recovery strategy

Additional enterprise hardening:

- API rate limiting  
- secure file upload validation  
- encryption (in transit + at rest)  
- operational alerting  
- audit retention policies  

---

## Current Deployment Status

The system is **not deployed as a full SaaS platform**.

It is intentionally built as a **production-style portfolio system** to demonstrate:

- architecture design
- workflow orchestration
- enterprise patterns
- real-world system thinking

---

## Demonstrated Capabilities

This project showcases:

- AI-powered document extraction
- deterministic validation and risk controls
- human-in-the-loop exception handling
- persistent workflow orchestration (LangGraph)
- workflow automation (n8n)
- audit trail and compliance visibility
- operational analytics and reporting

---

## Portfolio Positioning

This project demonstrates how finance operations can move from manual processing toward:

**AI-assisted, workflow-driven operations with controlled human oversight**

while maintaining:

- traceability  
- governance  
- operational efficiency  
- enterprise-grade reliability  

It is designed to support technical interviews and portfolio reviews for AI engineering, workflow automation, and backend system design roles.