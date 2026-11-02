"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import type { HolidayRecord } from "@/lib/holiday-data";
import { setRuntimeHolidays } from "@/lib/runtime-holidays";
import { useParkingStore } from "@/lib/store";

type Admin = { name: string; email: string };
type HolidayModal = "create" | "edit" | "delete" | null;

export default function AdminHolidaysPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [error, setError] = useState("");
  const [type, setType] = useState<"EXACT" | "ANNUAL">("EXACT");
  const [modal, setModal] = useState<HolidayModal>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayRecord | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const regenerateSchedule = useParkingStore(
    (state) => state.regenerateSchedule,
  );
  const reload = useCallback(async () => {
    const [session, holidayResponse] = await Promise.all([
      fetch("/api/admin/session"),
      fetch("/api/holidays"),
    ]);
    if (!session.ok) {
      router.replace("/admin/login");
      return;
    }
    setAdmin(await session.json());
    if (!holidayResponse.ok) throw new Error("Could not load holidays");
    const items: HolidayRecord[] = await holidayResponse.json();
    setHolidays(items);
    setRuntimeHolidays(items);
    regenerateSchedule();
  }, [regenerateSchedule, router]);
  useEffect(() => {
    let active = true;
    reload().catch(() => {
      if (active) setError("Could not load admin data");
    });
    return () => {
      active = false;
    };
  }, [reload]);
  function openCreate() {
    setError("");
    setSelectedHoliday(null);
    setType("EXACT");
    setModal("create");
  }
  function openEdit(holiday: HolidayRecord) {
    setError("");
    setSelectedHoliday(holiday);
    setType(holiday.type);
    setModal("edit");
  }
  function closeModal() {
    if (busy) return;
    setModal(null);
    setSelectedHoliday(null);
    setError("");
  }
  async function saveHoliday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal !== "create" && modal !== "edit") return;
    if (modal === "edit" && !selectedHoliday) {
      setError("Select a holiday to edit");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const body =
        type === "EXACT"
          ? { name: form.get("name"), type, date: form.get("date") }
          : {
              name: form.get("name"),
              type,
              month: form.get("month"),
              day: form.get("day"),
            };
      const response = await fetch(
        modal === "create"
          ? "/api/holidays"
          : `/api/holidays/${selectedHoliday?.id}`,
        {
          method: modal === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result: { error?: string } = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Could not save holiday");
        return;
      }
      setModal(null);
      setSelectedHoliday(null);
      await reload();
    } catch {
      setError("Could not save holiday");
    } finally {
      setBusy(false);
    }
  }
  async function remove(holiday: HolidayRecord) {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/holidays/${holiday.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result: { error?: string } = await response.json();
        setError(result.error ?? "Could not delete holiday");
        return;
      }
      setModal(null);
      setSelectedHoliday(null);
      await reload();
    } catch {
      setError("Could not delete holiday");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }
  return (
    <main className="mx-auto my-8 max-w-3xl space-y-6 px-4">
      <header className="flex items-center justify-between rounded-xl bg-white p-5 shadow">
        <div>
          <h1 className="text-2xl font-bold">Holiday management</h1>
          <p className="text-sm text-slate-600">
            {admin?.name ?? "Loading admin…"}
          </p>
        </div>
        <button onClick={logout} className="rounded border px-3 py-2">
          Sign out
        </button>
      </header>
      <section className="rounded-xl bg-white p-5 shadow">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Holidays</h2>
          <button
            onClick={openCreate}
            className="rounded bg-slate-800 px-4 py-2 font-semibold text-white"
          >
            Add holiday
          </button>
        </div>
        {error && !modal && (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <ul className="divide-y">
          {holidays.map((holiday) => {
            return (
              <li
                key={holiday.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="flex flex-col md:flex-row md:items-center md:gap-2">
                  <strong>{holiday.name}</strong>
                  <span className="text-sm text-slate-600">
                    {holiday.type === "EXACT"
                      ? holiday.date
                      : `Every ${holiday.month}/${holiday.day}`}
                  </span>
                </span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(holiday)}
                    title={`Edit ${holiday.name}`}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSelectedHoliday(holiday);
                      setModal("delete");
                    }}
                    title={`Delete ${holiday.name}`}
                    className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <Modal
        isOpen={modal === "create" || modal === "edit"}
        title={modal === "edit" ? "Edit holiday" : "Add holiday"}
        body={
          <form
            key={selectedHoliday?.id ?? "new-holiday"}
            onSubmit={saveHoliday}
            className="space-y-4"
          >
            <label className="block text-sm">
              Name
              <input
                className="mt-1 w-full rounded border p-2"
                name="name"
                maxLength={120}
                defaultValue={selectedHoliday?.name ?? ""}
                required
              />
            </label>
            <label className="block text-sm">
              Date rule
              <select
                className="mt-1 w-full rounded border p-2"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "EXACT" | "ANNUAL")
                }
              >
                <option value="EXACT">One date</option>
                <option value="ANNUAL">Repeats annually</option>
              </select>
            </label>
            {type === "EXACT" ? (
              <label className="block text-sm">
                Date
                <input
                  className="mt-1 w-full rounded border p-2"
                  type="date"
                  name="date"
                  defaultValue={selectedHoliday?.date ?? ""}
                  required
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Month
                  <input
                    className="mt-1 w-full rounded border p-2"
                    type="number"
                    name="month"
                    min="1"
                    max="12"
                    defaultValue={selectedHoliday?.month ?? ""}
                    required
                  />
                </label>
                <label className="text-sm">
                  Day
                  <input
                    className="mt-1 w-full rounded border p-2"
                    type="number"
                    name="day"
                    min="1"
                    max="31"
                    defaultValue={selectedHoliday?.day ?? ""}
                    required
                  />
                </label>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={busy}
                className="rounded border px-4 py-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-slate-800 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : modal === "edit" ? "Save" : "Save holiday"}
              </button>
            </div>
          </form>
        }
        footer={null}
      />
      <Modal
        isOpen={modal === "delete"}
        title="Delete holiday?"
        body={
          <>
            {selectedHoliday ? (
              <>
                Are you sure you want to delete{" "}
                <strong>{selectedHoliday.name}</strong>? This action cannot be
                undone.
              </>
            ) : (
              ""
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </>
        }
        confirmLabel={busy ? "Deleting…" : "Confirm"}
        onConfirm={() => {
          if (selectedHoliday) void remove(selectedHoliday);
        }}
        cancelLabel="Cancel"
        onCancel={closeModal}
        confirmDisabled={busy}
        cancelDisabled={busy}
      />
    </main>
  );
}
