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

export type DatePickerProps = {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: React.ReactNode;
  dateFormat?: string;
  disabled?: boolean;
  className?: string;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect"
  >;
};

export function DatePicker({
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
