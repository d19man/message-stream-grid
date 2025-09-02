import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RoleCreateDialog from '@/components/roles/RoleCreateDialog';
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
  const { toast } = useToast();
  
  // Database state
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Delete role function
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (profile?.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "Only superadmin can delete roles",
        variant: "destructive",
      });
      return;
    }

    // Prevent deletion of system roles
    if (['superadmin', 'admin', 'user'].includes(roleName)) {
      toast({
        title: "Cannot Delete",
        description: "System roles cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role "${roleName}" deleted successfully`,
      });

      // Clear selection if deleted role was selected
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }

      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  // Fetch roles from database
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save role permissions
  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from('roles')
        .update({ 
          permissions: editedPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRole.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save permissions",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Permissions updated successfully!",
      });

      setIsEditing(false);
      // Update local state
      setRoles(prev => prev.map(role => 
        role.id === selectedRole.id 
          ? { ...role, permissions: editedPermissions, updated_at: new Date().toISOString() }
          : role
      ));
      setSelectedRole(prev => prev ? { ...prev, permissions: editedPermissions } : null);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive",
      });
    }
  };

  // Initialize and setup realtime subscription
  useEffect(() => {
    fetchRoles();

    // Setup realtime subscription
    const channel = supabase
      .channel('roles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'roles'
        },
        (payload) => {
          console.log('Role updated:', payload);
          
          // Update roles list
          setRoles(prev => prev.map(role => 
            role.id === payload.new.id ? payload.new : role
          ));

          // Update selected role if it's the one being changed
          setSelectedRole(prev => 
            prev?.id === payload.new.id ? payload.new : prev
          );

          // Show notification for real-time updates
          toast({
            title: "Role Updated",
            description: `${payload.new.name} permissions have been updated by another user`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle checkbox changes
  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (!isEditing) return;

    setEditedPermissions(prev => {
      if (checked) {
        return [...prev, permission];
      } else {
        return prev.filter(p => p !== permission);
      }
    });
  };

  // Start editing
  const startEditing = () => {
    if (!selectedRole) return;
    setEditedPermissions(selectedRole.permissions || []);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedPermissions([]);
  };

  // Filter roles based on user level
  const filteredRoles = profile?.role === "superadmin" 
    ? roles 
    : roles.filter(role => role.name !== 'superadmin');

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

  // Get current user permissions for admin editing
  const getCurrentUserPermissions = () => {
    if (profile?.role === "superadmin") return ["*"];
    if (profile?.role === "admin") {
      return [
        "manage:session", "view:session",
        "view:pool-session", "transfer:pool-session", "delete:pool-session",
        "manage:broadcast", "view:broadcast", "start:blast", "stop:blast",
        "manage:template", "view:template",
        "manage:inbox:crm", "view:inbox:crm",
        "manage:inbox:blaster", "view:inbox:blaster",
        "manage:inbox:warmup", "view:inbox:warmup",
        "manage:user", "view:user"
      ];
    }
    return [];
  };

  const currentUserPermissions = getCurrentUserPermissions();
  
  // Check if current user can edit permissions
  const canEditPermission = (permission: string) => {
    if (profile?.role === "superadmin") return true;
    return currentUserPermissions.includes(permission);
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes("superadmin") || roleName.includes("Super")) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (roleName.includes("admin") || roleName.includes("Admin")) return <Shield className="h-5 w-5 text-blue-500" />;
    return <Users2 className="h-5 w-5 text-gray-500" />;
  };

  const getRoleBadgeColor = (roleName: string) => {
    if (roleName.includes("superadmin") || roleName.includes("Super")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (roleName.includes("admin") || roleName.includes("Admin")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const hasPermission = (role: any, permission: string) => {
    if (!role?.permissions) return false;
    if (isEditing && role.id === selectedRole?.id) {
      return editedPermissions.includes(permission);
    }
    return role.permissions.includes("*") || role.permissions.includes(permission);
  };

  const getPermissionCount = (role: any) => {
    if (role?.permissions?.includes("*")) return "All";
    return role?.permissions?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90" 
          style={{display: profile?.role === "superadmin" ? "flex" : "none"}}
          onClick={() => setShowCreateDialog(true)}
        >
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
              {filteredRoles.map((role) => (
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
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedRole(role);
                           startEditing();
                         }}
                       >
                         <Edit className="h-3 w-3" />
                       </Button>
                        {!role.is_system_role && profile?.role === 'superadmin' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id, role.name);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                     </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated: {new Date(role.updated_at).toLocaleDateString()}
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
                       onClick={() => isEditing ? cancelEditing() : startEditing()}
                       className={!(profile?.role === "superadmin" || profile?.role === "admin") ? "hidden" : ""}
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
                                   onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
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
                          <Button className="bg-gradient-primary hover:opacity-90" size="sm" onClick={saveRolePermissions}>
                            Save Changes
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : profile?.role === "admin" ? (
                    // Admin editing interface - can only edit permissions they have
                    <div className="space-y-6">
                      {allPermissions
                        .filter(group => group.permissions.some(permission => canEditPermission(permission)))
                        .map((group) => (
                        <div key={group.group}>
                          <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                            <Lock className="h-4 w-4" />
                            <span>{group.group}</span>
                          </h4>
                          <div className="grid grid-cols-1 gap-2 ml-6">
                            {group.permissions.map((permission) => {
                              const canEdit = canEditPermission(permission);
                              return (
                                <div key={permission} className="flex items-center space-x-2">
                                   <Checkbox
                                     id={permission}
                                     checked={hasPermission(selectedRole, permission)}
                                     disabled={!isEditing || !canEdit}
                                     onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                                   />
                                  <label
                                    htmlFor={permission}
                                    className={`text-sm ${
                                      hasPermission(selectedRole, permission)
                                        ? "text-foreground"
                                        : canEdit 
                                          ? "text-muted-foreground" 
                                          : "text-muted-foreground/50"
                                    }`}
                                  >
                                    {permission.replace(":", " → ").replace("_", " ")}
                                    {!canEdit && " (tidak tersedia)"}
                                  </label>
                                  {hasPermission(selectedRole, permission) && (
                                    <Unlock className="h-3 w-3 text-success" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {isEditing && (
                        <div className="flex space-x-2 pt-4 border-t">
                          <Button className="bg-gradient-primary hover:opacity-90" size="sm" onClick={saveRolePermissions}>
                            Save Changes
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEditing}>
                            Cancel
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            * Anda hanya dapat memberikan permissions yang Anda miliki (19 permissions)
                          </p>
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

       {/* Create Role Dialog */}
       <RoleCreateDialog 
         open={showCreateDialog}
         onOpenChange={setShowCreateDialog}
         onRoleCreated={fetchRoles}
       />
     </div>
  );
};

export default Roles;