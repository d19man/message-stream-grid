import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "superadmin" | "admin" | "user" | "crm" | "blaster" | "warmup";
  admin_id?: string;
  created_at: string;
  updated_at: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        });
        return;
      }

      // Filter users based on current user's role
      let filteredUsers = (data || []).map(user => ({
        ...user,
        role: user.role as "superadmin" | "admin" | "user" | "crm" | "blaster" | "warmup"
      }));

      if (profile?.role === 'admin') {
        // Admin only sees users assigned to them
        filteredUsers = filteredUsers.filter(u => 
          u.admin_id === user?.id || u.id === user?.id
        );
      } else if (profile?.role === 'user') {
        // Regular users only see themselves
        filteredUsers = filteredUsers.filter(u => u.id === user?.id);
      }
      // Superadmin sees all users (no filtering)

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAdmins = () => {
    return users.filter(user => user.role === 'admin');
  };

  const getUsersByPool = (pool: "CRM" | "BLASTER" | "WARMUP") => {
    // Filter users based on their role and pool type
    const poolUsers = users.filter(user => {
      // Return users that are not admin/superadmin
      if (['admin', 'superladmin'].includes(user.role)) return false;
      
      // Filter by pool-specific roles
      const poolRole = pool.toLowerCase(); // "CRM" -> "crm"
      return user.role === poolRole || user.role === 'user';
    });
    
    console.log(`getUsersByPool(${pool}):`, {
      allUsers: users,
      poolUsers: poolUsers,
      currentUserRole: profile?.role,
      currentUserId: user?.id
    });
    
    return poolUsers;
  };

  const getUserName = (userId: string) => {
    if (!userId) return "Not assigned";
    
    const user = users.find(u => u.id === userId);
    
    return user?.full_name || user?.email || "Unknown User";
  };

  useEffect(() => {
    if (profile) {
      fetchUsers();
    }
  }, [profile?.id, profile?.role]);

  return {
    users,
    loading,
    getAdmins,
    getUsersByPool,
    getUserName,
    refetch: fetchUsers
  };
};