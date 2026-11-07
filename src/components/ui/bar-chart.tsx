"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

export type BarPoint = {
  label: string;
  value: number;
};

type BarChartPanelProps = {
  data: BarPoint[];
  label: string;
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  allowDecimals?: boolean;
};

const tooltipStyle = {
  background: "var(--cs-surface)",
  border: "1px solid var(--cs-border)",
  borderRadius: "var(--cs-radius)",
  color: "var(--cs-foreground)",
};

export function BarChartPanel({
  data,
  label,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  allowDecimals = true,
}: BarChartPanelProps) {
  if (isLoading) {
    return <LoadingState label={`Loading ${label}`} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="cs-chart" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--cs-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--cs-muted)", fontSize: 10 }} interval={0} />
          <YAxis allowDecimals={allowDecimals} tick={{ fill: "var(--cs-muted)", fontSize: 10 }} width={36} />
          <Tooltip contentStyle={tooltipStyle} cursor={false} />
          <Bar dataKey="value" name={label} fill="var(--cs-accent)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
