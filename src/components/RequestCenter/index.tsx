"use client";

import { FormEvent, useState } from "react";
import { usersList } from "@/lib/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ManageSchedule from "./ManageSchedule";
import ManageUsers from "./ManageUsers";
import ManageHoliday from "./ManageHoliday";
import BlockDates from "./BlockDates";
import SwapRequest from "./SwapRequest";

type RequestKind =
  | "swap"
  | "block-dates"
  | "holiday"
  | "add-user"
  | "remove-user"
  | "manage-user"
  | "scheduler-rule";

type ToastState = {
  status: "success" | "error";
  message: string;
  url?: string;
};

type TabType = {
  label: string;
  kind: RequestKind;
  content?: React.ReactNode;
};

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-600 focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-700";

function UserSelect({ name, label }: { name: string; label: string }) {
  return (
    <label className={labelClass}>
      {label}
      <select name={name} required className={inputClass}>
        <option value="">Choose a user</option>
        {usersList.map((user) => (
          <option key={user}>{user}</option>
        ))}
      </select>
    </label>
  );
}

function DateListInput() {
  return (
    <label className={labelClass}>
      Additional individual dates (optional)
      <input
        name="dates"
        type="text"
        className={inputClass}
        placeholder="2026-12-24, 2026-12-26"
      />
    </label>
  );
}

