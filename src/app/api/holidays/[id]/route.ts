import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { holidayDateFields } from "@/lib/holiday-data";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  let actor;
  try { actor = await requireAdmin(); } catch {
    return Response.json({ error: "Account storage is unavailable" }, { status: 503 });
  }
  if (!actor) return Response.json({ error: "Admin login required" }, { status: 401 });
  const { id } = await context.params;
  let data;
  try {
    data = holidayDateFields(await request.json());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid holiday" }, { status: 400 });
  }
  try {
    const holiday = await db.$transaction(async (tx) => {
      const updated = await tx.holiday.update({ where: { id }, data });
      await tx.holidayAudit.create({ data: { action: "UPDATE", holidayId: id, actorId: actor.id, snapshot: { ...data, date: data.date?.toISOString() ?? null } } });
      return updated;
    });
    return Response.json(holiday);
  } catch {
    return Response.json({ error: "Holiday was not found or storage is unavailable" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  let actor;
  try { actor = await requireAdmin(); } catch {
    return Response.json({ error: "Account storage is unavailable" }, { status: 503 });
  }
  if (!actor) return Response.json({ error: "Admin login required" }, { status: 401 });
  const { id } = await context.params;
  try {
    await db.$transaction(async (tx) => {
      const holiday = await tx.holiday.findUniqueOrThrow({ where: { id } });
      await tx.holidayAudit.create({ data: { action: "DELETE", holidayId: id, actorId: actor.id, snapshot: { name: holiday.name, type: holiday.type, date: holiday.date?.toISOString() ?? null, month: holiday.month, day: holiday.day } } });
      await tx.holiday.delete({ where: { id } });
    });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Holiday was not found or storage is unavailable" }, { status: 404 });
  }
}
