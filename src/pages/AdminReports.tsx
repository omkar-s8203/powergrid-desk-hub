import { AdminLayout } from '@/components/admin/AdminLayout';
import { TicketAnalytics } from '@/components/analytics/TicketAnalytics';
import { PendingTicketsOverview } from '@/components/admin/PendingTicketsOverview';

const AdminReports = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into ticket management and system performance.
          </p>
        </div>
        <PendingTicketsOverview />
        <TicketAnalytics />
      </div>
    </AdminLayout>
  );
};

export default AdminReports;