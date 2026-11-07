import { ClientDashboard } from "@/components/clients/client-dashboard";

type ClientDashboardRouteProps = {
  params: { id: string };
};

export default function ClientDashboardRoute({ params }: ClientDashboardRouteProps) {
  return <ClientDashboard clientId={params.id} />;
}
