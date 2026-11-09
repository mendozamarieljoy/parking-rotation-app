"use client";

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parkingConfig } from "@/lib/config";
import Link from "next/link";

export default function ManageHoliday() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <Link
          href="/parking/requests"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          &larr; Request center
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Holiday management</h1>
        <p className="text-slate-600">
          Add a holiday to the parking rotation calendar. Holidays recur each
          year on the selected month and day.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <RequestForm
          kind="holiday"
          title="Add a holiday"
          description="The change will be proposed for review as a pull request."
          submitLabel="Submit holiday"
        >
          <Label className="flex flex-col items-start gap-2">
            Holiday name
            <Input name="name" type="text" required maxLength={100} />
          </Label>
          <Label className="flex flex-col items-start gap-2">
            Date
            <Input name="date" type="date" required />
          </Label>
        </RequestForm>

        <Card>
          <CardHeader>
            <CardTitle>Configured holidays</CardTitle>
            <CardDescription>
              These holidays currently affect the parking rotation schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Holiday</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...parkingConfig.holidays]
                  .sort(
                    (a, b) => a.month - b.month || a.day - b.day,
                  )
                  .map((holiday) => (
                    <TableRow key={`${holiday.month}-${holiday.day}-${holiday.holidayName}`}>
                      <TableCell>
                        {new Intl.DateTimeFormat(undefined, {
                          month: "long",
                          day: "numeric",
                          timeZone: "UTC",
                        }).format(
                          new Date(Date.UTC(2024, holiday.month - 1, holiday.day)),
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {holiday.holidayName}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
