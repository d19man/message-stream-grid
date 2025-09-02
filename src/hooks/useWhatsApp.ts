import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppSession {
  id: string;
  session_name: string;
  user_id: string;
  admin_id: string | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_required' | 'pairing_required';
  qr_code: string | null;
  phone_number: string | null;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

interface WhatsAppMessage {
  id: string;
  session_id: string;
  message_id: string | null;
  from_number: string;
  to_number: string;
  message_text: string | null;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  is_from_me: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  created_at: string;
}

export const useWhatsApp = () => {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSessions(data as WhatsAppSession[] || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch WhatsApp sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new session
  const createSession = async (sessionName: string) => {
    try {
      const sessionId = crypto.randomUUID();
      
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'create',
          sessionName,
          sessionId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "WhatsApp session created successfully",
        });
        await fetchSessions();
        return data.session;
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Connect session
  const connectSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'connect',
          sessionId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Connecting",
          description: "WhatsApp session is connecting...",
        });
        await fetchSessions();
        return true;
      } else {
        throw new Error(data.error || 'Failed to connect session');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Disconnect session
  const disconnectSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'disconnect',
          sessionId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Disconnected",
          description: "WhatsApp session disconnected",
        });
        await fetchSessions();
        return true;
      } else {
        throw new Error(data.error || 'Failed to disconnect session');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get QR code
  const getQRCode = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'getQR',
          sessionId
        }
      });

      if (error) throw error;
      
      return data;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Send message
  const sendMessage = async (sessionId: string, to: string, message: string, messageType: string = 'text') => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send-message', {
        body: {
          sessionId,
          to,
          message,
          messageType
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Message Sent",
          description: "WhatsApp message sent successfully",
        });
        return data;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get messages for a session
  const getMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      return data as WhatsAppMessage[];
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    fetchSessions();

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel('whatsapp-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_sessions'
        },
        (payload) => {
          console.log('Session change:', payload);
          fetchSessions();
        }
      )
      .subscribe();

    // Subscribe to message changes
    const messageChannel = supabase
      .channel('whatsapp-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        (payload) => {
          console.log('Message change:', payload);
          // Could trigger a callback here to update message lists
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(messageChannel);
    };
  }, []);

  return {
    sessions,
    loading,
    error,
    createSession,
    connectSession,
    disconnectSession,
    getQRCode,
    sendMessage,
    getMessages,
    fetchSessions
  };
};