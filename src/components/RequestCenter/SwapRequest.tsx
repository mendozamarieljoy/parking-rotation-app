"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "../ui/select";
import { useEffect, useState } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../ui/field";
import { SwapIcon } from "@phosphor-icons/react";
import { Button } from "../ui/button";
import { DatePicker } from "../ui/date-picker";
import { format, isBefore, parseISO, startOfToday } from "date-fns";
import { toast } from "../ui/toast";
import ParkingSlot from "../ParkingSlot";
import { Slot } from "@/lib/types";
import { isHoliday } from "@/lib/utils";
import { parkingConfig } from "@/lib/config";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Link from "next/link";

type AssignedUser = {
  user: string;
  slots: Slot[];
};

type UserScheduleResult = {
  date: string;
  slot: 27 | 28;
  assignment: { primary: string | null; backup: string | null };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUserScheduleResult(value: unknown): value is UserScheduleResult {
  if (!isRecord(value) || !isRecord(value.assignment)) return false;

  return (
    typeof value.date === "string" &&
    (value.slot === 27 || value.slot === 28) &&
    (value.assignment.primary === null ||
      typeof value.assignment.primary === "string") &&
    (value.assignment.backup === null ||
      typeof value.assignment.backup === "string")
  );
}

async function loadAssignedUsers(date: string): Promise<AssignedUser[]> {
  const response = await fetch("/api/schedule/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users assigned on the selected date");
  }
  return ((await response.json()) as AssignedUser[] | null) ?? [];
}

