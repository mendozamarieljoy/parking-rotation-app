import { HolidayType } from "@prisma/client";
import { db } from "./db";

export type HolidayRecord = {
  id: string;
  name: string;
  type: "EXACT" | "ANNUAL";
  date: string | null;
  month: number | null;
  day: number | null;
};

export async function listHolidays(): Promise<HolidayRecord[]> {
  const stored = await db.holiday.findMany({ orderBy: [{ type: "asc" }, { date: "asc" }, { month: "asc" }, { day: "asc" }] });
  return stored.map((holiday) => ({
    id: holiday.id,
    name: holiday.name,
    type: holiday.type,
    date: holiday.date?.toISOString().slice(0, 10) ?? null,
    month: holiday.month,
    day: holiday.day,
  }));
}

export function holidayDateFields(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Request body must be an object");
  const value = input as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 120) throw new Error("Name must be between 1 and 120 characters");
  if (value.type === "EXACT") {
    if (typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) throw new Error("Exact holidays require a YYYY-MM-DD date");
    const date = new Date(`${value.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.date) throw new Error("Date is invalid");
    return { name, type: HolidayType.EXACT, date, month: null, day: null };
  }
  if (value.type === "ANNUAL") {
    const month = Number(value.month);
    const day = Number(value.day);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) throw new Error("Annual holidays require a valid month and day");
    const check = new Date(Date.UTC(2000, month - 1, day));
    if (check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) throw new Error("Annual holiday date is invalid");
    return { name, type: HolidayType.ANNUAL, date: null, month, day };
  }
  throw new Error("Type must be EXACT or ANNUAL");
}

export function holidayMatchesDate(holiday: HolidayRecord, year: number, month: number, day: number) {
  if (holiday.type === "ANNUAL") return holiday.month === month && holiday.day === day;
  return holiday.date === `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
