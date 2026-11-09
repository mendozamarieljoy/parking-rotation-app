"use client";

import * as React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import type { DateRange } from "react-day-picker";

type CalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
>;

export type DatePickerProps = {
  id?: string;
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: React.ReactNode;
  dateFormat?: string;
  disabled?: boolean;
  className?: string;
  calendarProps?: CalendarProps;
};

export function DatePicker({
  id,
  date,
  onDateChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  disabled = false,
  className,
  calendarProps,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            data-empty={!date}
            className={cn(
              "justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon />
        {date ? format(date, dateFormat) : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          {...calendarProps}
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate);
            if (selectedDate) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export type DateRangePickerProps = {
  id?: string;
  date?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
  min?: number;
  excludeDisabled?: boolean;
  placeholder?: React.ReactNode;
  dateFormat?: string;
  disabled?: boolean;
  className?: string;
  calendarProps?: CalendarProps;
};

export function DateRangePicker({
  id,
  date,
  onDateChange,
  min = 1,
  excludeDisabled = false,
  placeholder = "Pick a date range",
  dateFormat = "PPP",
  disabled = false,
  className,
  calendarProps,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const value = date?.from
    ? date.to
      ? `${format(date.from, dateFormat)} – ${format(date.to, dateFormat)}`
      : format(date.from, dateFormat)
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            data-empty={!date?.from}
            className={cn(
              "justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon />
        {value ?? <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          {...calendarProps}
          mode="range"
          min={min}
          excludeDisabled={excludeDisabled}
          selected={date}
          onSelect={(selectedRange) => {
            onDateChange(selectedRange);
            if (selectedRange?.from && selectedRange.to) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export type MultiDatePickerProps = {
  id?: string;
  dates?: Date[];
  onDatesChange: (dates: Date[] | undefined) => void;
  placeholder?: React.ReactNode;
  dateFormat?: string;
  disabled?: boolean;
  className?: string;
  calendarProps?: CalendarProps;
};

export function MultiDatePicker({
  id,
  dates,
  onDatesChange,
  placeholder = "Pick dates",
  dateFormat = "PP",
  disabled = false,
  className,
  calendarProps,
}: MultiDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const value =
    dates && dates.length > 0
      ? dates
          .slice()
          .sort((left, right) => left.getTime() - right.getTime())
          .map((date) => format(date, dateFormat))
          .join(", ")
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            data-empty={!dates?.length}
            className={cn(
              "h-9 min-h-9 min-w-0 justify-start overflow-hidden text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="shrink-0" />
        <span className="min-w-0 flex-1 truncate whitespace-nowrap" title={value}>
          {value ?? placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          {...calendarProps}
          mode="multiple"
          selected={dates}
          onSelect={onDatesChange}
        />
      </PopoverContent>
    </Popover>
  );
}
