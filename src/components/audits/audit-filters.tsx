"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { auditStatuses, auditStatusLabel } from "@/lib/audits";

export const auditListFilterSchema = z
  .object({
    query: z.string().trim().max(120, "Search must be 120 characters or fewer."),
    status: z.enum(["all", ...auditStatuses]),
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

export type AuditListFilterValues = z.infer<typeof auditListFilterSchema>;

export const defaultAuditListFilters: AuditListFilterValues = {
  query: "",
  status: "all",
  from: "",
  to: "",
};

type AuditFiltersProps = {
  values: AuditListFilterValues;
  onApply: (values: AuditListFilterValues) => void;
};

export function AuditFilters({ values, onApply }: AuditFiltersProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuditListFilterValues>({
    resolver: zodResolver(auditListFilterSchema),
    defaultValues: values,
    values,
  });

  return (
    <form className="cs-card cs-filters" onSubmit={handleSubmit(onApply)} noValidate>
      <div className="cs-filter-grid">
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="audit-list-search">
            Search
          </label>
          <input
            id="audit-list-search"
            className="cs-input"
            type="search"
            placeholder="Search by client or website"
            {...register("query")}
          />
          {errors.query ? <p className="cs-field-error">{errors.query.message}</p> : null}
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="audit-list-status">
            Status
          </label>
          <select id="audit-list-status" className="cs-input" {...register("status")}>
            <option value="all">All statuses</option>
            {auditStatuses.map((status) => (
              <option key={status} value={status}>
                {auditStatusLabel[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="audit-list-from">
            Created from
          </label>
          <input id="audit-list-from" className="cs-input" type="date" {...register("from")} />
        </div>
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="audit-list-to">
            Created to
          </label>
          <input id="audit-list-to" className="cs-input" type="date" {...register("to")} />
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
            reset(defaultAuditListFilters);
            onApply(defaultAuditListFilters);
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
