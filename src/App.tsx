import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
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
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="dashboard" element={
                <ProtectedRoute requiredPermission="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="sessions" element={
                <ProtectedRoute requiredPermission="sessions">
                  <Sessions />
                </ProtectedRoute>
              } />
              <Route path="pool-sessions" element={
                <ProtectedRoute requiredPermission="pool-sessions">
                  <PoolSessions />
                </ProtectedRoute>
              } />
              <Route path="inbox" element={
                <ProtectedRoute requiredPermission="inbox">
                  <Inbox />
                </ProtectedRoute>
              } />
              <Route path="broadcast" element={
                <ProtectedRoute requiredPermission="broadcast">
                  <Broadcast />
                </ProtectedRoute>
              } />
              <Route path="templates" element={
                <ProtectedRoute requiredPermission="templates">
                  <Templates />
                </ProtectedRoute>
              } />
              <Route path="contacts" element={
                <ProtectedRoute requiredPermission="contacts">
                  <Contacts />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute requiredPermission="users">
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="roles" element={
                <ProtectedRoute requiredPermission="roles">
                  <Roles />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute requiredPermission="settings">
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
