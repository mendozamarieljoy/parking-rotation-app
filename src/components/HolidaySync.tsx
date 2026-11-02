"use client";

import { useEffect } from "react";
import { setRuntimeHolidays } from "@/lib/runtime-holidays";
import { useParkingStore } from "@/lib/store";

export default function HolidaySync() {
  const regenerateSchedule = useParkingStore((state) => state.regenerateSchedule);
  useEffect(() => {
    let active = true;
    fetch("/api/holidays")
      .then((response) => response.ok ? response.json() : [])
      .then((holidays) => {
        if (!active || !Array.isArray(holidays)) return;
        setRuntimeHolidays(holidays);
        regenerateSchedule();
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [regenerateSchedule]);
  return null;
}
