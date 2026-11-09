"use client";

import { useParkingStore } from "@/lib/store";
import { Slot } from "@/lib/types";

import dayjs from "dayjs";
import { useState } from "react";
import Modal from "./Modal";
import { getNext12Months } from "@/lib/utils";
import ParkingSlotWrapper from "./ParkingSlotWrapper";
import SchedulerControls from "./SchedulerControls";
import FilterByUser from "./FilterByUser";
import CompactMode from "./CompactMode";

export default function Calendar() {
  const availableMonths = getNext12Months();

  const { skipPrimary, setDate, selectedMonth, selectedYear } =
    useParkingStore();

  const [toSkipSlot, setToSkipSlot] = useState<{
    date: string;
    slot: Slot;
  } | null>(null);

  const daysInWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // Get April 2026 calendar
  const year = selectedYear;
  const month = selectedMonth; // Month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarDays: (Date | null)[] = [];
  const current = new Date(startDate);
  while (current <= lastDay || calendarDays.length % 7 !== 0) {
    if (current.getMonth() === month) {
      calendarDays.push(new Date(current));
    } else {
      calendarDays.push(null);
    }
    current.setDate(current.getDate() + 1);
  }

  const weekdayCalendarDays = [] as (Date | null)[];
  for (let i = 0; i < calendarDays.length; i += 7) {
    const week = calendarDays.slice(i, i + 7);
    week.forEach((date, idx) => {
      // keep only Mon-Fri
      if (idx >= 1 && idx <= 5) {
        weekdayCalendarDays.push(date);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 bg-white px-6 py-4 rounded-lg shadow-md mb-4">
        <div className="">
          <label
            htmlFor="month-select"
            className="font-mono font-medium text-gray-700 uppercase text-xs"
          >
            Select a month
          </label>
          <select
            id="month-select"
            className="w-full outline-none py-2 border-b bg-transparent cursor-pointer"
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              setDate(year, month);
            }}
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <SchedulerControls />
      </div>
      <div
        id="parking-schedule-calendar"
        className="bg-white p-6 rounded-lg shadow-md overflow-x-auto hidden md:block"
      >
        <div className="flex justify-between text-2xl font-sans border-b border-gray-100 text-slate-800 font-bold text-center uppercase pb-4 mb-4">
          <h2>
            {dayjs(`${selectedYear}-${selectedMonth + 1}-01`).format("MMMM")}
          </h2>
          <FilterByUser />
          <h2>{selectedYear}</h2>
        </div>
        <div className="grid grid-cols-5 gap-4 min-w-400 max-w-full">
          {daysInWeek.map((day) => (
            <div
              key={day}
              className="text-center font-semibold p-2 border-b border-slate-300"
            >
              {day}
            </div>
          ))}
          {weekdayCalendarDays.map((date, index) => {
            const datePassed = dayjs(date).isBefore(dayjs(), "day");
            const isToday = dayjs(date).isSame(dayjs(), "day");

            const bgColor = datePassed
              ? "bg-slate-100 opacity-50 cursor-not-allowed"
              : isToday
                ? "bg-yellow-50 border-yellow-300"
                : "bg-white";

            return (
              <div
                key={index}
                className={`min-h-32 ${date && `${bgColor} p-4 border border-slate-200 shadow rounded-lg hover:ring-2 hover:ring-amber-200 hover:scale-105 transition-all duration-200`}`}
              >
                {date && (
                  <>
                    <div className="text-sm font-sans font-semibold mb-1 text-black">
                      {date.getDate()}
                    </div>
                    <ParkingSlotWrapper
                      date={date}
                      innerClassName="max-w-1/2"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <CompactMode />
      <Modal
        isOpen={!!toSkipSlot}
        title={`Skip parking for ${dayjs(toSkipSlot?.date).format("MMMM D, YYYY")}
                    slot ${toSkipSlot?.slot}?`}
        body="If you don't need this slot, we'll swap your assignment to find you a better time later."
        confirmLabel="Skip"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (toSkipSlot) {
            skipPrimary(toSkipSlot.date, toSkipSlot.slot);
            setToSkipSlot(null);
          }
        }}
        onCancel={() => setToSkipSlot(null)}
      />
    </>
  );
}
