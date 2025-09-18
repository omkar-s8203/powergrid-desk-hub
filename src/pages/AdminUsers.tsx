import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserManagement } from '@/components/admin/UserManagement';

const AdminUsers = () => {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
};

export default AdminUsers;