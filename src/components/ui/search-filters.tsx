"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";

export const auditFilterSchema = z.object({
  query: z.string().trim().max(120, "Search must be 120 characters or fewer"),
  status: z.enum(["all", "completed", "failed", "pending"]),
});

export type AuditFilterValues = z.infer<typeof auditFilterSchema>;

export const defaultAuditFilters: AuditFilterValues = {
  query: "",
  status: "all",
};

type SearchFiltersProps = {
  values: AuditFilterValues;
  onApply: (values: AuditFilterValues) => void;
  searchId?: string;
  statusId?: string;
  searchPlaceholder?: string;
};

export function SearchFilters({
  values,
  onApply,
  searchId = "audit-search",
  statusId = "audit-status",
  searchPlaceholder = "Search by website",
}: SearchFiltersProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuditFilterValues>({
    resolver: zodResolver(auditFilterSchema),
    defaultValues: values,
    values,
  });

  return (
    <form
      className="cs-card cs-filters"
      onSubmit={handleSubmit((nextValues) => onApply(nextValues))}
      noValidate
    >
      <div className="cs-filter-grid">
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor={searchId}>
            Search
          </label>
          <input
            id={searchId}
            className="cs-input"
            type="search"
            placeholder={searchPlaceholder}
            {...register("query")}
          />
          {errors.query ? <p className="cs-field-error">{errors.query.message}</p> : null}
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor={statusId}>
            Status
          </label>
          <select id={statusId} className="cs-input" {...register("status")}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
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
            reset(defaultAuditFilters);
            onApply(defaultAuditFilters);
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
