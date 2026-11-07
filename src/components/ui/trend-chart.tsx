"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/ui/empty-state";

export type TrendPoint = {
  label: string;
  value: number;
};

type TrendChartProps = {
  data: TrendPoint[];
  label: string;
  emptyTitle?: string;
  emptyDescription?: string;
  domain?: [number, number];
  bare?: boolean;
};

const tooltipStyle = {
  background: "var(--cs-surface)",
  border: "1px solid var(--cs-border)",
  borderRadius: "var(--cs-radius)",
  color: "var(--cs-foreground)",
};

export function TrendChart({
  data,
  label,
  emptyTitle = "No trend yet",
  emptyDescription = "A chart will appear here after audit results are stored.",
  domain,
  bare = false,
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={bare ? undefined : "cs-card"}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={bare ? "cs-chart" : "cs-card cs-chart"} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--cs-border)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--cs-muted)" tick={{ fill: "var(--cs-muted)", fontSize: 10 }} />
          <YAxis
            domain={domain}
            stroke="var(--cs-muted)"
            tick={{ fill: "var(--cs-muted)", fontSize: 10 }}
            width={32}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke="var(--cs-accent)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--cs-accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
