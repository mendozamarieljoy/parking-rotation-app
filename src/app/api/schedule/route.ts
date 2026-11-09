import { NextResponse } from "next/server";
import { usersList } from "../../../lib/config";
import { generateSchedule } from "../../../lib/scheduler";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const date = searchParams.get("date");
  const user = searchParams.get("user");

  if (
    !date ||
    !isValidDate(date) ||
    !user ||
    !usersList.some((existingUser) => existingUser === user)
  ) {
    return NextResponse.json(
      {
        error:
          "A valid date in YYYY-MM-DD format and an existing user are required.",
      },
      { status: 400 },
    );
  }

  const [year, month] = date.split("-").map(Number);
  const daySchedule = generateSchedule(year, month - 1).find(
    (day) => day.date === date,
  );

  if (!daySchedule) {
    return NextResponse.json(
      { error: `No schedule found for ${date}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...daySchedule,
    slots: Object.fromEntries(
      Object.entries(daySchedule.slots).map(([slot, assignment]) => [
        slot,
        assignment?.primary === user || assignment?.backup === user
          ? assignment
          : null,
      ]),
    ),
  });
}
