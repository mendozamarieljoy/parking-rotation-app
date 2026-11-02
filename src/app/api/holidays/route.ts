import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { holidayDateFields, listHolidays } from "@/lib/holiday-data";

export async function GET() {
  try {
    return Response.json(await listHolidays());
  } catch {
    return Response.json({ error: "Holiday storage is unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let actor;
  try { actor = await requireAdmin(); } catch {
    return Response.json({ error: "Account storage is unavailable" }, { status: 503 });
  }
  if (!actor) return Response.json({ error: "Admin login required" }, { status: 401 });
  let data;
  try {
    data = holidayDateFields(await request.json());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid holiday" }, { status: 400 });
  }
  try {
    const holiday = await db.$transaction(async (tx) => {
      const created = await tx.holiday.create({ data });
      await tx.holidayAudit.create({ data: { action: "CREATE", holidayId: created.id, actorId: actor.id, snapshot: { ...data, date: data.date?.toISOString() ?? null } } });
      return created;
    });
    return Response.json(holiday, { status: 201 });
  } catch {
    return Response.json({ error: "Holiday storage is unavailable" }, { status: 503 });
  }
}
