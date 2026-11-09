"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";

type RequestType =
  | "swap"
  | "block-dates"
  | "holiday"
  | "add-user"
  | "remove-user"
  | "scheduler-rule"
  | "other";
type RequestStatus = "open" | "draft" | "merged" | "closed";
type ParkingRequest = {
  number: number;
  title: string;
  url: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
};

const typeLabels: Record<RequestType, string> = {
  swap: "Swap",
  "block-dates": "Unavailable dates",
  holiday: "Holiday",
  "add-user": "Add user",
  "remove-user": "Remove user",
  "scheduler-rule": "Schedule rule",
  other: "Other",
};

const statusLabels: Record<RequestStatus, string> = {
  open: "Open",
  draft: "Draft",
  merged: "Merged",
  closed: "Closed",
};

const statusStyles: Record<RequestStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  draft: "bg-slate-100 text-slate-700",
  merged: "bg-green-100 text-green-800",
  closed: "bg-red-100 text-red-800",
};

const columns: ColumnDef<ParkingRequest>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Request" />
    ),
    cell: ({ row }) => (
      <div className="max-w-md whitespace-normal font-medium">
        <a
          href={row.original.url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-700 underline decoration-transparent underline-offset-2 hover:decoration-current"
        >
          {row.original.title}
          <span className="sr-only"> (opens in GitHub)</span>
        </a>
        <span className="mt-1 block text-xs text-slate-500">
          PR #{row.original.number}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    accessorFn: (request) => statusLabels[request.status],
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Status"
        filterOptions={Object.values(statusLabels).map((label) => ({
          value: label,
          label,
        }))}
      />
    ),
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[row.original.status]}`}
      >
        {statusLabels[row.original.status]}
      </span>
    ),
    filterFn: (row, columnId, filterValue: string[]) =>
      filterValue.includes(row.getValue<string>(columnId)),
  },
  {
    id: "type",
    accessorFn: (request) => typeLabels[request.type],
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Type"
        filterOptions={Object.values(typeLabels).map((label) => ({
          value: label,
          label,
        }))}
      />
    ),
    cell: ({ row }) => typeLabels[row.original.type],
    filterFn: (row, columnId, filterValue: string[]) =>
      filterValue.includes(row.getValue<string>(columnId)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted" />
    ),
    cell: ({ row }) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(row.original.createdAt),
      ),
  },
  {
    id: "github",
    header: "GitHub",
    enableSorting: false,
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-blue-700 hover:underline"
        aria-label={`View pull request ${row.original.number} on GitHub`}
      >
        View PR
      </a>
    ),
  },
];

export default function PendingRequestsPage() {
  const [requests, setRequests] = useState<ParkingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRequests() {
      try {
        const response = await fetch("/api/change-requests", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          error?: string;
          requests?: ParkingRequest[];
        };
        if (!response.ok)
          throw new Error(result.error || "Unable to load submitted requests.");
        if (!Array.isArray(result.requests))
          throw new Error("The server returned an invalid request list.");
        setRequests(result.requests);
      } catch (loadError) {
        if (!controller.signal.aborted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load submitted requests.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRequests();
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <Link
          href="/parking/requests"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          &larr; Request center
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">
          Submitted requests
        </h1>
        <p className="text-slate-600">
          Review each request’s GitHub pull request and track whether it is
          open, merged, or closed.
        </p>
      </header>

      {loading ? (
        <p
          role="status"
          className="text-slate-600 flex flex-col items-center gap-4 py-10"
        >
          <Spinner className="size-8" /> Loading submitted requests…
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          emptyMessage={
            requests.length === 0
              ? "No pull requests have been submitted yet."
              : "No requests match the selected filters."
          }
        />
      )}
    </main>
  );
}
