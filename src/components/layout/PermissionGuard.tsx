import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: 'canManageUsers' | 'canManageSubscriptions' | 'canAccessDashboard' | 'canManageSessions' | 'canManageBroadcast' | 'canManageTemplates' | 'canManageContacts' | 'canViewInbox';
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredPermission, 
  fallback 
}) => {
  const auth = useAuth();
  
  // Check if user has the required permission
  const hasPermission = auth[requiredPermission]();

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert className="max-w-md border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Access Denied</strong>
            <br />
            You don't have permission to access this feature. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;