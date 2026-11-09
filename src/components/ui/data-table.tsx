"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { FunnelIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
};

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  filterOptions?: { label: string; value: string }[];
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  filterOptions,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const filterValue = column.getFilterValue();
  const selectedValues =
    Array.isArray(filterValue) &&
    filterValue.every((value): value is string => typeof value === "string")
      ? filterValue
      : [];

  return (
    <div className="flex items-center gap-1">
      {column.getCanSort() ? (
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          className="inline-flex items-center gap-2 font-medium hover:text-foreground"
        >
          {title}
          <span aria-hidden="true" className="text-xs">
            {column.getIsSorted() === "asc"
              ? "↑"
              : column.getIsSorted() === "desc"
                ? "↓"
                : "↕"}
          </span>
        </button>
      ) : (
        title
      )}
      {filterOptions && (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Filter ${title}`}
                title={`Filter ${title}`}
                aria-pressed={selectedValues.length > 0}
                className={
                  selectedValues.length > 0
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              />
            }
          >
            <FunnelIcon aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-56 max-w-[calc(100vw-2rem)] gap-2 p-2"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="font-medium">Filter {title}</p>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => column.setFilterValue(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {filterOptions.map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const nextValues = checked
                          ? selectedValues.filter(
                              (value) => value !== option.value,
                            )
                          : [...selectedValues, option.value];
                        column.setFilterValue(
                          nextValues.length ? nextValues : undefined,
                        );
                      }}
                      className="size-4 accent-primary"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results.",
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // TanStack table instances expose callbacks that React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="w-full min-w-0 space-y-4">
      <Table className="min-w-[42rem]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-auto py-3">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground sm:hidden">
        Scroll the table horizontally to see all columns.
      </p>
      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {table.getFilteredRowModel().rows.length} request(s)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <div className="flex flex-1 gap-2 sm:flex-none">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="min-h-10 flex-1 rounded-md border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="min-h-10 flex-1 rounded-md border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
