import { ReportsPage, type ReportsPhase } from "@/components/reports/reports-page";

type ReportsRouteProps = {
  searchParams: {
    view?: string;
  };
};

function resolvePhase(view: string | undefined): ReportsPhase {
  if (view === "loading" || view === "empty" || view === "error") {
    return view;
  }

  return "ready";
}

export default function ReportsRoute({ searchParams }: ReportsRouteProps) {
  return <ReportsPage phase={resolvePhase(searchParams.view)} />;
}
