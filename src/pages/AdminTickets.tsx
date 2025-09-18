import { AdminLayout } from '@/components/admin/AdminLayout';
import { TicketManagement } from '@/components/admin/TicketManagement';

const AdminTickets = () => {
  return (
    <AdminLayout>
      <TicketManagement />
    </AdminLayout>
  );
};

export default AdminTickets;