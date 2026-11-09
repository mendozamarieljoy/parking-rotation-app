"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";

export default function RequestsPage() {
  const pages = [
    {
      category: "Users requests",
      pages: [
        {
          label: "Swap Schedule",
          description:
            "Request to exchange your assigned parking schedule with another user.",
          href: "/parking/requests/swap",
        },
        {
          label: "Unavailable Dates",
          description:
            "Mark dates when you are unavailable for parking assignments.",
          href: "/parking/requests/block-dates",
        },
      ],
    },
    {
      category: "Admin Management",
      pages: [
        {
          label: "Holiday Management",
          description:
            "View and manage holidays that affect the parking rotation schedule.",
          href: "/parking/requests/holiday",
        },
        {
          label: "User Management",
          description: "Manage users for the parking system.",
          href: "/parking/requests/users",
        },
        {
          label: "Schedule Rules",
          description:
            "View and manage the rules that govern parking slot assignments and rotation schedules.",
          href: "/parking/requests/schedule",
        },
        {
          label: "Pending Requests",
          description:
            "View submitted requests that are awaiting review, approval, or merging. Track their status and progress until the changes are applied.",
          href: "/parking/requests/pending",
        },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Request center</h1>
        <p>
          Browse available requests and management tools for the parking
          rotation system.
        </p>
        <p className="text-sm text-muted-foreground">
          Submitted requests create a GitHub Pull Request for review. Changes
          will only take effect after the Pull Request is approved and merged.
        </p>
      </div>
      {pages.map((section) => (
        <div key={section.category}>
          <h2 className="text-2xl font-bold mb-4">{section.category}</h2>
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.pages.map((page) => (
              <Link key={page.label} href={page.href} className="group h-full">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center justify-between gap-x-4">
                      {page.label}
                      <ArrowRightIcon />
                    </CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
