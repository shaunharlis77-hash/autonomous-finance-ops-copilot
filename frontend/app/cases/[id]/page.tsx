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

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Case #{caseDetail.case.id}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Full case review and audit history
          </p>
        </div>

        {showCurrencyWarning && (
          <div className="border border-yellow-500 bg-yellow-500/10 rounded-lg p-4">
            <p className="font-semibold text-yellow-300">
              Currency extraction warning
            </p>
            <p className="text-sm text-yellow-200 mt-1">
              Extracted currency is <strong>{extractedCurrency}</strong>, but this
              case may require manual verification. Expected demo currency is{" "}
              <strong>{expectedCurrency}</strong>.
            </p>
            <p className="text-xs text-yellow-200/80 mt-2">
              Model confidence does not guarantee correctness.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="text-xl font-semibold">Case Summary</h2>
          <p><strong>Type:</strong> {caseDetail.case.case_type}</p>
          <p><strong>Submitter:</strong> {caseDetail.case.submitter_name}</p>
          <p><strong>Email:</strong> {caseDetail.case.submitter_email}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="inline-block border rounded px-2 py-1 text-sm">
              {caseDetail.case.status}
            </span>
          </p>
          <p>
            <strong>Stage:</strong>{" "}
            <span className="inline-block border rounded px-2 py-1 text-sm">
              {caseDetail.case.current_stage}
            </span>
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(caseDetail.case.created_at).toLocaleString()}
          </p>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="text-xl font-semibold">Review Task</h2>
          {caseDetail.review_task ? (
            <>
              <p><strong>Status:</strong> {caseDetail.review_task.status}</p>
              <p>
                <strong>Assigned To:</strong>{" "}
                {caseDetail.review_task.assigned_to || "Unassigned"}
              </p>
              <p>
                <strong>Comment:</strong>{" "}
                {caseDetail.review_task.reviewer_comment || "—"}
              </p>
              <p className="text-sm text-gray-400">
                Created:{" "}
                {new Date(caseDetail.review_task.created_at).toLocaleString()}
              </p>
            </>
          ) : (
            <p>No review task for this case.</p>
          )}
        </div>
      </div>

      {caseDetail.review_task && caseDetail.review_task.status === "pending" && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Assign Reviewer</h3>
              <p className="text-sm text-gray-400 mt-1">
                Assign this review task before taking action.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleAssignTask}>
              <div>
                <label className="block text-sm mb-1">Assign To</label>
                <input
                  type="text"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full bg-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={assigningTask}
                className="border rounded-md px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
              >
                Assign Task
              </button>

              {assignmentMessage && (
                <p className="text-sm text-gray-300">{assignmentMessage}</p>
              )}
            </form>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Reviewer Actions</h2>
            <p className="text-sm text-gray-400 mt-1">
              Resolve this case directly from the UI.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Reviewer Name</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="border rounded-md px-3 py-2 w-full bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Comment</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add reviewer notes..."
                className="border rounded-md px-3 py-2 w-full min-h-[120px] bg-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(e) => handleReviewAction(e, "approve")}
                disabled={submittingReview}
                className="border rounded-md px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
              >
                Approve
              </button>

              <button
                type="button"
                onClick={(e) => handleReviewAction(e, "reject")}
                disabled={submittingReview}
                className="border rounded-md px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                onClick={(e) => handleReviewAction(e, "request_info")}
                disabled={submittingReview}
                className="border rounded-md px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
              >
                Request Info
              </button>
            </div>

            {reviewMessage && (
              <p className="text-sm text-gray-300">{reviewMessage}</p>
            )}
          </form>
        </div>
      )}

      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold">Key Extracted Fields</h2>

        {priorityFields.length === 0 ? (
          <p>No extracted fields found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityFields.map((field) => (
              <div key={field.id} className="border rounded p-3">
                <p className="text-sm text-gray-400">
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

                <p className="text-xs text-gray-500 mt-1">
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
              className="border rounded-md px-3 py-2 text-sm hover:bg-gray-800"
            >
              {showAllFields
                ? "Hide other extracted fields"
                : "Show other extracted fields"}
            </button>

            {showAllFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {otherFields.map((field) => (
                  <div key={field.id} className="border rounded p-3">
                    <p className="text-sm text-gray-400">
                      {formatFieldLabel(field.field_name)}
                    </p>
                    <p className="font-medium break-words">
                      {field.field_value || "—"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {field.confidence ?? "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Files</h2>
        {caseDetail.files.length === 0 ? (
          <p>No files found.</p>
        ) : (
          caseDetail.files.map((file) => (
            <div key={file.id} className="border rounded p-3">
              <p><strong>File Name:</strong> {file.file_name}</p>
              <a
                href={file.blob_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline"
              >
                Open File
              </a>
            </div>
          ))
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Decision History</h2>
        {caseDetail.decisions.length === 0 ? (
          <p>No decisions found.</p>
        ) : (
          <div className="space-y-2">
            {caseDetail.decisions.map((decision) => (
              <div key={decision.id} className="border rounded p-3">
                <p><strong>Outcome:</strong> {decision.outcome}</p>
                <p><strong>Reason:</strong> {decision.reason}</p>
                <p className="text-sm text-gray-400">
                  {new Date(decision.decided_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Audit Trail</h2>
        {caseDetail.audit_events.length === 0 ? (
          <p>No audit events found.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {caseDetail.audit_events.map((event) => (
              <div key={event.id} className="border rounded p-3">
                <p><strong>{event.event_type}</strong></p>
                <p className="break-words">{event.event_detail}</p>
                <p className="text-sm text-gray-400">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}