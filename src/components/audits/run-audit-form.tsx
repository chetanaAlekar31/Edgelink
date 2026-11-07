"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  auditTypeLabel,
  auditTypes,
  auditUsesKeyword,
  auditUsesStrategy,
  emptyRunAuditValues,
  runAuditSchema,
  type RunAuditValues,
} from "@/lib/audits";
import type { ClientRecord } from "@/lib/clients";

type RunAuditFormProps = {
  clients: ClientRecord[];
  onSubmit: (values: RunAuditValues) => void;
  onCancel: () => void;
};

export function RunAuditForm({ clients, onSubmit, onCancel }: RunAuditFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RunAuditValues>({
    resolver: zodResolver(runAuditSchema),
    defaultValues: emptyRunAuditValues,
  });
  const auditType = watch("auditType");
  const showStrategy = auditUsesStrategy(auditType);
  const showKeyword = auditUsesKeyword(auditType);

  return (
    <form className="cs-form" id="run-audit" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor="run-audit-client">
          Select client
        </label>
        <select
          id="run-audit-client"
          className="cs-input"
          {...register("clientId", {
            onChange: (event) => {
              const client = clients.find((item) => item.id === event.target.value);
              if (client) {
                setValue("websiteUrl", client.websiteUrl, { shouldValidate: true });
              }
            },
          })}
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {errors.clientId ? <p className="cs-field-error">{errors.clientId.message}</p> : null}
      </div>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor="run-audit-website">
          Website URL
        </label>
        <input id="run-audit-website" className="cs-input" type="url" placeholder="https://" {...register("websiteUrl")} />
        {errors.websiteUrl ? <p className="cs-field-error">{errors.websiteUrl.message}</p> : null}
      </div>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor="run-audit-type">
          Audit type
        </label>
        <select id="run-audit-type" className="cs-input" {...register("auditType")}>
          {auditTypes.map((type) => (
            <option key={type} value={type}>
              {auditTypeLabel[type]}
            </option>
          ))}
        </select>
        {errors.auditType ? <p className="cs-field-error">{errors.auditType.message}</p> : null}
      </div>
      {showStrategy ? (
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="run-audit-strategy">
            PageSpeed strategy
          </label>
          <select id="run-audit-strategy" className="cs-input" {...register("strategy")}>
            <option value="">No strategy override</option>
            <option value="mobile">mobile</option>
            <option value="desktop">desktop</option>
          </select>
          <p className="cs-caption">Optional. The assessment fixture uses mobile.</p>
        </div>
      ) : null}
      {showKeyword ? (
        <div className="cs-field">
          <label className="cs-caption cs-field-label" htmlFor="run-audit-keyword">
            Rankings keyword
          </label>
          <input id="run-audit-keyword" className="cs-input" type="text" {...register("keyword")} />
          {errors.keyword ? <p className="cs-field-error">{errors.keyword.message}</p> : null}
          <p className="cs-caption">Optional. Used by the DataForSEO rankings step.</p>
        </div>
      ) : null}
      <div className="cs-filter-actions">
        <Button type="submit" variant="primary">
          Queue audit
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
