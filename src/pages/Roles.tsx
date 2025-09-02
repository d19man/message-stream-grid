import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users2,
  Crown,
  Lock,
  Unlock,
} from "lucide-react";
import type { Role } from "@/types";

const Roles = () => {
  const { profile } = useAuth();
  
  // Mock data
  const allRoles: Role[] = [
    {
      id: "1",
      name: "Super Admin",
      permissions: ["*"],
      description: "Full system access with all permissions",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Admin",
      permissions: [
        "manage:session", "view:session",
        "view:pool-session", "transfer:pool-session", "delete:pool-session",
        "manage:broadcast", "view:broadcast", "start:blast", "stop:blast",
        "manage:template", "view:template",
        "manage:inbox:crm", "view:inbox:crm",
        "manage:inbox:blaster", "view:inbox:blaster",
        "manage:inbox:warmup", "view:inbox:warmup",
        "manage:user", "view:user"
      ],
      description: "System administrator with most permissions",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "3",
      name: "CRM Admin",
      permissions: [
        "view:session",
        "manage:inbox:crm", "view:inbox:crm",
        "view:template",
        "view:broadcast",
        "view:user"
      ],
      description: "CRM system administrator with full CRM access",
      createdAt: "2024-01-05T00:00:00Z",
      updatedAt: "2024-01-10T15:30:00Z",
    },
    {
      id: "4",
      name: "Blasting Admin",
      permissions: [
        "view:session",
        "manage:broadcast", "view:broadcast", "start:blast", "stop:blast",
        "manage:inbox:blaster", "view:inbox:blaster",
        "manage:template", "view:template",
        "view:user"
      ],
      description: "Blasting system administrator with full blasting access",
      createdAt: "2024-01-08T00:00:00Z",
      updatedAt: "2024-01-12T09:20:00Z",
    },
    {
      id: "5",
      name: "Warmup Admin",
      permissions: [
        "view:session",
        "manage:inbox:warmup", "view:inbox:warmup",
        "view:template",
        "view:broadcast",
        "view:user"
      ],
      description: "Warmup system administrator with full warmup access",
      createdAt: "2024-01-10T00:00:00Z",
      updatedAt: "2024-01-18T14:45:00Z",
    },
    {
      id: "6",
      name: "CRM Operator",
      permissions: [
        "view:session",
        "manage:inbox:crm", "view:inbox:crm",
        "view:template",
        "view:broadcast"
      ],
      description: "Basic CRM operations and customer support",
      createdAt: "2024-01-08T00:00:00Z",
      updatedAt: "2024-01-12T09:20:00Z",
    },
  ];

  // Filter roles based on user level - hide superadmin from non-superadmin users
  const roles = profile?.role === "superadmin" 
    ? allRoles 
    : allRoles.filter(role => !role.permissions.includes("*"));

  // All available permissions
  const allPermissions = [
    { group: "Users & Roles", permissions: ["manage:user", "view:user", "manage:role", "view:role"] },
    { group: "Sessions", permissions: ["manage:session", "view:session"] },
    { group: "Pool Sessions", permissions: ["view:pool-session", "create:pool-session", "transfer:pool-session", "delete:pool-session", "purge:pool-session"] },
    { group: "CRM Inbox", permissions: ["manage:inbox:crm", "view:inbox:crm"] },
    { group: "Blaster Inbox", permissions: ["manage:inbox:blaster", "view:inbox:blaster"] },
    { group: "Warmup Inbox", permissions: ["manage:inbox:warmup", "view:inbox:warmup"] },
    { group: "Broadcast", permissions: ["manage:broadcast", "view:broadcast", "start:blast", "stop:blast"] },
    { group: "Templates", permissions: ["manage:template", "view:template"] },
    { group: "AI Agent", permissions: ["manage:ai", "view:ai"] },
  ];

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes("Super")) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (roleName.includes("Admin")) return <Shield className="h-5 w-5 text-blue-500" />;
    return <Users2 className="h-5 w-5 text-gray-500" />;
  };

  const getRoleBadgeColor = (roleName: string) => {
    if (roleName.includes("Super")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (roleName.includes("Admin")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const hasPermission = (role: Role, permission: string) => {
    return role.permissions.includes("*") || role.permissions.includes(permission);
  };

  const getPermissionCount = (role: Role) => {
    if (role.permissions.includes("*")) return "All";
    return role.permissions.length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" style={{display: profile?.role === "superadmin" ? "flex" : "none"}}>
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles List */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Roles ({roles.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedRole?.id === role.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(role.name)}
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoleBadgeColor(role.name)}`}
                        >
                          {getPermissionCount(role)} permissions
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!role.permissions.includes("*") && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated: {new Date(role.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Permission Details */}
        <div>
          {selectedRole ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getRoleIcon(selectedRole.name)}
                    <span>{selectedRole.name} Permissions</span>
                  </CardTitle>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setIsEditing(!isEditing)}
                     className={profile?.role !== "superadmin" ? "hidden" : ""}
                   >
                     {isEditing ? "Cancel" : "Edit"}
                   </Button>
                </div>
              </CardHeader>
               <CardContent>
                 {selectedRole.permissions.includes("*") ? (
                   <div className="text-center py-8">
                     <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-foreground mb-2">Super Admin</h3>
                     <p className="text-muted-foreground">
                       This role has full system access with all permissions
                     </p>
                     <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mt-4">
                       All Permissions Granted
                     </Badge>
                   </div>
                 ) : profile?.role === "superadmin" ? (
                   // Superadmin sees full permission management interface
                   <div className="space-y-6">
                     {allPermissions.map((group) => (
                       <div key={group.group}>
                         <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                           <Lock className="h-4 w-4" />
                           <span>{group.group}</span>
                         </h4>
                         <div className="grid grid-cols-1 gap-2 ml-6">
                           {group.permissions.map((permission) => (
                             <div key={permission} className="flex items-center space-x-2">
                               <Checkbox
                                 id={permission}
                                 checked={hasPermission(selectedRole, permission)}
                                 disabled={!isEditing}
                               />
                               <label
                                 htmlFor={permission}
                                 className={`text-sm ${
                                   hasPermission(selectedRole, permission)
                                     ? "text-foreground"
                                     : "text-muted-foreground"
                                 }`}
                               >
                                 {permission.replace(":", " → ").replace("_", " ")}
                               </label>
                               {hasPermission(selectedRole, permission) && (
                                 <Unlock className="h-3 w-3 text-success" />
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                     
                     {isEditing && (
                       <div className="flex space-x-2 pt-4 border-t">
                         <Button className="bg-gradient-primary hover:opacity-90" size="sm">
                           Save Changes
                         </Button>
                         <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                           Cancel
                         </Button>
                       </div>
                     )}
                   </div>
                 ) : (
                   // Admin and other users only see granted permissions
                   <div className="space-y-6">
                     {/* Only show permission groups that have granted permissions */}
                     {allPermissions
                       .filter(group => group.permissions.some(permission => hasPermission(selectedRole, permission)))
                       .map((group) => (
                       <div key={group.group}>
                         <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                           <Unlock className="h-4 w-4 text-success" />
                           <span>{group.group}</span>
                         </h4>
                         <div className="grid grid-cols-1 gap-2 ml-6">
                           {/* Only show permissions that are granted */}
                           {group.permissions
                             .filter(permission => hasPermission(selectedRole, permission))
                             .map((permission) => (
                             <div key={permission} className="flex items-center space-x-2">
                               <div className="w-4 h-4 rounded-sm bg-success flex items-center justify-center">
                                 <Unlock className="h-3 w-3 text-white" />
                               </div>
                               <label className="text-sm text-foreground">
                                 {permission.replace(":", " → ").replace("_", " ")}
                               </label>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Role</h3>
                <p className="text-muted-foreground text-center">
                  Choose a role from the list to view and manage its permissions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roles;