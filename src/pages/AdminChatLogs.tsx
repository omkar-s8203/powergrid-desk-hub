import { AdminLayout } from '@/components/admin/AdminLayout';
import { ChatLogsViewer } from '@/components/admin/ChatLogsViewer';

export default function AdminChatLogs() {
  return (
    <AdminLayout>
      <ChatLogsViewer />
    </AdminLayout>
  );
}
