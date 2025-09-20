import { AdminLayout } from '@/components/admin/AdminLayout';
import { TicketAnalytics } from '@/components/analytics/TicketAnalytics';

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
        <TicketAnalytics />
      </div>
    </AdminLayout>
  );
};

export default AdminReports;