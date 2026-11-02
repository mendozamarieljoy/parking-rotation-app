import { parkingConfig } from "./config";
import { User } from "./types";
import { getRuntimeHolidays } from "./runtime-holidays";

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function isAvailable(user: User, date: Date): boolean {
  return !parkingConfig.users[user].unavailableWeekdays.includes(
    date.getDay(),
  );
}

export function calculateFairnessScore(stats: {
  primary: number;
  backup: number;
}): number {
  return (
    stats.primary * parkingConfig.fairness.primaryWeight +
    stats.backup * parkingConfig.fairness.backupWeight
  );
}

export function calculateBenefitScore(primary: number, backup: number): number {
  return (
    primary * parkingConfig.benefitScore.primaryWeight +
    backup * parkingConfig.benefitScore.backupWeight
  );
}

export function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1; // 1-based
  const day = date.getDate();
  const year = date.getFullYear();
  return getRuntimeHolidays().some((holiday) => holiday.type === "ANNUAL"
      ? holiday.month === month && holiday.day === day
      : holiday.date === `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

export function getHolidayName(date: Date): string | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const holiday = getRuntimeHolidays().find((item) => item.type === "ANNUAL"
    ? item.month === month && item.day === day
    : item.date === `${date.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  return holiday?.name ?? null;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export type MonthOption = {
  year: number;
  month: number; // 1-12
  label: string;
  value: string; // "2026-4"
};

export function getNext12Months(fromDate = new Date()): MonthOption[] {
  const result: MonthOption[] = [];

  const year = fromDate.getFullYear();
  const month = fromDate.getMonth(); // 0-based

  for (let i = 0; i < 12; i++) {
    const date = new Date(year, month + i, 1);

    const y = date.getFullYear();
    const m = date.getMonth();

    result.push({
      year: y,
      month: m,
      label: date.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      value: `${y}-${m}`,
    });
  }

  return result;
}
