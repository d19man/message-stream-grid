import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { socketClient } from "@/lib/socket-client";

export interface Session {
  id: string;
  name: string;
  pool: "CRM" | "BLASTER" | "WARMUP";
  status: "connected" | "connecting" | "disconnected" | "qr_required" | "pairing_required";
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

  const fetchSessions = useCallback(async () => {
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
        status: session.status as "connected" | "connecting" | "disconnected" | "qr_required" | "pairing_required"
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
  }, [toast]);

  const createSession = async (sessionData: Partial<Session>): Promise<Session | null> => {
    try {
      // Generate proper UUID using crypto.randomUUID
      const sessionId = crypto.randomUUID();
      
      // Create session in main sessions table
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          name: sessionData.name || "New Session",
          pool: sessionData.pool || "CRM",
          status: "disconnected",
          phone: "",
          last_seen: "Never",
          user_id: sessionData.user_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
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
        status: data.status as "connected" | "connecting" | "disconnected" | "qr_required" | "pairing_required"
      }, ...prev]);
      
      toast({
        title: "Session Created",
        description: `WhatsApp session "${data.name}" has been created.`
      });

      return { 
        ...data, 
        pool: data.pool as "CRM" | "BLASTER" | "WARMUP",
        status: data.status as "connected" | "connecting" | "disconnected" | "qr_required" | "pairing_required"
      } as Session;
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

  // Connect WhatsApp session via Express server
  const connectWhatsApp = async (sessionId: string) => {
    try {
      console.log('Connecting WhatsApp session:', sessionId);
      
      // Get session data first
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Call Express server API to connect
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          sessionName: session.name
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to WhatsApp');
      }
      
      // Update local session status immediately  
      setSessions(prev => prev.map(s => s.id === sessionId ? { 
        ...s, 
        status: "connecting" as const,
        last_seen: "Just now"
      } : s));
      
      toast({
        title: "Connection Started",
        description: "WhatsApp connection initiated successfully.",
      });
      return true;
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to connect session",
        variant: "destructive",
      });
      return false;
    }
  };

  // Disconnect WhatsApp session via Express server
  const disconnectWhatsApp = async (sessionId: string) => {
    try {
      // Get session data first
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Call Express server API to disconnect
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          sessionName: session.name
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to disconnect from server, updating local state anyway');
      }
      
      // Update local session status
      setSessions(prev => prev.map(s => s.id === sessionId ? { 
        ...s, 
        status: "disconnected" as const,
        phone: "",
        last_seen: "Just now"
      } : s));
      
      toast({
        title: "Disconnected",
        description: "WhatsApp session disconnected successfully",
      });
      return true;
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to disconnect session",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get QR Code from Express server directly
  const getQRCode = async (sessionId: string) => {
    try {
      // QR will be handled by Express server real-time via Socket.io
      console.log('QR Code will be provided by Express server via Socket.io for session:', sessionId);
      return null;
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "QR code will be provided by Express server",
        variant: "destructive",
      });
      return null;
    }
  };

  // Send WhatsApp message via Express server  
  const sendMessage = async (sessionId: string, to: string, message: string, messageType: string = 'text') => {
    try {
      // Get session name from database first
      const { data: sessionData, error: sessionError } = await supabase
        .from('wa_sessions')
        .select('name')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw new Error(sessionError.message);

      // Call Express server API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/wa/${sessionData.name}/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          jid: to,
          text: message
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: "WhatsApp message sent successfully via Express",
        });
        return result;
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
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
        status: data.status as "connected" | "connecting" | "disconnected" | "qr_required" | "pairing_required"
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
      // First disconnect WhatsApp session
      await disconnectWhatsApp(sessionId);
      
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
        description: "WhatsApp session has been deleted successfully."
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
    // Disconnect WhatsApp session when clearing distribution
    await disconnectWhatsApp(sessionId);
    
    return await updateSession(sessionId, { 
      user_id: null, 
      admin_id: null, 
      status: "disconnected",
      phone: "",
      last_seen: "Never"
    });
  };

  // Setup real-time subscriptions using Express Socket.io  
  useEffect(() => {
    fetchSessions();

    // Connect to Express server Socket.io
    const socket = socketClient.connect();
    
    // Listen for QR codes from Express server
    socketClient.onQRCode((data) => {
      console.log('QR code received:', data);
      // Update session with QR code if needed
    });

    // Listen for status updates from Express server
    socketClient.onStatusUpdate((data) => {
      console.log('Status update received:', data);
      // Update session status
      setSessions(prev => prev.map(s => {
        if (s.name === data.session) {
          return {
            ...s,
            status: data.status as "connected" | "connecting" | "disconnected" | "qr_required" | "pairing_required",
            last_seen: "Just now"
          };
        }
        return s;
      }));
    });

    // Also keep Supabase realtime for database changes
    const whatsappChannel = supabase
      .channel('whatsapp-sessions-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_sessions'
        },
        (payload) => {
          console.log('WhatsApp session updated:', payload);
          
          // Update corresponding session status
          setSessions(prev => prev.map(s => {
            if (s.id === payload.new.id) {
              return {
                ...s,
                status: payload.new.status,
                phone: payload.new.phone_number || s.phone,
                last_seen: new Date(payload.new.last_seen).toLocaleString()
              };
            }
            return s;
          }));
        }
      )
      .subscribe();

    return () => {
      socketClient.disconnect();
      supabase.removeChannel(whatsappChannel);
    };
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    shareToAdmin,
    assignToUser,
    clearDistribution,
    connectWhatsApp,
    disconnectWhatsApp,
    getQRCode,
    sendMessage,
    refetch: fetchSessions
  };
};
