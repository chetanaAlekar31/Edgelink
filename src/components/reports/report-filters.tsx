"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { ClientRecord } from "@/lib/clients";
import { reportStatuses, reportStatusLabel } from "@/lib/reports";

export const reportFilterSchema = z
  .object({
    query: z.string().trim().max(120, "Search must be 120 characters or fewer."),
    clientId: z.string(),
    status: z.enum(["all", ...reportStatuses]),
    from: z.string(),
    to: z.string(),
  })
  .superRefine((value, context) => {
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export type ReportFilterValues = z.infer<typeof reportFilterSchema>;

export const defaultReportFilters: ReportFilterValues = {
  query: "",
  clientId: "all",
  status: "all",
  from: "",
  to: "",
};

type ReportFiltersProps = {
  clients: ClientRecord[];
  values: ReportFilterValues;
  onApply: (values: ReportFilterValues) => void;
};

export function ReportFilters({ clients, values, onApply }: ReportFiltersProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: values,
    values,
  });

  return (
    <form className="cs-card cs-filters" onSubmit={handleSubmit(onApply)} noValidate>
      <div className="cs-filter-grid">
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="report-search">
            Search
          </label>
          <input
            id="report-search"
            className="cs-input"
            type="search"
            placeholder="Search by client, domain, or report ID"
            {...register("query")}
          />
          {errors.query ? <p className="cs-field-error">{errors.query.message}</p> : null}
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="report-client">
            Client
          </label>
          <select id="report-client" className="cs-input" {...register("clientId")}>
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="report-status">
            Status
          </label>
          <select id="report-status" className="cs-input" {...register("status")}>
            <option value="all">All statuses</option>
            {reportStatuses.map((status) => (
              <option key={status} value={status}>
                {reportStatusLabel[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="report-from">
            Generated from
          </label>
          <input id="report-from" className="cs-input" type="date" {...register("from")} />
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="report-to">
            Generated to
          </label>
          <input id="report-to" className="cs-input" type="date" {...register("to")} />
          {errors.to ? <p className="cs-field-error">{errors.to.message}</p> : null}
        </div>
      </div>
      <div className="cs-filter-actions">
        <Button type="submit" variant="primary">
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset(defaultReportFilters);
            onApply(defaultReportFilters);
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
