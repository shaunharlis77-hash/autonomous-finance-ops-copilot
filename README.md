# Autonomous Finance Operations Copilot

## Finance Operations Workflow Platform

A production-style AI-assisted finance operations platform that automates invoice and procurement review, applies deterministic validation and risk controls, routes cases through human review when required, persists workflow state, and triggers downstream business actions through workflow automation. :contentReference[oaicite:0]{index=0}

This system is designed to demonstrate enterprise-grade AI engineering principles:

- deterministic AI + rule-based controls
- human-in-the-loop review
- persistent workflow orchestration
- operational auditability
- executive reporting and reviewer ownership visibility

This is **not a chatbot project**.

It is a workflow platform built for controlled financial operations.

---

# Business Problem

Finance teams process large volumes of invoices, procurement requests, and supporting documents that require: :contentReference[oaicite:1]{index=1}

- structured data extraction
- policy validation
- fraud and risk detection
- approval routing
- reviewer assignment
- audit trail preservation
- workflow automation

Manual handling creates:

- delays
- inconsistent decisions
- missing reviewer ownership
- audit gaps
- operational bottlenecks

Traditional automation often lacks:

- explainability
- controlled escalation
- workflow recovery
- reviewer accountability

This platform solves that problem.

---

# Solution Architecture

The system combines deterministic business logic with controlled AI-assisted orchestration. :contentReference[oaicite:2]{index=2}

## Core Flow

```text
Upload → Extraction → Validation → Risk Scoring → Decision → Human Review (if required) → Workflow Resume → Final Resolution → Audit Trail → Downstream Automation
```

---

# Architecture Layers

## Frontend

**Next.js** reviewer and executive operations platform

## Backend

**FastAPI** service layer for orchestration, validation, decisions, and workflow state management

## Database

**PostgreSQL** for case persistence, decisions, review tasks, audit events, and graph state

## AI Extraction

**Azure Document Intelligence** for invoice and procurement field extraction

## Orchestration

**LangGraph** for controlled workflow state transitions and review checkpoints

## Automation

**n8n** for notifications and downstream business actions

---

# Core Features

## Intelligent Document Intake

- invoice upload
- procurement request ingestion
- Azure Blob Storage persistence
- Azure Document Intelligence structured extraction

## Deterministic Validation Layer

- missing field detection
- subtotal validation
- vendor verification signals
- currency verification
- invoice date validation
- future-dated invoice detection

## Risk Scoring Engine

Rule-based operational risk scoring using deterministic finance controls.

### Examples

- failed validation
- missing vendor data
- missing subtotal
- abnormal invoice value
- suspicious invoice date

## Decision Engine

System decisions:

- Approve
- Reject
- Escalate

Escalation automatically creates human review tasks.

## Human Review Operations

- reviewer assignment
- approval / rejection / request info actions
- SLA monitoring
- overdue review tracking
- ownership visibility
- reviewer work queue

## Persistent Workflow Orchestration

- graph pause at human review checkpoint
- persisted graph state
- workflow resume after reviewer action
- execution trace visibility

## Executive Operations Dashboard

- approval / rejection rates
- escalation rates
- reviewer workload
- overdue reviews
- ownership visibility
- operational activity feed

---

# End-to-End Workflow

## Step 1 — Upload

Finance documents are uploaded and stored in Azure Blob Storage.

## Step 2 — Extraction

Azure Document Intelligence extracts structured invoice fields.

## Step 3 — Validation

Business rules validate completeness and policy compliance.

## Step 4 — Risk Scoring

Deterministic scoring identifies operational and fraud risk indicators.

## Step 5 — Decision

System determines:

- approve
- reject
- escalate

## Step 6 — Human Review

Escalated cases enter reviewer assignment and review workflow.

## Step 7 — Workflow Resume

Reviewer decisions are reinjected into the LangGraph orchestration flow.

## Step 8 — Final Resolution

Final business outcome is persisted and fully auditable.

