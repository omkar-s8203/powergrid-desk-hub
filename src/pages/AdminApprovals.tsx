import { AdminLayout } from '@/components/admin/AdminLayout';
import { PendingUserApprovals } from '@/components/admin/PendingUserApprovals';

const AdminApprovals = () => {
  return (
    <AdminLayout>
      <PendingUserApprovals />
    </AdminLayout>
  );
};

export default AdminApprovals;
