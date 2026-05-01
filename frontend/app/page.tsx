import Link from "next/link";

const workflowHighlights = [
  "AI-assisted invoice extraction and validation",
  "Risk scoring with approve, reject, and escalate decisions",
  "Human-in-the-loop review for escalated cases",
  "n8n workflow automation with email approvals and reminders",
  "Audit-ready timeline for every operational action",
];

const platformStats = [
  { label: "Decision Paths", value: "3", detail: "Approve, reject, escalate" },
  { label: "Workflow Engine", value: "n8n", detail: "Business process automation" },
  { label: "Review Model", value: "HITL", detail: "Human-in-the-loop control" },
  { label: "Traceability", value: "Audit", detail: "End-to-end event history" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Autonomous Finance Operations Copilot
            </p>
          </div>

          <div className="hidden gap-3 md:flex">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            >
              Dashboard
            </Link>
            <Link
              href="/cases"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            >
              Cases
            </Link>
            <Link
              href="/reviews"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            >
              Reviews
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              AI decisioning · Human review · n8n automation · Audit traceability
            </div>

            <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              AI-powered finance workflows with human control and audit traceability.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A finance operations platform for invoice processing, risk scoring,
              reviewer escalation, payment authorization, and end-to-end workflow
              traceability.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Built with Azure Document Intelligence, FastAPI, PostgreSQL, and n8n workflow automation.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
              >
                Open Dashboard
              </Link>

              <Link
                href="/cases"
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
              >
                View Cases
              </Link>

              <Link
                href="/reviews"
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
              >
                Reviewer Queue
              </Link>

              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-800 px-5 py-3 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-300"
              >
                API Docs
              </a>
            </div>
          </div>

          <div className="p-3 bg-slate-900/40 rounded-3xl">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Workflow Snapshot
              </p>

              <div className="mt-5 space-y-4">
                {[
                  ["1", "Invoice uploaded", "Document Intelligence extracts invoice fields."],
                  ["2", "Risk decision generated", "Validation and scoring determine approve, reject, or escalate."],
                  ["3", "n8n workflow triggered", "Business process automation sends alerts, reminders, and approval emails."],
                  ["4", "Audit trail updated", "Every operational action is written back to the case timeline."],
                ].map(([step, title, detail]) => (
                  <div
                    key={step}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-300">
                        {step}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-slate-500">
          Platform Overview
        </p>

        <section className="grid gap-4 pb-10 md:grid-cols-4">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">What this system demonstrates</h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {workflowHighlights.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-slate-950 p-4">
                <span className="text-emerald-400">✓</span>
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}