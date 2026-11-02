import type { HolidayRecord } from "./holiday-data";

let runtimeHolidays: HolidayRecord[] = [];

export function setRuntimeHolidays(holidays: HolidayRecord[]) {
  runtimeHolidays = holidays;
}

export function getRuntimeHolidays() {
  return runtimeHolidays;
}
