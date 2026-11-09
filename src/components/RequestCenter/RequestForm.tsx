"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type RequestKind = "holiday" | "add-user" | "remove-user" | "scheduler-rule";

type RequestFormProps = {
  kind: RequestKind;
  title: string;
  description: string;
  children: ReactNode;
  submitLabel: string;
};

export default function RequestForm({
  kind,
  title,
  description,
  children,
  submitLabel,
}: RequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: "success" | "error";
    message: string;
    url?: string;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFeedback(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, String(value)]),
    );

    try {
      const response = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          data: {
            ...data,
            weekdays: formData.getAll("weekdays").map(String),
            slots: formData.getAll("slots").map(String),
            pairUsers: formData.getAll("pairUsers").map(String),
          },
        }),
      });
      const result = (await response.json()) as {
        error?: unknown;
        url?: unknown;
      };

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Unable to create the pull request.",
        );
      }

      setFeedback({
        status: "success",
        message: "Pull request created. The schedule changes after it is merged.",
        ...(typeof result.url === "string" ? { url: result.url } : {}),
      });
      form.reset();
    } catch (error) {
      setFeedback({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create the pull request.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} aria-busy={submitting}>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">{children}</CardContent>
          <CardFooter className="border-t">
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner />}
              {submitting ? "Creating pull request…" : submitLabel}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {feedback && (
        <div
          role={feedback.status === "error" ? "alert" : "status"}
          aria-live={feedback.status === "error" ? "assertive" : "polite"}
          className={`rounded-lg border p-4 text-sm ${
            feedback.status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          <p className="font-semibold">
            {feedback.status === "error"
              ? "Request failed"
              : "Request submitted"}
          </p>
          <p className="mt-1">{feedback.message}</p>
          {feedback.url && (
            <a
              href={feedback.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-medium underline"
            >
              Review pull request
            </a>
          )}
        </div>
      )}
    </div>
  );
}
