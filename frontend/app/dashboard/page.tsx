"use client";

import { useEffect, useState } from "react";

type AnalyticsSummary = {
  total_cases: number;
  approved_cases: number;
  rejected_cases: number;
  pending_review_cases: number;
  awaiting_information_cases: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
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
      label: "Total Cases",
      value: summary.total_cases,
      description: "All finance cases processed by the platform",
    },
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
      label: "Awaiting Information",
      value: summary.awaiting_information_cases,
      description: "Cases paused pending more information",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
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

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-4xl font-bold">{card.value}</p>
              <p className="mt-3 text-sm leading-5 text-slate-400">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">Operational Summary</h2>
                <p className="mt-3 text-slate-300">
                This dashboard converts backend workflow data into an executive view
                of finance operations. It gives reviewers and managers immediate
                visibility into workload, decisions, bottlenecks, and cases needing
                attention.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">Quick Navigation</h2>

                <div className="mt-4 space-y-3">
                <a
                    href="/dashboard"
                    className="block rounded-xl border border-slate-700 p-4 transition hover:border-emerald-400"
                >
                    <p className="font-medium">Executive Dashboard</p>
                    <p className="text-sm text-slate-400">
                    Monitor operations performance and workflow metrics
                    </p>
                </a>

                <a
                    href="/cases"
                    className="block rounded-xl border border-slate-700 p-4 transition hover:border-emerald-400"
                >
                    <p className="font-medium">Review Queue</p>
                    <p className="text-sm text-slate-400">
                    Review escalated cases and reviewer assignments
                    </p>
                </a>
                </div>
            </div>
            </section>
      </div>
    </main>
  );
}