export default function SwapRequest() {
  const overrideHistory = parkingConfig.scheduler.dateOverrides
    .flatMap(({ date, assignments }) =>
      (["27", "28"] as const)
        .map((slot) => ({ date, slot, assignment: assignments[slot] }))
        .filter((entry) => entry.assignment !== undefined),
    )
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        Number(left.slot) - Number(right.slot),
    );

  const [formData, setFormData] = useState({
    fromUser: "",
    fromDate: "",
    toUser: "",
    toDate: "",
  });

  const [fromUsers, setFromUsers] = useState<AssignedUser[]>([]);
  const [toUsers, setToUsers] = useState<AssignedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState({ from: false, to: false });
  const [userLoadErrors, setUserLoadErrors] = useState({
    from: false,
    to: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<{
    key: string;
    url: string;
  } | null>(null);
  const [preview, setPreview] = useState<{
    fromDate: string;
    fromUser: string;
    toDate: string;
    toUser: string;
    from: UserScheduleResult;
    to: UserScheduleResult;
  } | null>(null);
  const [previewError, setPreviewError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const previewKey = JSON.stringify([
    formData.fromDate,
    formData.fromUser,
    formData.toDate,
    formData.toUser,
  ]);

  useEffect(() => {
    let cancelled = false;

    if (formData.fromDate) {
      void loadAssignedUsers(formData.fromDate)
        .then((users) => {
          if (!cancelled) setFromUsers(users);
        })
        .catch((error: unknown) => {
          console.error("Error fetching from date assignments:", error);
          if (!cancelled) {
            setUserLoadErrors((previous) => ({ ...previous, from: true }));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingUsers((previous) => ({ ...previous, from: false }));
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [formData.fromDate]);

  useEffect(() => {
    let cancelled = false;

    if (formData.toDate) {
      void loadAssignedUsers(formData.toDate)
        .then((users) => {
          if (!cancelled) setToUsers(users);
        })
        .catch((error: unknown) => {
          console.error("Error fetching to date assignments:", error);
          if (!cancelled) {
            setUserLoadErrors((previous) => ({ ...previous, to: true }));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingUsers((previous) => ({ ...previous, to: false }));
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [formData.toDate]);

  useEffect(() => {
    let cancelled = false;

    if (
      !formData.fromDate ||
      !formData.fromUser ||
      !formData.toDate ||
      !formData.toUser
    ) {
      return () => {
        cancelled = true;
      };
    }

    if (formData.fromDate === formData.toDate) {
      return () => {
        cancelled = true;
      };
    }

    const loadAssignment = async (
      date: string,
      user: string,
    ): Promise<UserScheduleResult> => {
      const response = await fetch("/api/schedule/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, user }),
      });

      if (!response.ok) {
        throw new Error("Unable to load the selected parking assignments.");
      }

      const result: unknown = await response.json();
      if (
        !isUserScheduleResult(result) ||
        result.date !== date ||
        ![result.assignment.primary, result.assignment.backup].includes(user)
      ) {
        throw new Error(
          "A selected user no longer has an assignment on the selected date.",
        );
      }

      return result;
    };

    void Promise.all([
      loadAssignment(formData.fromDate, formData.fromUser),
      loadAssignment(formData.toDate, formData.toUser),
    ])
      .then(([from, to]) => {
        if (!cancelled) {
          setPreview({
            fromDate: formData.fromDate,
            fromUser: formData.fromUser,
            toDate: formData.toDate,
            toUser: formData.toUser,
            from,
            to,
          });
        }
      })
      .catch((error: unknown) => {
        console.error("Error loading swap preview assignments:", error);
        if (!cancelled) {
          setPreviewError({
            key: previewKey,
            message:
              error instanceof Error
                ? error.message
                : "Unable to load the selected parking assignments.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    formData.fromDate,
    formData.fromUser,
    formData.toDate,
    formData.toUser,
    previewKey,
  ]);

  const handleFromDateChange = (date: Date | undefined) => {
    setFormData((prevData) => {
      const toDate = prevData.toDate ? parseISO(prevData.toDate) : undefined;
      const shouldClearToDate =
        !date || (toDate !== undefined && isBefore(toDate, date));

      return {
        ...prevData,
        fromUser: "",
        fromDate: date ? format(date, "yyyy-MM-dd") : "",
        toUser: shouldClearToDate ? "" : prevData.toUser,
        toDate: shouldClearToDate ? "" : prevData.toDate,
      };
    });
    setFromUsers([]);
    setLoadingUsers((previous) => ({
      ...previous,
      from: !!date,
      ...(date === undefined ||
      (formData.toDate && date && isBefore(parseISO(formData.toDate), date))
        ? { to: false }
        : {}),
    }));
    setUserLoadErrors((previous) => ({
      ...previous,
      from: false,
      ...(date === undefined ||
      (formData.toDate && date && isBefore(parseISO(formData.toDate), date))
        ? { to: false }
        : {}),
    }));
    if (
      date === undefined ||
      (formData.toDate && date && isBefore(parseISO(formData.toDate), date))
    ) {
      setToUsers([]);
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    setFormData((prevData) => ({
      ...prevData,
      toUser: "",
      toDate: date ? format(date, "yyyy-MM-dd") : "",
    }));
    setToUsers([]);
    setLoadingUsers((previous) => ({ ...previous, to: !!date }));
    setUserLoadErrors((previous) => ({ ...previous, to: false }));
  };

  const activePreview =
    preview &&
    preview.fromDate === formData.fromDate &&
    preview.fromUser === formData.fromUser &&
    preview.toDate === formData.toDate &&
    preview.toUser === formData.toUser
      ? preview
      : null;

  const onSubmitSwapRequest = async () => {
    if (isSubmitting || !activePreview) return;

    setIsSubmitting(true);
    setSubmittedRequest(null);
    try {
      const response = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "swap", data: formData }),
      });
      const result: unknown = await response.json();
      if (!isRecord(result)) {
        throw new Error("The server returned an invalid response.");
      }
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Unable to submit the swap request.",
        );
      }
      if (typeof result.url !== "string") {
        throw new Error("The server did not return the pull request URL.");
      }

      setSubmittedRequest({ key: previewKey, url: result.url });
      toast.add({
        title: "Swap request submitted",
        description: "A pull request has been created for review.",
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting swap request:", error);
      toast.add({
        title: "Swap request failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to submit the swap request.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromPreviewAssignment = activePreview
    ? {
        ...activePreview.from.assignment,
        primary:
          activePreview.from.assignment.primary === formData.fromUser
            ? formData.toUser
            : activePreview.from.assignment.primary,
        backup:
          activePreview.from.assignment.backup === formData.fromUser
            ? formData.toUser
            : activePreview.from.assignment.backup,
      }
    : null;

  const toPreviewAssignment = activePreview
    ? {
        ...activePreview.to.assignment,
        primary:
          activePreview.to.assignment.primary === formData.toUser
            ? formData.fromUser
            : activePreview.to.assignment.primary,
        backup:
          activePreview.to.assignment.backup === formData.toUser
            ? formData.fromUser
            : activePreview.to.assignment.backup,
      }
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/parking/requests"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        &larr; Request center
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-3xl font-bold">
            Swap Request
          </CardTitle>
          <CardDescription>
            Request to exchange your assigned parking schedule with another
            user. You can submit a swap request and track its approval status.
          </CardDescription>
          <CardContent className="my-4 px-0">
            <form className="flex flex-col md:flex-row items-center gap-4">
              <Card className="w-full">
                <CardContent className="flex flex-col md:flex-row items-start gap-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="fromDate">Select date</FieldLabel>
                      <DatePicker
                        date={
                          formData.fromDate
                            ? parseISO(formData.fromDate)
                            : undefined
                        }
                        onDateChange={handleFromDateChange}
                        calendarProps={{
                          disabled: [{ before: startOfToday() }, isHoliday],
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="fromUser">Select a User</FieldLabel>
                      <Select
                        name="fromUser"
                        value={formData.fromUser || null}
                        disabled={!formData.fromDate || loadingUsers.from}
                        onValueChange={(value) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            fromUser: typeof value === "string" ? value : "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              Select a user assigned on{" "}
                              {dayjs(formData.fromDate).format("MMM D, YYYY")}
                            </SelectLabel>
                            {fromUsers.map(({ user, slots }) => (
                              <SelectItem
                                key={user}
                                value={user}
                                disabled={user === formData.toUser}
                              >
                                <b className="text-amber-600">
                                  {slots.map((slot) => slot).join(", ")}
                                </b>{" "}
                                {user}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {loadingUsers.from && (
                        <FieldDescription>
                          Loading users assigned on this date...
                        </FieldDescription>
                      )}
                      {!loadingUsers.from &&
                        formData.fromDate &&
                        !fromUsers.length && (
                          <FieldError>
                            {userLoadErrors.from
                              ? "Unable to load assignments for this date."
                              : "No users have assigned parking on this date."}
                          </FieldError>
                        )}
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
              <SwapIcon
                size={48}
                className="text-accent-foreground rotate-90 md:rotate-0 w-32"
              />
              <Card className="w-full">
                <CardContent className="flex flex-col md:flex-row items-start gap-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="toDate">Select date</FieldLabel>
                      <DatePicker
                        date={
                          formData.toDate
                            ? parseISO(formData.toDate)
                            : undefined
                        }
                        onDateChange={handleToDateChange}
                        calendarProps={{
                          disabled: [
                            {
                              before: formData.fromDate
                                ? parseISO(formData.fromDate)
                                : startOfToday(),
                            },
                            isHoliday,
                          ],
                        }}
                        disabled={!formData.fromDate || !formData.fromUser}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="toUser">Select a User</FieldLabel>
                      <Select
                        name="toUser"
                        value={formData.toUser || null}
                        disabled={
                          !formData.fromDate ||
                          !formData.fromUser ||
                          loadingUsers.to
                        }
                        onValueChange={(value) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            toUser: typeof value === "string" ? value : "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              {" "}
                              Select a user assigned on{" "}
                              {dayjs(formData.toDate).format("MMM D, YYYY")}
                            </SelectLabel>
                            {toUsers.map(({ user, slots }) => (
                              <SelectItem
                                key={user}
                                value={user}
                                disabled={user === formData.fromUser}
                              >
                                <b className="text-amber-600">
                                  {slots.map((slot) => slot).join(", ")}
                                </b>{" "}
                                {user}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {loadingUsers.to && (
                        <FieldDescription>
                          Loading users assigned on this date...
                        </FieldDescription>
                      )}
                      {!loadingUsers.to &&
                        formData.toDate &&
                        !toUsers.length && (
                          <FieldError>
                            {userLoadErrors.to
                              ? "Unable to load assignments for this date."
                              : "No users have assigned parking on this date."}
                          </FieldError>
                        )}
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </form>
          </CardContent>
        </CardHeader>
        <CardFooter>
          <div className="w-full space-y-3">
            <Button
              type="button"
              className="w-full"
              disabled={
                isSubmitting ||
                !activePreview ||
                previewError?.key === previewKey ||
                Object.values(formData).some((value) => !value) ||
                formData.fromDate === formData.toDate ||
                formData.fromUser === formData.toUser
              }
              onClick={onSubmitSwapRequest}
            >
              {isSubmitting ? "Submitting request..." : "Submit Request"}
            </Button>
            {submittedRequest?.key === previewKey && (
              <p role="status" className="text-center text-sm">
                Request submitted.{" "}
                <a
                  href={submittedRequest.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-700 underline"
                >
                  Review the pull request
                </a>
              </p>
            )}
          </div>
        </CardFooter>
      </Card>

      {!Object.values(formData).some((value) => !value) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Swap Preview</CardTitle>
            <CardDescription>
              This is a preview of the swap request you are about to submit.
              Please review the details below before submitting your request.
            </CardDescription>
            <CardContent className="space-y-4">
              {formData.fromDate &&
                formData.fromUser &&
                formData.toDate &&
                formData.toUser &&
                formData.fromDate !== formData.toDate &&
                !activePreview &&
                previewError?.key !== previewKey && (
                  <p role="status">
                    Loading the selected parking assignments...
                  </p>
                )}
              {formData.fromDate === formData.toDate &&
                formData.fromDate &&
                formData.toDate && (
                  <p role="alert" className="text-sm text-destructive">
                    Choose two different dates to preview a swap.
                  </p>
                )}
              {previewError?.key === previewKey && (
                <p role="alert" className="text-sm text-destructive">
                  {previewError.message}
                </p>
              )}
              {activePreview &&
                fromPreviewAssignment &&
                toPreviewAssignment && (
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">
                        {dayjs(formData.fromDate).format("MMM D, YYYY")} —{" "}
                        {formData.fromUser === formData.toUser
                          ? `${formData.fromUser}'s assignment`
                          : `${formData.toUser} takes ${formData.fromUser}'s assignment`}
                      </h3>
                      <div className="min-h-44">
                        <ParkingSlot
                          slot={activePreview.from.slot === 27 ? "27" : "28"}
                          assignment={fromPreviewAssignment}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">
                        {dayjs(formData.toDate).format("MMM D, YYYY")} —{" "}
                        {formData.fromUser === formData.toUser
                          ? `${formData.toUser}'s assignment`
                          : `${formData.fromUser} takes ${formData.toUser}'s assignment`}
                      </h3>
                      <div className="min-h-44">
                        <ParkingSlot
                          slot={activePreview.to.slot === 27 ? "27" : "28"}
                          assignment={toPreviewAssignment}
                        />
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </CardHeader>
        </Card>
      )}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Override History</CardTitle>
          <CardDescription>
            Configured parking assignments, with the most recent dates first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overrideHistory.length ? (
            <Table>
              <TableCaption>
                Current date overrides configured for the parking schedule.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead>Backup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrideHistory.map(({ date, slot, assignment }) => (
                  <TableRow key={`${date}-${slot}`}>
                    <TableCell>
                      {format(parseISO(date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{slot}</TableCell>
                    <TableCell>{assignment.primary ?? "—"}</TableCell>
                    <TableCell>{assignment.backup ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No date overrides have been configured yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
