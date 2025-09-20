import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ChatBot } from "@/components/chatbot/ChatBot";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminTickets from "./pages/AdminTickets";
import AdminReports from "./pages/AdminReports";
import Employee from "./pages/Employee";
import CreateTicket from "./pages/CreateTicket";
import EmployeeTickets from "./pages/EmployeeTickets";
import EmployeeReports from "./pages/EmployeeReports";
import Helpdesk from "./pages/Helpdesk";
import HelpdeskTickets from "./pages/HelpdeskTickets";
import HelpdeskReports from "./pages/HelpdeskReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/:userType" element={<Login />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/employee" element={<Employee />} />
            <Route path="/employee/create" element={<CreateTicket />} />
            <Route path="/employee/tickets" element={<EmployeeTickets />} />
            <Route path="/employee/reports" element={<EmployeeReports />} />
            <Route path="/helpdesk" element={<Helpdesk />} />
            <Route path="/helpdesk/tickets" element={<HelpdeskTickets />} />
            <Route path="/helpdesk/reports" element={<HelpdeskReports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
