import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { 
    user, 
    profile, 
    loading,
    canAccessDashboard,
    canManageSessions,
    canAccessPoolSessions,
    canViewInbox,
    canManageBroadcast,
    canManageTemplates,
    canManageContacts,
    canManageUsers,
    canManageRoles,
    canAccessSettings
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check specific permissions based on route
  if (requiredPermission && profile) {
    let hasPermission = false;
    
    switch (requiredPermission) {
      case 'dashboard':
        hasPermission = canAccessDashboard();
        break;
      case 'sessions':
        hasPermission = canManageSessions();
        break;
      case 'pool-sessions':
        hasPermission = canAccessPoolSessions();
        break;
      case 'inbox':
        hasPermission = canViewInbox();
        break;
      case 'broadcast':
        hasPermission = canManageBroadcast();
        break;
      case 'templates':
        hasPermission = canManageTemplates();
        break;
      case 'contacts':
        hasPermission = canManageContacts();
        break;
      case 'users':
        hasPermission = canManageUsers();
        break;
      case 'roles':
        hasPermission = canManageRoles();
        break;
      case 'settings':
        hasPermission = canAccessSettings();
        break;
      default:
        hasPermission = true;
    }

    if (!hasPermission) {
      return <Navigate to="/sessions" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;