## Step 9 — Automation

n8n triggers downstream operational workflows and notifications.

---

# LangGraph Orchestration Layer

This project uses **LangGraph** to manage controlled workflow state transitions rather than relying on isolated API calls. :contentReference[oaicite:3]{index=3}

## Why LangGraph

Financial operations require:

- deterministic workflow state
- human approval checkpoints
- resumable execution
- auditability
- controlled escalation

Traditional request-response automation is not enough.

LangGraph provides:

- explicit workflow nodes
- conditional routing
- human review pause states
- reviewer decision reinjection
- persistent graph state tracking

## Example Flow

```text
validate_fields
→ score_risk
→ make_decision
→ human_review (pause)
→ reviewer action
→ resume_after_review
→ finalize_case
```

## Persistent Graph State

Graph execution state is stored in PostgreSQL:

- workflow status
- current graph stage
- reviewer decision
- execution trace
- review checkpoint state

This enables:

- workflow recovery
- reviewer traceability
- production-grade orchestration visibility

---

# Human-in-the-Loop Review System

High-risk or uncertain cases do not auto-complete.

They are escalated into controlled reviewer workflows.

## Reviewer Flow

- review task created
- reviewer assignment
- SLA tracking
- overdue detection
- approve / reject / request info actions
- reviewer comments persisted
- final resolution recorded

## Why This Matters

This prevents unsafe autonomous decisioning in finance operations.

**AI assists. Humans remain accountable.**

This is the correct enterprise model.

---

# n8n Automation Layer

n8n handles downstream operational workflows after major decision events.

## Examples

- notify finance teams
- reviewer escalation notifications
- rejected case alerts
- audit follow-up workflows
- approval downstream actions

## Why n8n

This separates workflow automation from application logic.

**The backend decides. n8n executes operational actions.**

This improves:

- maintainability
- operational flexibility
- business workflow visibility

---

# Executive Dashboard

The platform includes an executive operations dashboard for management visibility.

## Dashboard Includes

- total cases
- approval rate
- rejection rate
- escalation rate
- pending review workload
- overdue review tracking
- reviewer ownership visibility
- reviewer workload distribution
- operational activity timeline

---

# Reviewer Queue

A dedicated reviewer work queue provides:

- pending review triage
- high-priority indicators
- overdue warnings
- unassigned review visibility
- direct case access

This turns the project from backend automation into a real operational platform.

---

# Tech Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS

## Backend

- FastAPI
- Python
- SQLAlchemy

## Database

- PostgreSQL

## Cloud + AI

- Azure Blob Storage
- Azure Document Intelligence

## Orchestration + Automation

- LangGraph
- n8n

---

# Local Development Setup

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Backend URL

```text
http://127.0.0.1:8000
```

### Useful Endpoints

- /health
- /docs
- /analytics/summary
- /cases
- /reviews

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

### Frontend URL

```text
http://localhost:3000
```

### Main Pages

- /dashboard
- /cases
- /reviews
- /cases/{id}

---

# Environment Variables

Use:

```text
.env.example
```

for required configuration.

## Required Services

- PostgreSQL
- Azure Blob Storage
- Azure Document Intelligence
- n8n webhook URL

**Do not commit real secrets.**

---

# Production Readiness

This system is currently built as a production-style portfolio platform using real cloud integrations and workflow orchestration. :contentReference[oaicite:4]{index=4}

Production deployment would require:

- hosted PostgreSQL
- deployed backend and frontend
- authentication
- role-based reviewer access
- secure secret management
- production n8n workflows
- centralized monitoring
- workflow backup and recovery

The system is intentionally designed with enterprise deployment patterns in mind.

---

# Future Improvements

Planned future improvements include:

- role-based access control
- reviewer authentication
- Azure-hosted deployment
- CI/CD pipeline
- Dockerized deployment
- approval policy configuration UI
- advanced anomaly detection
- vendor trust scoring
- reviewer performance analytics
- approval SLA reporting