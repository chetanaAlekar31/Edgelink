import { AuditDetailPage } from "@/components/audits/audit-detail-page";

type AuditDetailRouteProps = {
  params: { id: string };
};

export default function AuditDetailRoute({ params }: AuditDetailRouteProps) {
  return <AuditDetailPage auditId={params.id} />;
}
