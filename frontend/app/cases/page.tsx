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
      const matchesStatus =
        statusFilter === "all" ? true : c.status === statusFilter;

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
  const pendingReviewCases = cases.filter(
    (c) => c.status === "pending_review"
  ).length;

  if (loading) {
    return <div className="p-6">Loading cases...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Case Review Queue</h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor submitted finance cases and review workflow status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Cases</p>
          <p className="text-2xl font-bold">{totalCases}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-400">Pending Review</p>
          <p className="text-2xl font-bold">{pendingReviewCases}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-400">Approved</p>
          <p className="text-2xl font-bold">{approvedCases}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-400">Rejected</p>
          <p className="text-2xl font-bold">{rejectedCases}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by case ID, submitter, email, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-3 py-2 w-full md:w-1/2 bg-transparent"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 bg-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending_review">Pending Review</option>
          <option value="awaiting_information">Awaiting Information</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Submitter</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Stage</th>
              <th className="p-2 border">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((c) => (
              <tr
                key={c.id}
                className="text-center cursor-pointer hover:bg-gray-800"
                onClick={() => router.push(`/cases/${c.id}`)}
                >
                <td className="p-2 border">{c.id}</td>
                <td className="p-2 border">{c.case_type}</td>
                <td className="p-2 border">{c.submitter_name}</td>
                <td className="p-2 border">{c.submitter_email}</td>
                <td className="p-2 border">{c.status}</td>
                <td className="p-2 border">{c.current_stage}</td>
                <td className="p-2 border">
                  {new Date(c.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}