"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ReviewQueueItem = {
  review_task: {
    id: number;
    case_id: number;
    assigned_to: string | null;
    status: string;
    reviewer_comment: string | null;
    created_at: string;
    resolved_at: string | null;
  };
  case: {
    id: number;
    case_type: string;
    submitter_name: string;
    submitter_email: string;
    status: string;
    current_stage: string;
    created_at: string;
  };
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getReviewAge(createdAt: string) {
  const ageHours = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  );

  if (ageHours < 24) return `${ageHours}h old`;

  return `${Math.floor(ageHours / 24)}d old`;
}

function isOverdue(createdAt: string) {
  const ageHours =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  return ageHours >= 24;
}

export default function ReviewsPage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const router = useRouter();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/reviews")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching review queue:", err);
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;

    if (filter === "overdue") {
      return items.filter(
        (item) =>
          item.review_task.status === "pending" &&
          isOverdue(item.review_task.created_at)
      );
    }

    if (filter === "unassigned") {
      return items.filter(
        (item) =>
          item.review_task.status === "pending" &&
          !item.review_task.assigned_to
      );
    }

    return items.filter((item) => item.review_task.status === filter);
  }, [items, filter]);

  const pendingCount = items.filter(
    (item) => item.review_task.status === "pending"
  ).length;

  const resolvedCount = items.filter(
    (item) => item.review_task.status === "resolved"
  ).length;

  const overdueCount = items.filter(
    (item) =>
      item.review_task.status === "pending" &&
      isOverdue(item.review_task.created_at)
  ).length;

  const unassignedCount = items.filter(
    (item) =>
      item.review_task.status === "pending" &&
      !item.review_task.assigned_to
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>Loading review queue...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Human Review Operations
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Reviewer Work Queue
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Focused queue for finance cases requiring human review,
              ownership, escalation handling, and final reviewer decisions.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="my-8 border-t border-slate-800" />

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Pending Reviews</p>
            <p className="mt-3 text-4xl font-bold">{pendingCount}</p>
            <p className="mt-3 text-sm text-slate-400">
              Open review tasks awaiting resolution
            </p>
          </div>
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Unassigned Reviews</p>
            <p className="mt-3 text-4xl font-bold">{unassignedCount}</p>
            <p className="mt-3 text-sm text-slate-400">
              Pending reviews without ownership
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Resolved Reviews</p>
            <p className="mt-3 text-4xl font-bold">{resolvedCount}</p>
            <p className="mt-3 text-sm text-slate-400">
              Reviews completed by human reviewers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm font-medium text-amber-400">
              Overdue Reviews
            </p>
            <p className="mt-3 text-4xl font-bold">{overdueCount}</p>
            <p className="mt-3 text-sm text-slate-400">
              Pending reviews older than 24 hours
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Review Tasks</h2>
              <p className="mt-1 text-sm text-slate-400">
                Prioritized human review queue with ownership and SLA visibility.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="overdue">Overdue</option>
              <option value="unassigned">Unassigned</option>
              <option value="all">All Reviews</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-400">
                No review tasks found for this filter.
              </p>
            ) : (
              filteredItems.map((item) => {
                const overdue =
                  item.review_task.status === "pending" &&
                  isOverdue(item.review_task.created_at);

                return (
                  <button
                    key={item.review_task.id}
                    type="button"
                    onClick={() => router.push(`/cases/${item.case.id}`)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-emerald-400"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            Case #{item.case.id} — {item.case.case_type}
                          </p>

                          {overdue && (
                            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                              Overdue
                            </span>
                          )}

                          {overdue && item.review_task.assigned_to && (
                            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                                High Priority
                            </span>
                            )}

                          {!item.review_task.assigned_to &&
                            item.review_task.status === "pending" && (
                              <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                                Unassigned
                              </span>
                            )}
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          Submitted by {item.case.submitter_name} ·{" "}
                          {item.case.submitter_email}
                        </p>

                        <p className="mt-2 text-sm text-slate-300">
                          Reviewer:{" "}
                          <span className="font-medium">
                            {item.review_task.assigned_to || "Unassigned"}
                          </span>
                        </p>
                      </div>

                      <div className="text-sm text-slate-400 md:text-right">
                        <p className="capitalize">
                          Status: {formatStatus(item.review_task.status)}
                        </p>
                        <p>{getReviewAge(item.review_task.created_at)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}