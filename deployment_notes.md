# Deployment Notes

## Overview

The **Autonomous Finance Operations Copilot** is currently implemented as a **local/cloud hybrid portfolio system**.

The application runs locally during development while integrating with real cloud services and workflow automation platforms to simulate a production-ready enterprise finance operations environment.

This architecture was intentionally designed to demonstrate realistic enterprise patterns rather than a simplified demo application.

---

## Core Integrated Services

The system currently integrates with the following services:

- PostgreSQL
- Azure Blob Storage
- Azure Document Intelligence
- LangGraph
- n8n Workflow Automation
- Email Automation via n8n Webhooks

These components work together to support document ingestion, validation, decisioning, workflow orchestration, escalation handling, and audit reporting.

---

## Local Development Deployment

### Backend Deployment

#### Run Backend

```bash
cd backend
uvicorn main:app --reload
```

#### Backend Base URL

```text
http://127.0.0.1:8000
```

#### Common Backend Endpoints

| Endpoint | Purpose |
|---|---|
| `/health` | Service health check |
| `/docs` | FastAPI Swagger documentation |
| `/analytics/summary` | Executive reporting and operational metrics |
| `/cases` | Case management APIs |
| `/reviews` | Human review task APIs |

---

### Frontend Deployment

#### Run Frontend

```bash
cd frontend
npm run dev
```

#### Frontend Base URL

```text
http://localhost:3000
```

#### Main Frontend Pages

| Route | Purpose |
|---|---|
| `/dashboard` | Executive operations dashboard |
| `/cases` | Case management view |
| `/reviews` | Human review queue |
| `/cases/{id}` | Individual case investigation page |

---

## Required Configuration

### Environment Variables

Use the `.env.example` file as the reference for all required environment variables.

This includes configuration for:

- database connection
- Azure services
- storage access
- workflow webhooks
- orchestration services

---

### Required External Services

The following services must be configured before running the project:

- PostgreSQL database
- Azure Blob Storage account
- Azure Document Intelligence resource
- n8n production webhook URL

---

### Security Notice

**Never commit real credentials, API keys, or secrets to GitHub.**

Always use:

- `.env` files
- secret managers
- deployment platform environment variables

for secure credential handling.

---

## Production Deployment Considerations

### Full Production Deployment Requirements

A production-grade deployment would require:

- hosted PostgreSQL database
- deployed FastAPI backend
- deployed Next.js frontend
- secure secret management
- production n8n webhook configuration
- authentication and user access controls
- role-based reviewer permissions
- centralized logging and monitoring
- backup and recovery strategy for workflow and audit data

Additional enterprise hardening would also include:

- API rate limiting
- secure file upload controls
- encryption at rest and in transit
- operational alerting
- compliance audit retention policies

---

## Current Deployment Status

### Present State

The system is **not currently deployed as a full production SaaS platform**.

It is intentionally built as a **production-style portfolio system** designed to demonstrate architecture, engineering capability, and enterprise readiness.

---

### Demonstrated Capabilities

This project successfully showcases:

- AI-powered document extraction
- deterministic validation and financial risk controls
- human-in-the-loop exception handling
- persistent workflow orchestration using LangGraph
- workflow automation via n8n
- audit trail persistence and compliance visibility
- executive operational reporting and analytics

---

### Portfolio Positioning

This project is designed to represent how modern finance operations teams can move from manual invoice handling toward:

**AI-assisted autonomous operations with controlled human oversight**

while maintaining:

- traceability
- governance
- operational efficiency
- enterprise-grade reliability

This makes the project suitable for demonstrating real-world AI engineering, workflow orchestration, and business process automation capabilities during technical interviews and portfolio reviews.