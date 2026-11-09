"use client";

import RequestForm from "@/components/RequestCenter/RequestForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { parkingConfig, usersList } from "@/lib/config";
import Link from "next/link";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function describeRule(rule: (typeof parkingConfig.scheduler.rules)[number]) {
  const conditions = [
    rule.weekdays?.length
      ? rule.weekdays.map((day) => weekdays[day]).join(", ")
      : null,
    rule.dates?.length ? rule.dates.join(", ") : null,
    rule.afterDateExclusive ? `After ${rule.afterDateExclusive}` : null,
  ].filter(Boolean);

  return conditions.length ? conditions.join(" · ") : "Every day";
}

export default function ManageSchedule() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <Link
          href="/parking/requests"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          &larr; Request center
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Schedule rules</h1>
        <p className="text-slate-600">
          View the current scheduler rules and propose an additional restriction
          for a pair of users.
        </p>
      </header>
      <div className="max-w-2xl">
        <RequestForm
          kind="scheduler-rule"
          title="Add a schedule rule"
          description="Prevent two users from being assigned together for selected slots and weekdays."
          submitLabel="Submit schedule rule"
        >
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Affected slots</legend>
            <div className="flex flex-wrap gap-4">
              {["27", "28"].map((slot) => (
                <Label key={slot} className="font-normal">
                  <input
                    name="slots"
                    value={slot}
                    type="checkbox"
                    className="size-4 accent-primary"
                  />
                  Slot {slot}
                </Label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Select at least one slot.
            </p>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Applies on weekdays</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {weekdays.map((day, index) => (
                <Label key={day} className="font-normal">
                  <input
                    name="weekdays"
                    value={index}
                    type="checkbox"
                    className="size-4 accent-primary"
                  />
                  {day}
                </Label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Leave all weekdays unchecked to apply every day.
            </p>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <UserSelect name="pairUsers" label="First user" />
            <UserSelect name="pairUsers" label="Second user" />
          </div>
        </RequestForm>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current rules</CardTitle>
          <CardDescription>
            Rules apply to the selected parking slots and matching dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {parkingConfig.scheduler.rules.map((rule, index) => (
            <section key={index} className="rounded-lg border p-4">
              <p className="font-semibold">
                {rule.forbiddenPairs?.length
                  ? rule.forbiddenPairs
                      .map(
                        (pair) => `${pair[0]} and ${pair[1]} cannot be paired`,
                      )
                      .join("; ")
                  : rule.forbiddenUsers?.length
                    ? `${rule.forbiddenUsers.join(", ")} excluded`
                    : "Scheduling restriction"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Slots {rule.slots.join(", ")} · {describeRule(rule)}
              </p>
            </section>
          ))}
          {parkingConfig.scheduler.rules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No schedule rules configured.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function UserSelect({ name, label }: { name: string; label: string }) {
  return (
    <Label className="flex flex-col items-start gap-2">
      {label}
      <select
        name={name}
        required
        defaultValue=""
        className="h-9 w-full rounded-2xl border border-input bg-input/50 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <option value="" disabled>
          Choose a user
        </option>
        {usersList.map((user) => (
          <option key={user} value={user}>
            {user}
          </option>
        ))}
      </select>
    </Label>
  );
}
