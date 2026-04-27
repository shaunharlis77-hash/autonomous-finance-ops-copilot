"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Case = {
  id: number;
  case_type: string;
  submitter_name: string;
  submitter_email: string;
  status: string;
  current_stage: string;
  created_at: string;
};

function getCasePriority(caseItem: Case) {
  const createdAt = new Date(caseItem.created_at);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  if (caseItem.status === "pending_review" && ageHours >= 48) {
    return {
      label: "Overdue",
      className: "border-red-500/40 bg-red-500/10 text-red-300",
    };
  }

  if (caseItem.status === "pending_review") {
    return {
      label: "High Priority",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    };
  }

  if (caseItem.status === "awaiting_information") {
    return {
      label: "Waiting Info",
      className: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    };
  }

  if (caseItem.status === "approved") {
    return {
      label: "Completed",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (caseItem.status === "rejected") {
    return {
      label: "Closed",
      className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
    };
  }

  return {
    label: "Normal",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  };
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/cases")
      .then((res) => res.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cases:", err);
        setLoading(false);
      });
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesStatus = statusFilter === "all" ? true : c.status === statusFilter;
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        c.submitter_name.toLowerCase().includes(search) ||
        c.submitter_email.toLowerCase().includes(search) ||
        c.case_type.toLowerCase().includes(search) ||
        String(c.id).includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [cases, statusFilter, searchTerm]);

  const totalCases = cases.length;
  const approvedCases = cases.filter((c) => c.status === "approved").length;
  const rejectedCases = cases.filter((c) => c.status === "rejected").length;
  const pendingReviewCases = cases.filter((c) => c.status === "pending_review").length;
  const overdueCases = cases.filter((c) => {
    const ageHours =
      (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);

    return c.status === "pending_review" && ageHours >= 48;
  }).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>Loading cases...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Finance Operations
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Case Review Queue
            </h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Monitor submitted finance cases, prioritize overdue reviews, and manage
              workflow status across the operation.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
          >
            Back to Dashboard
          </a>
        </div>

        <section className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total Cases", totalCases],
            ["Pending Review", pendingReviewCases],
            ["Overdue", overdueCases],
            ["Approved", approvedCases],
            ["Rejected", rejectedCases],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-4xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="Search by case ID, submitter, email, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending_review">Pending Review</option>
              <option value="awaiting_information">Awaiting Information</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Submitter</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((c) => {
                  const priority = getCasePriority(c);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      className="cursor-pointer border-b border-slate-800 transition hover:bg-slate-800/60"
                    >
                      <td className="px-5 py-4 font-medium">#{c.id}</td>
                      <td className="px-5 py-4">{c.case_type}</td>
                      <td className="px-5 py-4">
                        <p>{c.submitter_name}</p>
                        <p className="text-xs text-slate-500">{c.submitter_email}</p>
                      </td>
                      <td className="px-5 py-4 capitalize">
                        {formatStatus(c.status)}
                      </td>
                      <td className="px-5 py-4 capitalize">
                        {formatStatus(c.current_stage)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${priority.className}`}
                        >
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}