"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { clientFormSchema, type ClientFormValues } from "@/lib/clients";

type ClientFormProps = {
  formId: string;
  defaultValues: ClientFormValues;
  submitLabel: string;
  onSubmit: (values: ClientFormValues) => void;
  onCancel: () => void;
};

export function ClientForm({ formId, defaultValues, submitLabel, onSubmit, onCancel }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  return (
    <form className="cs-form" id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor={`${formId}-name`}>
          Client name
        </label>
        <input id={`${formId}-name`} className="cs-input" type="text" {...register("name")} />
        {errors.name ? <p className="cs-field-error">{errors.name.message}</p> : null}
      </div>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor={`${formId}-website`}>
          Website URL
        </label>
        <input id={`${formId}-website`} className="cs-input" type="url" placeholder="https://" {...register("websiteUrl")} />
        {errors.websiteUrl ? <p className="cs-field-error">{errors.websiteUrl.message}</p> : null}
      </div>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor={`${formId}-contact`}>
          Contact person
        </label>
        <input id={`${formId}-contact`} className="cs-input" type="text" {...register("contactPerson")} />
        {errors.contactPerson ? <p className="cs-field-error">{errors.contactPerson.message}</p> : null}
      </div>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor={`${formId}-email`}>
          Email
        </label>
        <input id={`${formId}-email`} className="cs-input" type="email" {...register("email")} />
        {errors.email ? <p className="cs-field-error">{errors.email.message}</p> : null}
      </div>
      <div className="cs-field">
        <label className="cs-caption cs-field-label" htmlFor={`${formId}-phone`}>
          Phone number
        </label>
        <input id={`${formId}-phone`} className="cs-input" type="tel" {...register("phone")} />
        {errors.phone ? <p className="cs-field-error">{errors.phone.message}</p> : null}
      </div>
      <div className="cs-filter-actions">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