export default function RequestCenter() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submittingKind, setSubmittingKind] = useState<RequestKind | null>(
    null,
  );

  async function submit(kind: RequestKind, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingKind) return;
    setSubmittingKind(kind);
    setToast(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const checkboxValues = new FormData(form).getAll("weekdays").map(String);
    const slots = new FormData(form).getAll("slots").map(String);
    const pairUsers = new FormData(form).getAll("pairUsers").map(String);
    try {
      const response = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          data: { ...data, weekdays: checkboxValues, slots, pairUsers },
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to create the pull request.");
      setToast({
        status: "success",
        message: "Pull request created.",
        ...(typeof result.url === "string" ? { url: result.url } : {}),
      });
      form.reset();
    } catch (error) {
      setToast({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create the pull request.",
      });
    } finally {
      setSubmittingKind(null);
    }
  }

  const tabs: TabType[] = [
    { label: "Swap request", kind: "swap", content: <SwapRequest /> },
    { label: "Block dates", kind: "block-dates", content: <BlockDates /> },
    { label: "Holidays", kind: "holiday", content: <ManageHoliday /> },
    { label: "Users", kind: "manage-user", content: <ManageUsers /> },
    { label: "Schedule", kind: "scheduler-rule", content: <ManageSchedule /> },
  ];

  const [activeTab, setActiveTab] = useState<RequestKind>("swap");

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Parking requests</h1>
        <p className="mt-2 text-slate-600">
          Each submission opens a reviewable GitHub pull request. The schedule
          changes only after that PR is merged.
        </p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as RequestKind)}
        className="space-y-4"
      >
        <TabsList
          variant="line"
          className="flex items-start border max-w-full overflow-x-auto"
        >
          {tabs.map((tab: TabType) => (
            <TabsTrigger key={tab.kind} value={tab.kind}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>
          {tabs.find((tab) => tab.kind === activeTab)?.content}
        </TabsContent>
      </Tabs>
    </main>
  );

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Parking requests</h1>
        <p className="mt-2 text-slate-600">
          Each submission opens a reviewable GitHub pull request. The schedule
          changes only after that PR is merged.
        </p>
      </div>
      ``
      {toast && (
        <div
          role={toast.status === "error" ? "alert" : "status"}
          aria-live={toast.status === "error" ? "assertive" : "polite"}
          className={`fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-md rounded-lg border p-4 text-sm shadow-lg ${
            toast.status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                {toast.status === "error"
                  ? "Request failed"
                  : "Request submitted"}
              </p>
              <p className="mt-1">{toast.message}</p>
              {toast.url && (
                <a
                  href={toast.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-medium underline"
                >
                  View pull request
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="shrink-0 rounded px-2 py-1 font-medium hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => submit("swap", e)}
          aria-busy={submittingKind === "swap"}
          className="space-y-4 rounded-lg bg-white p-5 shadow"
        >
          <section>
            <h2 className="text-xl font-bold">Swap request</h2>
            <p className="text-sm text-slate-500">
              Swaps the selected users’ assignments across two dates and writes
              date overrides.
            </p>
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Swap date from
              <input
                required
                name="fromDate"
                type="date"
                className={inputClass}
              />
            </label>
            <UserSelect name="fromUser" label="Current user" />
            <label className={labelClass}>
              Swap date to
              <input
                required
                name="toDate"
                type="date"
                className={inputClass}
              />
            </label>
            <UserSelect name="toUser" label="Swap user" />
          </div>
          <SubmitButton
            loading={submittingKind === "swap"}
            disabled={submittingKind !== null}
          />
        </form>
        <form
          onSubmit={(e) => submit("block-dates", e)}
          aria-busy={submittingKind === "block-dates"}
          className="space-y-4 rounded-lg bg-white p-5 shadow"
        >
          <section>
            <h2 className="text-xl font-bold">Block dates</h2>
            <p className="text-sm text-slate-500">
              For leave or dates a user will not use a slot.
            </p>
          </section>
          <UserSelect name="user" label="User" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Start date
              <input
                required
                name="startDate"
                type="date"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              End date (optional)
              <input name="endDate" type="date" className={inputClass} />
            </label>
          </div>
          <DateListInput />
          <SubmitButton
            loading={submittingKind === "block-dates"}
            disabled={submittingKind !== null}
          />
        </form>
        <form
          onSubmit={(e) => submit("holiday", e)}
          aria-busy={submittingKind === "holiday"}
          className="space-y-4 rounded-lg bg-white p-5 shadow"
        >
          <section>
            <h2 className="text-xl font-bold">Add holiday</h2>
            <p className="text-sm text-slate-500">
              The holiday recurs annually on this month and day.
            </p>
          </section>
          <label className={labelClass}>
            Date
            <input required name="date" type="date" className={inputClass} />
          </label>
          <label className={labelClass}>
            Holiday name
            <input
              required
              name="name"
              type="text"
              maxLength={100}
              className={inputClass}
            />
          </label>
          <SubmitButton
            loading={submittingKind === "holiday"}
            disabled={submittingKind !== null}
          />
        </form>
        <form
          onSubmit={(e) => submit("add-user", e)}
          aria-busy={submittingKind === "add-user"}
          className="space-y-4 rounded-lg bg-white p-5 shadow"
        >
          <section>
            <h2 className="text-xl font-bold">Add user</h2>
            <p className="text-sm text-slate-500">
              New users start with no blocked dates.
            </p>
          </section>
          <label className={labelClass}>
            Name
            <input
              required
              name="name"
              type="text"
              pattern="[A-Za-z0-9 _-]+"
              maxLength={40}
              className={inputClass}
            />
          </label>
          <fieldset>
            <legend className={labelClass}>Unavailable weekdays</legend>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <label key={day} className="text-sm">
                    <input
                      name="weekdays"
                      value={index}
                      type="checkbox"
                      className="mr-1"
                    />
                    {day}
                  </label>
                ),
              )}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Border color
              <input
                required
                name="borderColor"
                type="color"
                defaultValue="#64748b"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Text color
              <input
                required
                name="textColor"
                type="color"
                defaultValue="#334155"
                className={inputClass}
              />
            </label>
          </div>
          <SubmitButton
            loading={submittingKind === "add-user"}
            disabled={submittingKind !== null}
          />
        </form>
        <form
          onSubmit={(e) => submit("remove-user", e)}
          aria-busy={submittingKind === "remove-user"}
          className="space-y-4 rounded-lg bg-white p-5 shadow"
        >
          <section>
            <h2 className="text-xl font-bold">Remove user</h2>
            <p className="text-sm text-slate-500">
              Choose a cutoff date to preserve history, or remove the user
              entirely.
            </p>
          </section>
          <UserSelect name="user" label="User" />
          <label className="flex items-center gap-2 text-sm">
            <input name="entirely" type="checkbox" /> Remove entirely
          </label>
          <label className={labelClass}>
            Remove after date
            <input name="removeAfterDate" type="date" className={inputClass} />
          </label>
          <SubmitButton
            loading={submittingKind === "remove-user"}
            disabled={submittingKind !== null}
          />
        </form>
        <form
          onSubmit={(e) => submit("scheduler-rule", e)}
          aria-busy={submittingKind === "scheduler-rule"}
          className="space-y-4 rounded-lg bg-white p-5 shadow lg:col-span-2"
        >
          <section>
            <h2 className="text-xl font-bold">Add scheduler rule</h2>
            <p className="text-sm text-slate-500">
              Forbids selected user pairs on the selected slots and weekdays.
            </p>
          </section>
          <fieldset>
            <legend className={labelClass}>Slots</legend>
            <div className="mt-2 flex gap-4">
              {["27", "28"].map((slot) => (
                <label key={slot}>
                  <input
                    required
                    name="slots"
                    value={slot}
                    type="checkbox"
                    className="mr-1"
                  />
                  Slot {slot}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClass}>Weekdays</legend>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <label key={day} className="text-sm">
                    <input
                      name="weekdays"
                      value={index}
                      type="checkbox"
                      className="mr-1"
                    />
                    {day}
                  </label>
                ),
              )}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <UserSelect name="pairUsers" label="First user" />
            <UserSelect name="pairUsers" label="Second user" />
          </div>
          <p className="text-xs text-slate-500">
            Submit additional requests for each additional forbidden pair.
          </p>
          <SubmitButton
            loading={submittingKind === "scheduler-rule"}
            disabled={submittingKind !== null}
          />
        </form>
      </div>
    </main>
  );
}

function SubmitButton({
  loading,
  disabled,
}: {
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={loading}
      className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {loading ? "Creating pull request…" : "Open pull request"}
    </button>
  );
}
