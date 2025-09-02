import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "superadmin" | "admin" | "user";
  admin_id?: string;
  created_at: string;
  updated_at: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

      setUsers((data || []).map(user => ({
        ...user,
        role: user.role as "superadmin" | "admin" | "user"
      })));
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
    // For now, return all regular users
    // You could add a pool_type field to profiles later if needed
    return users.filter(user => user.role === 'user');
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || "Unknown User";
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    getAdmins,
    getUsersByPool,
    getUserName,
    refetch: fetchUsers
  };
};