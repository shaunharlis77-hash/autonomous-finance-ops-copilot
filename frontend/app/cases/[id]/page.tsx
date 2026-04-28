"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type CaseDetail = {
  case: {
    id: number;
    case_type: string;
    submitter_name: string;
    submitter_email: string;
    status: string;
    current_stage: string;
    created_at: string;
    updated_at: string;
  };
  files: {
    id: number;
    file_name: string;
    blob_url: string;
  }[];
  extracted_fields: {
    id: number;
    field_name: string;
    field_value: string;
    confidence: number | null;
  }[];
  decisions: {
    id: number;
    outcome: string;
    reason: string;
    decided_at: string;
  }[];
  audit_events: {
    id: number;
    event_type: string;
    event_detail: string;
    created_at: string;
  }[];
  review_task: {
    id: number;
    case_id: number;
    assigned_to: string | null;
    status: string;
    reviewer_comment: string | null;
    created_at: string;
    resolved_at: string | null;
  } | null;
  graph_state?: {
  workflow_status: string;
  current_stage: string;
  trace: string[];
  state_payload?: {
    decision_result?: {
      source?: string;
      outcome?: string;
    };
  };
};
};

const priorityFieldOrder = [
  "VendorName",
  "InvoiceId",
  "InvoiceDate",
  "DueDate",
  "SubTotalAmount",
  "InvoiceTotalAmount",
];

const expectedCurrency = "ZAR";

