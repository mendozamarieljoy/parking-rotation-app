import { NextResponse } from "next/server";
import { usersList } from "../../../../lib/config";
import { generateSchedule } from "../../../../lib/scheduler";
import type { Slot } from "../../../../lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function getDateKey(value: unknown): string | null {
  if (typeof value !== "string") return null;

  if (ISO_DATE.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? value
      : null;
  }

  if (!ISO_DATETIME.test(value)) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const dateKey = date.toISOString().slice(0, 10);
  return getDateKey(dateKey);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      { error: "Request body must contain a date." },
      { status: 400 },
    );
  }

  const body = payload as Record<string, unknown>;
  const date = getDateKey(body.date);
  const user = body.user;

  if (!date) {
    return NextResponse.json(
      { error: "A valid date is required." },
      { status: 400 },
    );
  }

  if (
    user !== undefined &&
    (typeof user !== "string" ||
      !usersList.some((existingUser) => existingUser === user))
  ) {
    return NextResponse.json(
      { error: "The user must be an existing user." },
      { status: 400 },
    );
  }

  const [year, month] = date.split("-").map(Number);
  const daySchedule = generateSchedule(year, month - 1).find(
    (day) => day.date === date,
  );
  if (!daySchedule) return NextResponse.json(null);

  if (user === undefined) {
    const assignedUsers = usersList.flatMap((assignedUser) => {
      const slots = (Object.entries(daySchedule.slots) as [
        Slot,
        (typeof daySchedule.slots)[Slot],
      ][])
        .filter(
          ([, assignment]) =>
            assignment?.primary === assignedUser ||
            assignment?.backup === assignedUser,
        )
        .map(([slot]) => slot);

      return slots.length ? [{ user: assignedUser, slots }] : [];
    });

    return NextResponse.json(assignedUsers);
  }

  const matchingSlot = (Object.entries(daySchedule.slots) as [
    Slot,
    (typeof daySchedule.slots)[Slot],
  ][]).find(
    ([, assignment]) =>
      assignment?.primary === user || assignment?.backup === user,
  );
  if (!matchingSlot?.[1]) return NextResponse.json(null);

  const [slot, assignment] = matchingSlot;
  return NextResponse.json({
    date: daySchedule.date,
    slot: slot === "27" ? 27 : 28,
    assignment,
  });
}
