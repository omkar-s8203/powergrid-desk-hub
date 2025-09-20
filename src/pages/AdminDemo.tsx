import { AdminLayout } from '@/components/admin/AdminLayout';
import { ChatBotDemo } from '@/components/demo/ChatBotDemo';

const AdminDemo = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbot Intelligence Demo</h1>
          <p className="text-muted-foreground">
            See how the AI chatbot automatically validates and routes employee issues to specialists.
          </p>
        </div>
        <ChatBotDemo />
      </div>
    </AdminLayout>
  );
};

export default AdminDemo;