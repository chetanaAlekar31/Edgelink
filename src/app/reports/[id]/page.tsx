import { ReportDetailPage } from "@/components/reports/report-detail-page";

type ReportDetailRouteProps = {
  params: { id: string };
};

export default function ReportDetailRoute({ params }: ReportDetailRouteProps) {
  return <ReportDetailPage reportId={params.id} />;
}
