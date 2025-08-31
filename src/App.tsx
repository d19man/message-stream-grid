import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import PoolSessions from "./pages/PoolSessions";
import Inbox from "./pages/Inbox";
import Broadcast from "./pages/Broadcast";
import Templates from "./pages/Templates";
import Contacts from "./pages/Contacts";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="pool-sessions" element={<PoolSessions />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="templates" element={<Templates />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