function formatFieldLabel(fieldName: string) {
  const labelMap: Record<string, string> = {
    VendorName: "Vendor Name",
    InvoiceId: "Invoice Id",
    InvoiceDate: "Invoice Date",
    DueDate: "Due Date",
    SubTotalAmount: "Sub Total",
    InvoiceTotalAmount: "Invoice Total",
  };

  return (
    labelMap[fieldName] ||
    fieldName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getCaseAge(createdAt: string) {
  const ageHours = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  );

  if (ageHours < 24) {
    return `${ageHours}h old`;
  }

  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays}d old`;
}

function getPriorityBadge(status: string, createdAt: string) {
  const ageHours =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  if (status === "pending_review" && ageHours >= 48) {
    return {
      label: "Overdue Review",
      className: "border-red-500/40 bg-red-500/10 text-red-300",
    };
  }

  if (status === "pending_review") {
    return {
      label: "High Priority",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    };
  }

  if (status === "awaiting_information") {
    return {
      label: "Awaiting Information",
      className: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    };
  }

  if (status === "approved") {
    return {
      label: "Completed",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (status === "rejected") {
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

function getStatusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("approved")) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized.includes("rejected")) {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  if (normalized.includes("pending")) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  if (normalized.includes("awaiting")) {
    return "border-blue-500/40 bg-blue-500/10 text-blue-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function getWorkflowStateLabel(status: string, stage: string) {
  if (status === "approved" || stage === "completed") {
    return "Completed";
  }

  if (status === "rejected" || stage === "closed") {
    return "Closed";
  }

  if (status === "awaiting_information") {
    return "Awaiting Information";
  }

  if (status === "pending_review" || stage === "review") {
    return "Human Review";
  }

  return formatStatus(stage || status);
}

function isReviewOverdue(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();

  const hoursElapsed = (now - created) / (1000 * 60 * 60);

  return hoursElapsed >= 24;
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllFields, setShowAllFields] = useState(false);

  const [reviewerName, setReviewerName] = useState("Shaun");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const [assigneeName, setAssigneeName] = useState("Shaun");
  const [assigningTask, setAssigningTask] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const fetchCaseDetail = async () => {
    if (!caseId) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/cases/${caseId}`);
      const data = await res.json();
      setCaseDetail(data);
    } catch (err) {
      console.error("Error fetching case detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [caseId]);

  const invoiceTotalCurrencyField = caseDetail?.extracted_fields.find(
    (field) => field.field_name === "InvoiceTotalCurrencyCode"
  );

  const subTotalCurrencyField = caseDetail?.extracted_fields.find(
    (field) => field.field_name === "SubTotalCurrencyCode"
  );

  const extractedCurrency =
    invoiceTotalCurrencyField?.field_value?.toUpperCase() ||
    subTotalCurrencyField?.field_value?.toUpperCase() ||
    null;

  const showCurrencyWarning =
    !!extractedCurrency && extractedCurrency !== expectedCurrency;

  const getCombinedAmountDisplay = (
    amountFieldName: string,
    currencyFieldName: string
  ) => {
    if (!caseDetail) return "—";

    const amountField = caseDetail.extracted_fields.find(
      (field) => field.field_name === amountFieldName
    );
    const currencyField = caseDetail.extracted_fields.find(
      (field) => field.field_name === currencyFieldName
    );

    const amount = amountField?.field_value;
    const currency = currencyField?.field_value;

    if (!amount && !currency) return "—";
    if (!currency) return amount || "—";
    if (!amount) return currency || "—";

    return `${currency} ${amount}`;
  };

  const priorityFields = useMemo(() => {
    if (!caseDetail) return [];

    return priorityFieldOrder
      .map((fieldName) =>
        caseDetail.extracted_fields.find((field) => field.field_name === fieldName)
      )
      .filter(Boolean) as CaseDetail["extracted_fields"];
  }, [caseDetail]);

  const otherFields = useMemo(() => {
    if (!caseDetail) return [];

    return caseDetail.extracted_fields.filter(
      (field) =>
        !priorityFieldOrder.includes(field.field_name) &&
        field.field_name !== "SubTotalCurrencyCode" &&
        field.field_name !== "InvoiceTotalCurrencyCode"
    );
  }, [caseDetail]);

  const handleReviewAction = async (
    e: FormEvent,
    action: "approve" | "reject" | "request_info"
  ) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMessage("");

    try {
      const formData = new FormData();
      formData.append("action", action);
      formData.append("reviewer_name", reviewerName);
      formData.append("comment", reviewComment);

      const res = await fetch(`http://127.0.0.1:8000/cases/${caseId}/review`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit review action");
      }

      setReviewMessage(`Review action submitted successfully: ${action}`);
      setReviewComment("");
      await fetchCaseDetail();
    } catch (err) {
      console.error("Review action error:", err);
      setReviewMessage("Failed to submit review action.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAssignTask = async (e: FormEvent) => {
    e.preventDefault();
    setAssigningTask(true);
    setAssignmentMessage("");

    try {
      const formData = new FormData();
      formData.append("reviewer_name", assigneeName);

      const res = await fetch(`http://127.0.0.1:8000/cases/${caseId}/assign`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to assign review task");
      }

      setAssignmentMessage(`Task assigned to ${assigneeName}`);
      await fetchCaseDetail();
    } catch (err) {
      console.error("Assign task error:", err);
      setAssignmentMessage("Failed to assign review task.");
    } finally {
      setAssigningTask(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading case detail...</div>;
  }

  if (!caseDetail) {
    return <div className="p-6">Case not found.</div>;
  }

  const priorityBadge = getPriorityBadge(
    caseDetail.case.status,
    caseDetail.case.created_at
  );

  const caseAge = getCaseAge(caseDetail.case.created_at);

  const reviewIsOverdue =
    caseDetail.review_task?.status === "pending" &&
    caseDetail.review_task?.created_at &&
    isReviewOverdue(caseDetail.review_task.created_at);

  const reviewerLocked =
    caseDetail.review_task?.status === "pending" &&
    !!caseDetail.review_task?.assigned_to;

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
                Finance Operations
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">
                  Case #{caseDetail.case.id}
                </h1>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${priorityBadge.className}`}
                >
                  {priorityBadge.label}
                </span>
              </div>

              <p className="mt-3 text-slate-300">
                {caseDetail.case.case_type} submitted by{" "}
                <span className="font-medium">
                  {caseDetail.case.submitter_name}
                </span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadge(
                    caseDetail.case.status
                  )}`}
                >
                  Status: {formatStatus(caseDetail.case.status)}
                </span>
                <span>•</span>
                <span>Stage: {formatStatus(caseDetail.case.current_stage)}</span>
                <span>•</span>
                <span>{caseAge}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href="/dashboard"
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
              >
                Dashboard
              </a>

              <a
                href="/cases"
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
              >
                All Cases
              </a>

              <a
                href="/reviews"
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
              >
                Reviewer Queue
              </a>
            </div>
          </div>

          {showCurrencyWarning && (
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-5">
              <p className="text-lg font-semibold text-yellow-300">
                Currency extraction warning
              </p>
              <p className="mt-1 text-sm text-yellow-200">
                Extracted currency is <strong>{extractedCurrency}</strong>, but this
                case may require manual verification. Expected demo currency is{" "}
                <strong>{expectedCurrency}</strong>.
              </p>
              <p className="mt-2 text-xs text-yellow-200/80">
                Model confidence does not guarantee correctness.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">Operational Context</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Submitter Email</p>
                <p className="font-medium">{caseDetail.case.submitter_email}</p>
              </div>

              <div>
                <p className="text-slate-400">Current Workflow State</p>
                <span className="inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                  {getWorkflowStateLabel(
                    caseDetail.case.status,
                    caseDetail.case.current_stage
                  )}
                </span>
              </div>

              <div>
                <p className="text-slate-400">Operational Priority</p>
                <p className="font-medium">{priorityBadge.label}</p>
              </div>

              <div>
                <p className="text-slate-400">Case Age</p>
                <p className="font-medium">{caseAge}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">Graph Orchestration State</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Workflow Status</p>
                <p className="font-medium">
                  {caseDetail.graph_state?.workflow_status || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Current Graph Stage</p>
                <p className="font-medium">
                  {caseDetail.graph_state?.current_stage || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Reviewer Decision Source</p>
                <p className="font-medium">
                  {caseDetail.graph_state?.state_payload?.decision_result?.source || "System"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Execution Trace</p>
                <div className="space-y-2">
                  {caseDetail.graph_state?.trace?.length ? (
                    caseDetail.graph_state.trace.map(
                      (step: string, index: number) => (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                        >
                          {step}
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-400">
                      No graph trace available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">Review Ownership</h2>
            {reviewIsOverdue && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-300">
                  SLA Warning: Review overdue
                </p>
                <p className="mt-1 text-sm text-red-200/80">
                  This review task has been pending for more than 24 hours and should be
                  prioritized.
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Review Status</p>
                <p className="font-medium">
                  {formatStatus(caseDetail.review_task?.status || "pending")}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Assigned Reviewer</p>
                <p className="font-medium">
                  {caseDetail.review_task?.assigned_to || "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Review Created</p>
                <p className="font-medium">
                  {caseDetail.review_task?.created_at
                    ? new Date(caseDetail.review_task.created_at).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">Workflow Resolution Summary</h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400">Reviewer Final Action</p>
                <p className="font-medium">
                  {caseDetail.graph_state?.state_payload?.decision_result?.outcome ||
                    "System decision"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Resolution Source</p>
                <p className="font-medium">
                  {caseDetail.graph_state?.state_payload?.decision_result?.source ===
                  "human_review"
                    ? "Resolved through human review"
                    : "Resolved automatically by workflow"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Reviewer Comment</p>
                <p className="font-medium">
                  {caseDetail.review_task?.reviewer_comment || "No reviewer comment recorded"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {caseDetail.review_task && caseDetail.review_task.status === "pending" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Assign Reviewer</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Assign ownership before a reviewer takes action.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleAssignTask}>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Assign To</label>
                  <input
                    type="text"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    disabled={reviewerLocked}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={assigningTask || reviewerLocked}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  {reviewerLocked ? "Reviewer Assigned" : "Assign Task"}
                </button>

                {reviewerLocked && (
                  <p className="text-sm text-slate-400">
                    Ownership is locked because this task is already assigned to{" "}
                    <span className="font-medium text-slate-200">
                      {caseDetail.review_task?.assigned_to}
                    </span>
                    .
                  </p>
                )}

                {assignmentMessage && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                    <p className="text-sm font-medium text-emerald-300">
                      {assignmentMessage}
                    </p>
                  </div>
                )}
              </form>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Reviewer Actions</h2>
              <p className="mt-1 text-sm text-slate-400">
                Resolve this case directly from the UI.
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Reviewer Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add reviewer notes..."
                  className="min-h-[140px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={(e) => handleReviewAction(e, "approve")}
                  disabled={submittingReview}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  Approve
                </button>

                <button
                  type="button"
                  onClick={(e) => handleReviewAction(e, "reject")}
                  disabled={submittingReview}
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={(e) => handleReviewAction(e, "request_info")}
                  disabled={submittingReview}
                  className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
                >
                  Request Info
                </button>
              </div>

              {reviewMessage && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-300">
                    {reviewMessage}
                  </p>
                </div>
              )}
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-semibold">Key Extracted Fields</h2>

          {priorityFields.length === 0 ? (
            <p>No extracted fields found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priorityFields.map((field) => (
                <div key={field.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">
                    {formatFieldLabel(field.field_name)}
                  </p>

                  <p className="font-medium break-words">
                    {field.field_name === "SubTotalAmount"
                      ? getCombinedAmountDisplay(
                        "SubTotalAmount",
                        "SubTotalCurrencyCode"
                      )
                      : field.field_name === "InvoiceTotalAmount"
                        ? getCombinedAmountDisplay(
                          "InvoiceTotalAmount",
                          "InvoiceTotalCurrencyCode"
                        )
                        : field.field_value || "—"}

                    {(field.field_name === "SubTotalAmount" ||
                      field.field_name === "InvoiceTotalAmount") &&
                      extractedCurrency &&
                      extractedCurrency !== expectedCurrency && (
                        <span className="ml-2 text-xs text-yellow-300 border border-yellow-500 rounded px-2 py-0.5">
                          Verify currency
                        </span>
                      )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Confidence: {field.confidence ?? "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {otherFields.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAllFields(!showAllFields)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400"
              >
                {showAllFields
                  ? "Hide other extracted fields"
                  : "Show other extracted fields"}
              </button>

              {showAllFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {otherFields.map((field) => (
                    <div key={field.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-sm text-slate-400">
                        {formatFieldLabel(field.field_name)}
                      </p>
                      <p className="font-medium break-words">
                        {field.field_value || "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Confidence: {field.confidence ?? "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-semibold">Files</h2>
          {caseDetail.files.length === 0 ? (
            <p>No files found.</p>
          ) : (
            caseDetail.files.map((file) => (
              <div key={file.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p><strong>File Name:</strong> {file.file_name}</p>
                <a
                  href={file.blob_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline-offset-4 hover:underline"
                >
                  Open File
                </a>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-semibold">Decision History</h2>
          {caseDetail.decisions.length === 0 ? (
            <p>No decisions found.</p>
          ) : (
            <div className="space-y-2">
              {caseDetail.decisions.map((decision) => (
                <div key={decision.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p><strong>Outcome:</strong> {decision.outcome}</p>
                  <p><strong>Reason:</strong> {decision.reason}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(decision.decided_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-semibold">Operational Audit Timeline</h2>

          <p className="text-sm text-slate-400 mb-4">
            Complete workflow trace including validation, decisions, review actions,
            automation events, and system orchestration history.
          </p>

          {caseDetail.audit_events.length === 0 ? (
            <p>No audit events found.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {caseDetail.audit_events.map((event) => (
                <div
                  key={event.id}
                  className="border border-slate-800 rounded-xl bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {formatStatus(event.event_type)}
                      </p>

                      <p className="mt-1 text-sm text-slate-400 break-words">
                        {event.event_detail || "No event detail provided"}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}