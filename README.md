# Autonomous Finance Operations Copilot

AI-powered finance workflow platform for invoice processing, risk scoring, human review, and audit traceability.

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
flowchart TD
    U[User / Submitter] --> FE[Next.js Frontend]

    FE --> DASH[Dashboard]
    FE --> CASES[Case Detail + Audit Timeline]
    FE --> REVIEWS[Reviewer Queue]

    FE --> API[FastAPI Backend]

    API --> BLOB[Azure Blob Storage]
    API --> DI[Azure Document Intelligence]
    API --> DB[(PostgreSQL)]

    API --> ENGINE[Validation + Risk Scoring + Decision Engine]
    ENGINE --> GRAPH[LangGraph Decision Workflow]

    GRAPH --> N8N[n8n Workflow Automation]

    N8N --> EMAIL[Gmail Notifications]
    N8N --> CALLBACK[Backend Callback API]

    CALLBACK --> AUDIT[Audit Event Logging]
    AUDIT --> DB

    DB --> FE
```

---

## Workflow Automation (n8n)

```mermaid
flowchart TD
    START[Case processed by backend] --> SWITCH{Decision / Event Type}

    SWITCH -->|Approved| APPROVED[Approved Case]
    SWITCH -->|Rejected| REJECTED[Rejected Case]
    SWITCH -->|Escalated| ESCALATED[Escalated Case]
    SWITCH -->|Reviewer Assigned| ASSIGNED[Reviewer Assignment]
    SWITCH -->|Review Approved| REVIEW_APPROVED[Reviewer Approved]
    SWITCH -->|Review Rejected| REVIEW_REJECTED[Reviewer Rejected]
    SWITCH -->|Request More Info| MORE_INFO[Request More Info]

    APPROVED --> PAYMENT[Shared Payment Workflow]
    REVIEW_APPROVED --> PAYMENT

    PAYMENT --> PAY1[Log payment workflow initiated]
    PAY1 --> PAY2[Request finance approval]
    PAY2 --> PAY3[Send finance approval email]
    PAY3 --> PAY4[Wait for finance authorization]
    PAY4 --> PAY5[Log finance authorization granted]
    PAY5 --> PAY6[Log payment completed]
    PAY6 --> PAY7[Send payment confirmation to submitter]

    REJECTED --> REJECTION[Shared Rejection Workflow]
    REVIEW_REJECTED --> RLOG[Log review rejected]
    RLOG --> REJECTION

    REJECTION --> REJ1[Log rejection workflow started]
    REJ1 --> REJ2[Send rejection email to submitter]
    REJ2 --> REJ3[Log rejection notification sent]

    ESCALATED --> ESC1[Log escalation workflow started]
    ESC1 --> ESC2[Send reviewer assignment alert]
    ESC2 --> ESC3[Log escalation notification sent]
    ESC3 --> ESC4[Wait before assignment check]
    ESC4 --> ESC5[Check case review status]
    ESC5 --> ESC6{Still pending review?}
    ESC6 -->|Yes| ESC7[Send assignment reminder]
    ESC7 --> ESC8[Log escalation reminder sent]
    ESC6 -->|No| ESC9[No further action]

    ASSIGNED --> A1[Log reviewer assignment completed]
    A1 --> A2[Send reviewer assignment email]
    A2 --> A3[Log reviewer notification sent]

    MORE_INFO --> M1[Log request for more info]
    M1 --> M2[Send more info request to submitter]
    M2 --> M3[Log more info request sent]
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

## What This Project Demonstrates

- AI-assisted business workflow design  
- Human-in-the-loop decision systems  
- Stateful workflow orchestration  
- Integration of backend services with automation platforms  
- Audit-driven system design for operational transparency  

---

## Future Improvements

- Role-based access control  
- Policy configuration system  
- Event-driven workflow triggers  
- Production deployment and monitoring  

---

## Setup

See detailed setup instructions:

- Backend: `./backend`
- Frontend: `./frontend`

---

## Notes

This is a production-style portfolio project designed to demonstrate enterprise-grade workflow automation and AI-assisted decision systems.

---

## System in Action

### Case Audit Timeline
![Case Detail](./screenshots/case-detail.png)
