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
          label: "Swap Request",
          description:
            "Submit a request to swap your parking slot `with another user.",
          href: "/parking/requests/swap",
        },
        {
          label: "Block dates",
          description: "Block specific dates for parking slot usage.",
          href: "/parking/requests/block-dates",
        },
      ],
    },
    {
      category: "Admin requests",
      pages: [
        {
          label: "Holidays",
          description: "View and manage holiday schedules for parking slots.",
          href: "/parking/requests/holiday",
        },
        {
          label: "Users",
          description:
            "Manage user accounts and permissions for the parking system.",
          href: "/parking/requests/users",
        },
        {
          label: "Schedule",
          description: "View and manage the parking slot schedule.",
          href: "/parking/requests/schedule",
        },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
