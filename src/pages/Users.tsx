import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users2,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Mail,
  Calendar,
  Send,
  Activity,
  ChevronDown,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionDialog from '@/components/subscriptions/SubscriptionDialog';
import UserCreateDialog from '@/components/users/UserCreateDialog';
import ChangePasswordDialog from '@/components/users/ChangePasswordDialog';
import ProfileUpdateDialog from '@/components/users/ProfileUpdateDialog';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'superadmin' | 'admin' | 'user' | 'crm' | 'blaster' | 'warmup';
  admin_id: string | null;
  subscription_type: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  subscription_active: boolean;
  created_at: string;
  updated_at: string;
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedAdmins, setCollapsedAdmins] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if current user can manage users
  const { canManageUsers } = useAuth();

  const fetchUsers = async () => {
    if (!profile) return; // Wait for profile to load
    
    try {
      let query = supabase.from('profiles').select('*');
      
      // Filter based on user role
      if (profile.role === 'admin') {
        // Admins only see their own users and themselves
        query = query.or(`admin_id.eq.${profile.id},id.eq.${profile.id}`);
      }
      // Superadmins see all users (no additional filter needed)
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchUsers();
    }
  }, [profile?.id]);

  const handleDeleteUser = async (id: string) => {
    console.log('=== DELETE USER DEBUG START ===');
    console.log('Target user ID:', id);
    console.log('Current profile:', profile);
    
    const { canManageUsers } = useAuth();
    console.log('canManageUsers function result:', canManageUsers());
    
    console.log('Delete user attempt:', {
      currentUserId: profile?.id,
      currentUserRole: profile?.role,
      targetUserId: id,
      canManageUsers: canManageUsers()
    });
    
    if (!canManageUsers()) {
      console.log('❌ BLOCKED: canManageUsers returned false');
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete users",
        variant: "destructive",
      });
      return;
    }

    // Prevent deleting yourself or higher level users
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) {
      console.log('User to delete not found:', id);
      return;
    }

    console.log('User to delete:', {
      id: userToDelete.id,
      email: userToDelete.email,
      role: userToDelete.role,
      admin_id: userToDelete.admin_id
    });

    // Prevent users from deleting themselves
    if (userToDelete.id === profile?.id) {
      console.log('User trying to delete themselves');
      toast({
        title: "Error",
        description: "You cannot delete yourself",
        variant: "destructive",
      });
      return;
    }

    // Prevent admin from deleting other admins/superladmin, but allow deleting regular users
    if (profile?.role === 'admin' && ['superadmin', 'admin'].includes(userToDelete.role)) {
      console.log('Admin trying to delete another admin/superladmin:', {
        currentUserRole: profile.role,
        targetUserRole: userToDelete.role
      });
      toast({
        title: "Access Denied",
        description: "You cannot delete admin or superladmin users",
        variant: "destructive",
      });
      return;
    }

    // Additional check: Admin can only delete users assigned to them (not other admins' users)
    if (profile?.role === 'admin' && userToDelete.admin_id !== profile?.id) {
      console.log('Admin trying to delete user not assigned to them:', {
        userAdminId: userToDelete.admin_id,
        currentAdminId: profile?.id,
        userRole: userToDelete.role
      });
      toast({
        title: "Access Denied",
        description: "You can only delete users assigned to you",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${userToDelete.email}? This will delete all their data including sessions, contacts, and messages. This action cannot be undone.`)) {
      try {
        setLoading(true);
        
        // Delete all related data for this user
        console.log('Deleting user and all related data:', id);
        
        // 1. Delete WhatsApp contacts from user's sessions
        const { data: userSessions } = await supabase
          .from('whatsapp_sessions')
          .select('id, session_name')
          .eq('user_id', id);
          
        if (userSessions && userSessions.length > 0) {
          const sessionIds = userSessions.map(s => s.id);
          
          // Delete contacts from these sessions
          await supabase
            .from('whatsapp_contacts')
            .delete()
            .in('session_id', sessionIds);
            
          // Delete messages from these sessions  
          await supabase
            .from('whatsapp_messages')
            .delete()
            .in('session_id', sessionIds);
        }
        
        // 2. Delete WhatsApp sessions
        await supabase
          .from('whatsapp_sessions')
          .delete()
          .eq('user_id', id);
          
        // 3. Delete sessions where user is assigned
        await supabase
          .from('sessions')
          .delete()
          .eq('user_id', id);
          
        // 4. Delete API keys
        await supabase
          .from('user_api_keys')
          .delete()
          .eq('user_id', id);
          
        // 5. Delete wa_outbox entries from user's sessions
        await supabase
          .from('wa_outbox')
          .delete()
          .in('session_name', userSessions?.map(s => s.session_name) || []);
          
        // 6. Update sessions where user is admin (transfer to current user if superadmin)
        if (profile?.role === 'superadmin') {
          await supabase
            .from('sessions')
            .update({ admin_id: profile.id })
            .eq('admin_id', id);
            
          await supabase
            .from('whatsapp_sessions')
            .update({ admin_id: profile.id })
            .eq('admin_id', id);
        }
        
        // 7. Update users who have this user as admin (transfer to current user if superadmin)
        if (profile?.role === 'superadmin') {
          await supabase
            .from('profiles')
            .update({ admin_id: profile.id })
            .eq('admin_id', id);
        }
        
        // 8. Finally delete the user profile and auth user
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (profileError) {
          console.error('Profile delete error:', profileError);
          toast({
            title: "Error",
            description: `Failed to delete user profile: ${profileError.message}`,
            variant: "destructive",
          });
          return;
        }

        // Delete from auth.users - Only superadmin can do this
        if (profile?.role === 'superadmin') {
          const { error: authError } = await supabase.auth.admin.deleteUser(id);
          if (authError) {
            console.error('Auth delete error (continuing anyway):', authError);
            // Continue anyway - profile is deleted
          }
        }

        setUsers(prev => prev.filter(u => u.id !== id));
        toast({
          title: "Success",
          description: "User and all related data deleted successfully!",
        });
        
      } catch (error) {
        console.error('Delete user error:', error);
        toast({
          title: "Error",
          description: "Failed to delete user completely. Some data may remain.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle admin collapse state
  const toggleAdminCollapse = (adminId: string) => {
    setCollapsedAdmins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adminId)) {
        newSet.delete(adminId);
      } else {
        newSet.add(adminId);
      }
      return newSet;
    });
  };

  // Create hierarchical view for superadmin
  const getHierarchicalUsers = () => {
    if (profile?.role !== 'superadmin') {
      return filteredUsers;
    }

    const adminUsers = filteredUsers.filter(u => u.role === 'admin');
    const hierarchicalView = [];

    // Add superadmin first
    const superadmins = filteredUsers.filter(u => u.role === 'superadmin');
    hierarchicalView.push(...superadmins);

    // Add each admin and their sub-users (only if not collapsed)
    adminUsers.forEach(admin => {
      hierarchicalView.push(admin);
      const subUsers = filteredUsers.filter(u => u.admin_id === admin.id);
      
      // Only add sub-users if admin is not collapsed
      if (!collapsedAdmins.has(admin.id)) {
        hierarchicalView.push(...subUsers);
      }
    });

    // Add standalone users (no admin_id and not admin/superadmin)
    const standaloneUsers = filteredUsers.filter(u => 
      !u.admin_id && 
      !['admin', 'superadmin'].includes(u.role) && 
      !adminUsers.some(admin => admin.id === u.id)
    );
    hierarchicalView.push(...standaloneUsers);

    return hierarchicalView;
  };

  // Filter users
  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayUsers = getHierarchicalUsers();

  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription_active || u.role === 'superadmin').length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
    subscribed: users.filter(u => u.subscription_active).length,
  };

  const getRoleIcon = (role: string) => {
    if (role === 'superadmin') return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-500" />;
    if (role === 'crm') return <Users2 className="h-4 w-4 text-green-500" />;
    if (role === 'blaster') return <Send className="h-4 w-4 text-red-500" />;
    if (role === 'warmup') return <Activity className="h-4 w-4 text-orange-500" />;
    return <Users2 className="h-4 w-4 text-gray-500" />;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'superadmin') return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (role === 'admin') return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (role === 'crm') return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (role === 'blaster') return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (role === 'warmup') return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getSubscriptionStatus = (user: User) => {
    if (user.role === 'superadmin') {
      return <Badge className="bg-gold text-gold-foreground text-xs">Super Admin</Badge>;
    }
    
    if (!user.subscription_type) {
      return <Badge variant="secondary" className="text-xs">No Subscription</Badge>;
    }
    
    if (user.subscription_type === 'lifetime') {
      return <Badge className="bg-purple-100 text-purple-800 text-xs">Lifetime</Badge>;
    }
    
    const now = new Date();
    const endDate = user.subscription_end ? new Date(user.subscription_end) : null;
    const isExpired = endDate ? now > endDate : false;
    
    if (isExpired) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    
    if (user.subscription_active) {
      const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
      return (
        <Badge className="bg-success text-success-foreground text-xs">
          Active {daysLeft ? `(${daysLeft}d left)` : ''}
        </Badge>
      );
    }
    
    return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'superadmin' 
              ? 'Manage all system users and their subscriptions'
              : profile?.role === 'admin'
              ? 'Manage your CRM, Blaster, and Warmup users'
              : 'View user information'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canManageUsers() && (
            <UserCreateDialog onSuccess={fetchUsers} />
          )}
          {profile?.role === 'superadmin' && (
            <ProfileUpdateDialog onSuccess={fetchUsers} />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              System users
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% active
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">
              Administrative users
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.subscribed}</div>
            <p className="text-xs text-muted-foreground">
              Active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Users ({displayUsers.length})
            {profile?.role === 'superadmin' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                Hierarchical View
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search query"
                  : "Add users to get started"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Last Updated</TableHead>
                  {canManageUsers() && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => {
                  const isSubUser = user.admin_id && profile?.role === 'superadmin';
                  const isAdmin = user.role === 'admin';
                  const adminUserCount = users.filter(u => u.admin_id === user.id).length;
                  
                  return (
                    <TableRow key={user.id} className={isSubUser ? 'bg-muted/30' : ''}>
                       <TableCell>
                         <div className="flex items-center space-x-3">
                           <div className={`w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center ${isSubUser ? 'ml-6' : ''}`}>
                             <span className="text-xs font-semibold text-primary-foreground">
                               {(user.full_name || user.email).charAt(0).toUpperCase()}
                             </span>
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center space-x-2">
                               <p className="font-medium">{user.full_name || 'No name'}</p>
                               {isAdmin && adminUserCount > 0 && profile?.role === 'superadmin' && (
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                   onClick={() => toggleAdminCollapse(user.id)}
                                 >
                                   <ChevronDown 
                                     className={`h-3 w-3 transition-transform ${
                                       collapsedAdmins.has(user.id) ? '-rotate-90' : ''
                                     }`} 
                                   />
                                   <span className="ml-1">
                                     {collapsedAdmins.has(user.id) ? 'Show' : 'Hide'} {adminUserCount} users
                                   </span>
                                 </Button>
                               )}
                             </div>
                           </div>
                         </div>
                       </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm">{user.email}</span>
                          {user.admin_id && profile?.role === 'superadmin' && (
                            <div className="text-xs text-muted-foreground">
                              Admin: {users.find(u => u.id === user.admin_id)?.email || 'Unknown'}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSubscriptionStatus(user)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.updated_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                   {canManageUsers() && (
                     <TableCell>
                        <div className="flex items-center space-x-1">
                          {/* Only superadmin can manage subscriptions */}
                          {profile?.role === 'superadmin' && (
                            <SubscriptionDialog 
                              user={user}
                              onSuccess={fetchUsers}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Calendar className="h-3 w-3" />
                                </Button>
                              }
                            />
                          )}
                          {/* Reset Password - Admin can reset password for their users, Superadmin can reset for admin/user */}
                          {((profile?.role === 'admin' && user.admin_id === profile?.id && user.role !== 'admin' && user.role !== 'superadmin') || 
                            (profile?.role === 'superadmin' && user.role !== 'superadmin')) && (
                            <ChangePasswordDialog 
                              userId={user.id}
                              userEmail={user.email}
                              trigger={
                                <Button variant="ghost" size="sm" title="Reset Password">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              }
                            />
                          )}
                          {/* Hide delete button for admin viewing their own profile */}
                          {!(user.id === profile?.id && profile?.role === 'admin') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                       </div>
                     </TableCell>
                   )}
                   </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;