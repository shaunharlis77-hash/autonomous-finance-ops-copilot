# Autonomous Finance Operations Copilot

AI-powered finance workflow platform for document processing, risk scoring, human review, and audit traceability.

Built with FastAPI, PostgreSQL, Azure Document Intelligence, LangGraph, and n8n.

---

## Key Features

- AI-assisted document extraction and validation  
- Deterministic risk scoring and decision engine (approve / reject / escalate)  
- Human-in-the-loop review workflows for escalated cases  
- n8n-based automation for notifications, approvals, and reminders  
- End-to-end audit trail with full workflow traceability  
- Reviewer queue and executive dashboard for operational visibility  

---

## Architecture

```mermaid
flowchart LR
    U[User / Submitter] --> FE[Next.js Frontend]

    FE --> DASH[Dashboard]
    FE --> CASES[Case Detail + Audit Timeline]
    FE --> REVIEWS[Reviewer Queue]

    FE --> API[FastAPI Backend]

    API --> ENGINE[Validation + Risk Scoring + Decision Engine]
    ENGINE --> GRAPH[LangGraph Workflow]

    API --> DI[Azure Document Intelligence]
    API --> BLOB[Azure Blob Storage]

    GRAPH --> N8N[n8n Automation]

    N8N --> EMAIL[Gmail Notifications]
    N8N --> CALLBACK[Backend Callback]

    CALLBACK --> AUDIT[Audit Logging]
    AUDIT --> DB[(PostgreSQL)]

    DB --> FE
```

---

## Workflow Automation (n8n)

```mermaid
flowchart LR
    START[Backend case event] --> DECISION{Decision / Event}

    DECISION -->|Approved| PAYMENT[Payment approval workflow]
    DECISION -->|Rejected| REJECT[Rejection workflow]
    DECISION -->|Escalated| ESC[Escalation workflow]
    DECISION -->|Reviewer assigned| ASSIGN[Reviewer assignment]
    DECISION -->|Request info| INFO[More info request]

    ESC --> REMINDER[Assignment reminder check]
    ESC --> ASSIGN

    ASSIGN --> REVIEW{Reviewer outcome}

    REVIEW -->|Approved| PAYMENT
    REVIEW -->|Rejected| REJECT
    REVIEW -->|More info| INFO

    PAYMENT --> PAY_DONE[Finance authorization + payment completed]
    REJECT --> REJ_DONE[Submitter notified + case closed]
    INFO --> INFO_DONE[Submitter asked for supporting info]
    REMINDER --> AUDIT[Audit timeline updated]
    PAY_DONE --> AUDIT
    REJ_DONE --> AUDIT
    INFO_DONE --> AUDIT
```
---

## End-to-End Flow

1. Invoice uploaded and stored  
2. Azure Document Intelligence extracts structured data  
3. Backend validates and scores risk  
4. Decision engine determines approve, reject, or escalate  
5. LangGraph orchestrates workflow and human review  
6. n8n handles operational workflows (notifications, approvals, reminders)  
7. All actions are logged in an audit timeline  

---

## UI Overview

- Dashboard: operational metrics and case distribution  
- Cases: full audit timeline and workflow state  
- Reviewer Queue: human-in-the-loop decision management  

---

## Tech Stack

- Frontend: Next.js, Tailwind CSS  
- Backend: FastAPI  
- Database: PostgreSQL  
- AI: Azure Document Intelligence  
- Orchestration: LangGraph  
- Automation: n8n  

---

## Future Improvements

- Role-based access control  
- Policy configuration system  
- Event-driven workflow triggers  
- Production deployment and monitoring  

---

## Deployment

See detailed deployment notes:

👉 [Deployment Notes](./docs/deployment_notes.md)

---

## Notes

This is a production-style portfolio project designed to demonstrate enterprise-grade workflow automation and AI-assisted decision systems.

---

## System in Action

### Case Audit Timeline
![Case Detail](screenshots/case_detail.png)

This timeline captures the full lifecycle of a case, including AI decisioning, escalation, reviewer assignment, workflow automation, and final resolution.
