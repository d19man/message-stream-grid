import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { socketClient } from '@/lib/socket-client';

interface WhatsAppSession {
  id: string;
  session_name: string;
  user_id: string;
  admin_id: string | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_required' | 'pairing_required' | 'qr_ready' | 'error';
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

  // Create new session directly in database
  const createSession = async (sessionName: string) => {
    try {
      const sessionId = crypto.randomUUID();
      setLoading(true);

      // Create session directly in database
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .insert({
          id: sessionId,
          session_name: sessionName,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'disconnected'
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "WhatsApp session created successfully",
      });
      await fetchSessions();
      return { id: sessionId, session_name: sessionName };
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Connect session via Express server
  const connectSession = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect session');
      }

      toast({
        title: "Connecting",
        description: "WhatsApp session is connecting...",
      });
      
      await fetchSessions();
      return true;
    } catch (err: any) {
      toast({
        title: "Error", 
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Disconnect session via Express server
  const disconnectSession = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to disconnect session');
      }

      toast({
        title: "Disconnected", 
        description: "WhatsApp session disconnected",
      });
      
      await fetchSessions();
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get QR code from Express server directly  
  const getQRCode = async (sessionId: string) => {
    try {
      // QR codes will be handled by Express server and emitted via Socket.io
      // Return null for now as QR will come through real-time socket connection
      console.log('QR Code will be provided by Express server via Socket.io for session:', sessionId);
      return null;
    } catch (err: any) {
      toast({
        title: "Error",
        description: "QR code will be provided by Express server via Socket.io",
        variant: "destructive",
      });
      return null;
    }
  };

  // Send message via Express server
  const sendMessage = async (sessionId: string, to: string, message: string, messageType: string = 'text') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          to,
          message,
          messageType
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: "WhatsApp message sent successfully",
        });
        return result;
      } else {
        throw new Error(result.error || 'Failed to send message');
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

  // Setup real-time subscriptions using Express Socket.io
  useEffect(() => {
    fetchSessions();

    // Connect to Express server Socket.io
    const socket = socketClient.connect();
    
    // Listen for QR codes from Express server
    socketClient.onQRCode((data) => {
      console.log('QR code received:', data);
      // Update sessions with QR code using sessionId instead of session_name
      setSessions(prev => prev.map(s => {
        if (s.id === data.session) {
          return { ...s, qr_code: data.qr, status: 'qr_ready' };
        }
        return s;
      }));
    });

    // Listen for status updates from Express server
    socketClient.onStatusUpdate((data) => {
      console.log('Status update received:', data);
      setSessions(prev => prev.map(s => {
        if (s.id === data.session) {
          return { 
            ...s, 
            status: data.status as WhatsAppSession['status'],
            last_seen: new Date().toISOString(),
            phone_number: (data as any).phone || s.phone_number
          };
        }
        return s;
      }));
    });

    // Keep Supabase subscriptions for database changes
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
        }
      )
      .subscribe();

    return () => {
      socketClient.disconnect();
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