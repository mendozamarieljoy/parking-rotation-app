"use client";

import { FormEvent, useMemo, useState } from "react";
import { eachDayOfInterval, format } from "date-fns";
import { usersList } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { DateRangePicker, MultiDatePicker } from "../ui/date-picker";
import type { DateRange } from "react-day-picker";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "../ui/toast";
import Link from "next/link";

const labelClass = "block text-sm font-medium text-slate-700";

export default function BlockDates() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [individualDates, setIndividualDates] = useState<Date[]>([]);
  const previewDates = useMemo(() => {
    const allDates = [
      ...individualDates,
      ...(dateRange?.from
        ? eachDayOfInterval({
            start: dateRange.from,
            end: dateRange.to ?? dateRange.from,
          })
        : []),
    ];
    const uniqueDates = new Map(
      allDates.map((date) => [format(date, "yyyy-MM-dd"), date]),
    );

    return [...uniqueDates.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, date]) => ({ key, date }));
  }, [dateRange, individualDates]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const startDate = dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : "";
    const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
    const dates = individualDates
      .map((date) => format(date, "yyyy-MM-dd"))
      .join(",");

    if (!user || !startDate) {
      toast.add({
        title: "Incomplete request",
        description: "Please choose a user and a start date.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "block-dates",
          data: {
            user,
            startDate,
            endDate: endDate || startDate,
            dates,
          },
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        url?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to create the pull request.");
      }

      toast.add({
        title: "Block dates request submitted",
        description: (
          <>
            Pull request created.
            {typeof result.url === "string" && (
              <>
                {" "}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  View pull request
                </a>
              </>
            )}
          </>
        ),
        type: "success",
      });
      form.reset();
      setUser("");
      setDateRange(undefined);
      setIndividualDates([]);
    } catch (error) {
      toast.add({
        title: "Block dates request failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to create the pull request.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/parking/requests"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        &larr; Request center
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Unavailable Dates</CardTitle>
          <CardDescription>
            Select dates when you are unavailable, such as during leave or
            personal time off. You will not be assigned a parking slot on these
            dates, and your schedule will automatically be reassigned to other
            available users.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
          >
            <div className="space-y-2">
              <label htmlFor="user" className={labelClass}>
                Block dates for
              </label>
              <Select
                name="user"
                value={user || null}
                onValueChange={(value) =>
                  setUser(typeof value === "string" ? value : "")
                }
                required
              >
                <SelectTrigger id="user" className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Users</SelectLabel>
                    {usersList.map((userName) => (
                      <SelectItem key={userName} value={userName}>
                        {userName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="dateRange" className={labelClass}>
                  Date range
                </label>
                <DateRangePicker
                  id="dateRange"
                  date={dateRange}
                  onDateChange={setDateRange}
                  excludeDisabled
                  placeholder="Choose a date range"
                  className="w-full"
                  calendarProps={{
                    disabled: individualDates,
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="individualDates" className={labelClass}>
                  Additional individual dates (optional)
                </label>
                <MultiDatePicker
                  id="individualDates"
                  dates={individualDates}
                  onDatesChange={(dates) => setIndividualDates(dates ?? [])}
                  placeholder="Choose one or more dates"
                  className="w-full truncate"
                  calendarProps={{
                    disabled: dateRange?.from
                      ? dateRange.to
                        ? { from: dateRange.from, to: dateRange.to }
                        : dateRange.from
                      : undefined,
                  }}
                />
              </div>
            </div>

            <section
              aria-live="polite"
              aria-label="Dates to block preview"
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-800">
                Dates to block ({previewDates.length})
              </h3>
              {previewDates.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {previewDates.map(({ key, date }) => (
                    <li
                      key={key}
                      className="rounded-md bg-white px-2.5 py-1 text-sm text-slate-700 shadow-sm"
                    >
                      {format(date, "EEE, MMM d, yyyy")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Choose a date range or individual dates to see the preview.
                </p>
              )}
            </section>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Creating pull request…" : "Open pull request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
