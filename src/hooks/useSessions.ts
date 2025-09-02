import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Session {
  id: string;
  name: string;
  pool: "CRM" | "BLASTER" | "WARMUP";
  status: "connected" | "connecting" | "disconnected";
  phone?: string;
  last_seen?: string;
  user_id?: string;
  admin_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch sessions",
          variant: "destructive"
        });
        return;
      }

      setSessions(data.map(session => ({
        ...session,
        pool: session.pool as "CRM" | "BLASTER" | "WARMUP",
        status: session.status as "connected" | "connecting" | "disconnected"
      })));
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: Partial<Session>) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          name: sessionData.name || "New Session",
          pool: sessionData.pool || "CRM",
          status: "disconnected",
          phone: "",
          last_seen: "Never",
          user_id: sessionData.user_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast({
          title: "Error",
          description: "Failed to create session",
          variant: "destructive"
        });
        return null;
      }

      setSessions(prev => [{ 
        ...data, 
        pool: data.pool as "CRM" | "BLASTER" | "WARMUP",
        status: data.status as "connected" | "connecting" | "disconnected"
      }, ...prev]);
      toast({
        title: "Session Created",
        description: `Session "${data.name}" has been created.`
      });

      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        toast({
          title: "Error",
          description: "Failed to update session",
          variant: "destructive"
        });
        return null;
      }

      setSessions(prev => prev.map(s => s.id === sessionId ? { 
        ...data, 
        pool: data.pool as "CRM" | "BLASTER" | "WARMUP",
        status: data.status as "connected" | "connecting" | "disconnected"
      } : s));
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        toast({
          title: "Error",
          description: "Failed to delete session",
          variant: "destructive"
        });
        return false;
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Session Deleted",
        description: "Session has been deleted successfully."
      });

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive"
      });
      return false;
    }
  };

  const shareToAdmin = async (sessionId: string, adminId: string) => {
    return await updateSession(sessionId, { admin_id: adminId });
  };

  const assignToUser = async (sessionId: string, userId: string) => {
    return await updateSession(sessionId, { user_id: userId });
  };

  const clearDistribution = async (sessionId: string) => {
    return await updateSession(sessionId, { 
      user_id: null, 
      admin_id: null, 
      status: "disconnected",
      phone: "",
      last_seen: "Never"
    });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    shareToAdmin,
    assignToUser,
    clearDistribution,
    refetch: fetchSessions
  };
};