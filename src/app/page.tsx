import { DashboardHome, type DashboardPhase } from "@/components/dashboard/dashboard-home";

type HomeProps = {
  searchParams: {
    view?: string;
  };
};

function resolvePhase(view: string | undefined): DashboardPhase {
  if (view === "loading" || view === "empty" || view === "error") {
    return view;
  }

  return "ready";
}

export default function Home({ searchParams }: HomeProps) {
  return <DashboardHome phase={resolvePhase(searchParams.view)} />;
}
