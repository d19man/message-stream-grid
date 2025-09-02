import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  };

  const createSession = async (sessionData: Partial<Session>): Promise<Session | null> => {
    try {
      const sessionId = crypto.randomUUID();
      
      // Create unique session name with timestamp to avoid duplicates
      const uniqueSessionName = `${sessionData.name || "Session"}_${Date.now()}`;
      
      // Create WhatsApp session in whatsapp_sessions table
      try {
        const { error: waError } = await supabase
          .from('whatsapp_sessions')
          .insert({
            id: sessionId,
            session_name: uniqueSessionName,
            status: 'disconnected',
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (waError) {
          console.error('Error creating WhatsApp session:', waError);
        }
      } catch (error) {
        console.error('Error creating WhatsApp session:', error);
      }

      // Create session in main sessions table (keep using Supabase for database)
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

  // Connect WhatsApp session 
  const connectWhatsApp = async (sessionId: string) => {
    try {
      // Update session status to connecting
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'qr_required' })
        .eq('id', sessionId);

      if (error) throw new Error('Failed to update session status');

      // Update whatsapp_sessions status
      await supabase
        .from('whatsapp_sessions')
        .upsert({ 
          id: sessionId,
          session_name: `session_${sessionId}`,
          status: 'qr_ready',
          last_seen: new Date().toISOString()
        });

      // Update local session status
      setSessions(prev => prev.map(s => s.id === sessionId ? { 
        ...s, 
        status: "qr_required" as const
      } : s));
      
      toast({
        title: "QR Code Ready",
        description: "Scan the QR code to connect WhatsApp",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Disconnect WhatsApp session
  const disconnectWhatsApp = async (sessionId: string) => {
    try {
      // Update session status to disconnected
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'disconnected',
          phone: '',
          last_seen: new Date().toLocaleString()
        })
        .eq('id', sessionId);

      if (error) throw new Error('Failed to disconnect session');

      // Update whatsapp_sessions status
      await supabase
        .from('whatsapp_sessions')
        .update({ 
          status: 'disconnected',
          last_seen: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Update local session status
      setSessions(prev => prev.map(s => s.id === sessionId ? { 
        ...s, 
        status: "disconnected" as const,
        phone: "",
        last_seen: "Just now"
      } : s));
      
      toast({
        title: "Disconnected",
        description: "WhatsApp session disconnected",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Get QR Code for session
  const getQRCode = async (sessionId: string) => {
    try {
      // Generate a mock QR code for demo purposes
      const qrCodeData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp://session/${sessionId}`;
      
      return {
        success: true,
        qrCode: qrCodeData,
        message: "QR code generated successfully"
      };
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Send WhatsApp message
  const sendMessage = async (sessionId: string, to: string, message: string, messageType: string = 'text') => {
    try {
      // Store message in whatsapp_messages table
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          session_id: sessionId,
          from_number: 'session',
          to_number: to,
          message_text: message,
          message_type: messageType,
          timestamp: new Date().toISOString(),
          is_from_me: true,
          status: 'sent'
        });

      if (error) throw new Error('Failed to store message');

      toast({
        title: "Message Sent",
        description: "WhatsApp message sent successfully",
      });
      
      return {
        success: true,
        messageId: crypto.randomUUID()
      };
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
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

  // Setup real-time subscriptions for WhatsApp sessions
  useEffect(() => {
    fetchSessions();

    // Subscribe to WhatsApp session changes
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
      supabase.removeChannel(whatsappChannel);
    };
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
    connectWhatsApp,
    disconnectWhatsApp,
    getQRCode,
    sendMessage,
    refetch: fetchSessions
  };
};