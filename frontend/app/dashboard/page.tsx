"use client";

import { useEffect, useState } from "react";

type AnalyticsSummary = {
  total_cases: number;
  approved_cases: number;
  rejected_cases: number;
  pending_review_cases: number;
  awaiting_information_cases: number;
  overdue_review_cases: number;
  approval_rate: number;
  rejection_rate: number;
  escalation_rate: number;
  pending_review_tasks: number;
  resolved_review_tasks: number;
  assigned_review_tasks: number;
  unassigned_review_tasks: number;
};

type RecentActivity = {
  id: number;
  case_id: number;
  event_type: string;
  event_detail: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("http://127.0.0.1:8000/analytics/summary");

        if (!res.ok) {
          throw new Error("Failed to load analytics summary");
        }

        const data = await res.json();
        setSummary(data);
        
        const activityRes = await fetch(
          "http://127.0.0.1:8000/analytics/recent-activity"
        );

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData);
        }

      } catch (err) {
        setError("Could not load dashboard analytics.");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  const cards = [
    {
      label: "Approved",
      value: summary.approved_cases,
      description: "Cases approved automatically or by reviewers",
    },
    {
      label: "Rejected",
      value: summary.rejected_cases,
      description: "Cases rejected after validation or review",
    },
    {
      label: "Pending Review",
      value: summary.pending_review_cases,
      description: "Cases waiting for human review",
    },
    {
      label: "Resolved Reviews",
      value: summary.resolved_review_tasks,
      description: "Human review tasks completed by reviewers",
    },
    {
      label: "Approval Rate",
      value: `${summary.approval_rate}%`,
      description: "Percentage of cases approved by the workflow",
    },
    {
      label: "Rejection Rate",
      value: `${summary.rejection_rate}%`,
      description: "Percentage of cases rejected by validation or review",
    },
    {
      label: "Escalation Rate",
      value: `${summary.escalation_rate}%`,
      description: "Percentage of cases routed to human review",
    },
    {
      label: "Review Tasks",
      value: summary.pending_review_tasks,
      description: "Open human review tasks requiring attention",
    },
    {
      label: "Awaiting Information",
      value: summary.awaiting_information_cases,
      description: "Cases paused pending more information",
    }, 
    {
      label: "Assigned Reviews",
      value: summary.assigned_review_tasks,
      description: "Pending review tasks with assigned ownership",
    },
    {
      label: "Unassigned Reviews",
      value: summary.unassigned_review_tasks,
      description: "Pending review tasks without reviewer ownership",
    },
    {
      label: "Overdue Reviews",
      value: summary.overdue_review_cases,
      description: "Pending review tasks older than 48 hours",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Autonomous Finance Operations Copilot
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Executive Operations Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Real-time overview of invoice processing, workflow decisions, human
              review status, and operational throughput.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 shadow-lg min-w-[220px]">
            <p className="text-sm text-slate-400">
              Total Cases
            </p>

            <p className="mt-2 text-4xl font-bold">
              {summary.total_cases}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              All finance cases processed by the platform
            </p>
          </div>
        </div>

        <div className="my-8 border-t border-slate-800" />

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
            >
              <p
                className={`text-sm ${
                  card.label === "Overdue Reviews"
                    ? "text-amber-400 font-medium"
                    : "text-slate-400"
                }`}
              >
                {card.label}
              </p>
              <p className="mt-3 text-4xl font-bold">{card.value}</p>
              <p className="mt-3 text-sm leading-5 text-slate-400">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Operational Summary</h2>
              <p className="mt-3 text-slate-300">
                This dashboard converts backend workflow data into an executive
                view of finance operations. It gives reviewers and managers
                immediate visibility into workload, decisions, bottlenecks, and
                cases needing attention.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h2 className="text-xl font-semibold">Reviewer Operations Summary</h2>

              <p className="mt-4 text-slate-300">
                Human review workload is currently tracking{" "}
                <span className="font-semibold text-white">
                  {summary.pending_review_tasks}
                </span>{" "}
                open review tasks, with{" "}
                <span className="font-semibold text-white">
                  {summary.assigned_review_tasks}
                </span>{" "}
                assigned and{" "}
                <span className="font-semibold text-white">
                  {summary.unassigned_review_tasks}
                </span>{" "}
                still missing ownership.
              </p>

              <p className="mt-4 text-slate-300">
                Immediate attention required:{" "}
                <span className="font-semibold text-amber-400">
                  {summary.overdue_review_cases}
                </span>{" "}
                overdue reviews are currently outside SLA.
              </p>

              <a
                href="/reviews"
                className="mt-5 inline-flex rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
              >
                Open Reviewer Work Queue
              </a>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Quick Navigation</h2>

              <div className="mt-4 space-y-3">
                <a
                  href="/cases"
                  className="block rounded-xl border border-slate-700 p-4 transition hover:border-emerald-400"
                >
                  <p className="font-medium">All Cases</p>
                  <p className="text-sm text-slate-400">
                    Browse every submitted case across all workflow states
                  </p>
                </a>

                <a
                  href="/reviews"
                  className="block rounded-xl border border-slate-700 p-4 transition hover:border-emerald-400"
                >
                  <p className="font-medium">Reviewer Work Queue</p>
                  <p className="text-sm text-slate-400">
                    Manage pending reviews, ownership, overdue work, and triage
                  </p>
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Recent Operational Activity
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest workflow, review, automation, and audit events from the
                platform.
              </p>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No recent activity found.
                </p>
              ) : (
                recentActivity.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          Case #{event.case_id} —{" "}
                          {event.event_type.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {event.event_detail || "No event detail provided"}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500">
                        {event.created_at}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
  }