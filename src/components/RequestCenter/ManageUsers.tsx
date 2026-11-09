"use client";

import { useState } from "react";
import RequestForm from "@/components/RequestCenter/RequestForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function ManageUsers() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <Link
          href="/parking/requests"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          &larr; Request center
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">User management</h1>
        <p className="text-slate-600">
          Propose roster changes for review. Changes take effect after the pull
          request is merged and the app is redeployed.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <RequestForm
          kind="add-user"
          title="Add a user"
          description="New users start with no blocked dates and will be added to the rotation."
          submitLabel="Submit new user"
        >
          <Label className="flex flex-col items-start gap-2">
            Name
            <Input
              name="name"
              type="text"
              required
              pattern="[A-Za-z0-9 _-]+"
              maxLength={40}
            />
          </Label>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              Unavailable weekdays
            </legend>
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
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <Label className="flex flex-col items-start gap-2">
              Border color
              <Input
                name="borderColor"
                type="color"
                required
                defaultValue="#64748b"
                className="h-10 p-1"
              />
            </Label>
            <Label className="flex flex-col items-start gap-2">
              Text color
              <Input
                name="textColor"
                type="color"
                required
                defaultValue="#334155"
                className="h-10 p-1"
              />
            </Label>
          </div>
        </RequestForm>

        <RemoveUserForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current users</CardTitle>
          <CardDescription>
            {usersList.length} users are currently included in the parking
            rotation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usersList.map((name) => {
              const user = parkingConfig.users[name];
              return (
                <li
                  key={name}
                  className="rounded-lg border p-4"
                  style={{
                    borderColor: user.colors.border,
                    color: user.colors.text,
                  }}
                >
                  <p className="font-semibold">{name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.removeUserAfterDate
                      ? `Scheduled to leave after ${user.removeUserAfterDate}`
                      : "Active in the rotation"}
                  </p>
                  {user.unavailableWeekdays.length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Unavailable:{" "}
                      {user.unavailableWeekdays
                        .map((day) => weekdays[day])
                        .join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}

function RemoveUserForm() {
  const [removeEntirely, setRemoveEntirely] = useState(false);

  return (
    <RequestForm
      kind="remove-user"
      title="Remove a user"
      description="Choose a cutoff date to preserve history, or remove the user entirely."
      submitLabel="Submit removal"
    >
      <Label className="flex flex-col items-start gap-2">
        User
        <select
          name="user"
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
      <Label className="font-normal">
        <input
          name="entirely"
          type="checkbox"
          checked={removeEntirely}
          onChange={(event) => setRemoveEntirely(event.target.checked)}
          className="size-4 accent-primary"
        />
        Remove entirely, including existing assignments
      </Label>
      <Label className="flex flex-col items-start gap-2">
        Remove after date
        <Input
          name="removeAfterDate"
          type="date"
          required={!removeEntirely}
          disabled={removeEntirely}
        />
      </Label>
    </RequestForm>
  );
}
