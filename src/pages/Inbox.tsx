import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  Image,
  Paperclip,
  MoreVertical,
  Loader2,
} from "lucide-react";
import type { PoolType, InboxMessage } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Inbox = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter available pools based on user role
  const getAvailablePools = (): PoolType[] => {
    if (!profile?.role) return ["CRM"];
    
    switch (profile.role) {
      case 'crm':
        return ["CRM"];
      case 'blaster':
        return ["BLASTER"];
      case 'warmup':
        return ["WARMUP"];
      case 'admin':
      case 'superadmin':
        return ["CRM", "BLASTER", "WARMUP"];
      default:
        return ["CRM"];
    }
  };

  const availablePools = getAvailablePools();
  
  // Set default pool based on user role
  const getDefaultPool = (): PoolType => {
    if (!profile?.role) return "CRM";
    
    switch (profile.role) {
      case 'crm':
        return "CRM";
      case 'blaster':
        return "BLASTER";
      case 'warmup':
        return "WARMUP";
      default:
        return "CRM";
    }
  };

  const [selectedPool, setSelectedPool] = useState<PoolType>("CRM");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  // Fetch messages from database
  const fetchMessages = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Get user's accessible sessions first
      let sessionsQuery = supabase.from('whatsapp_sessions').select('*');
      
      if (profile.role === 'superadmin') {
        // Superadmin can see all sessions
      } else if (profile.role === 'admin') {
        sessionsQuery = sessionsQuery.eq('admin_id', profile.id);
      } else {
        sessionsQuery = sessionsQuery.eq('user_id', profile.id);
      }
      
      const { data: sessions, error: sessionsError } = await sessionsQuery;
      if (sessionsError) throw sessionsError;
      
      if (!sessions || sessions.length === 0) {
        setMessages([]);
        return;
      }
      
      const sessionIds = sessions.map(s => s.id);
      
      // Fetch messages from accessible sessions
      const { data: messagesData, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('timestamp', { ascending: false })
        .limit(1000);
        
      if (messagesError) throw messagesError;
      
      setMessages(messagesData || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update selected pool when profile loads
  useEffect(() => {
    if (profile?.role) {
      const defaultPool = getDefaultPool();
      setSelectedPool(defaultPool);
      fetchMessages();
    }
  }, [profile?.role]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        () => {
          fetchMessages(); // Refresh messages when there are changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Define thread type
  type ThreadType = {
    id: string;
    contactPhone: string;
    contactName: string;
    lastMessage: any;
    unreadCount: number;
    pool: string;
  };

  // Group messages into threads by phone number
  const threads = messages.reduce((acc, msg) => {
    const threadId = msg.is_from_me ? msg.to_number : msg.from_number;
    
    if (!acc[threadId]) {
      acc[threadId] = {
        id: threadId,
        contactPhone: threadId,
        contactName: threadId, // Could be enhanced with contact names
        lastMessage: msg,
        unreadCount: 0,
        pool: "CRM", // Map to appropriate pool based on session
      };
    }
    
    if (new Date(msg.timestamp) > new Date(acc[threadId].lastMessage.timestamp)) {
      acc[threadId].lastMessage = msg;
    }
    
    // Count unread messages (incoming messages)
    if (!msg.is_from_me) {
      acc[threadId].unreadCount++;
    }
    
    return acc;
  }, {} as Record<string, ThreadType>);

  const filteredThreads = (Object.values(threads) as ThreadType[]).filter((thread) => {
    if (searchQuery) {
      return thread.contactPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
             thread.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-200px)] animate-fade-in">
      <div className="flex h-full">
        {/* Sidebar - Thread List */}
        <div className="w-96 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold mb-4">Inbox</h1>
            
            {/* Pool Tabs - Only show pools available to user */}
            <Tabs value={selectedPool} onValueChange={(value) => setSelectedPool(value as PoolType)}>
              <TabsList className={`grid w-full ${availablePools.length === 1 ? 'grid-cols-1' : availablePools.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {availablePools.includes("CRM") && (
                  <TabsTrigger value="CRM" className="text-sm">CRM Pool</TabsTrigger>
                )}
                {availablePools.includes("BLASTER") && (
                  <TabsTrigger value="BLASTER" className="text-sm">Blast Pool</TabsTrigger>
                )}
                {availablePools.includes("WARMUP") && (
                  <TabsTrigger value="WARMUP" className="text-sm">Warmup Pool</TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Chats</p>
                <p className="text-lg font-semibold">{filteredThreads.length}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="text-lg font-semibold text-primary">
                  {filteredThreads.reduce((acc, thread) => acc + thread.unreadCount, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-base font-medium text-muted-foreground mb-2">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-muted-foreground">
                    Messages will appear here when you receive WhatsApp messages
                  </p>
                )}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-all duration-200 ${
                    selectedThread === thread.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                  onClick={() => setSelectedThread(thread.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {thread.contactName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{thread.contactName || "Unknown Contact"}</p>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs ml-2">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{thread.contactPhone}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {thread.lastMessage.message_text || "📎 Media message"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(thread.lastMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-foreground">
                        {threads[selectedThread]?.contactName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{threads[selectedThread]?.contactName || "Unknown Contact"}</h3>
                      <p className="text-sm text-muted-foreground">{threads[selectedThread]?.contactPhone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last seen: {new Date(threads[selectedThread]?.lastMessage?.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="default">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="ghost" size="default">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-background to-muted/20">
                {messages
                  .filter(msg => {
                    const threadId = msg.is_from_me ? msg.to_number : msg.from_number;
                    return threadId === selectedThread;
                  })
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_from_me ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                          message.is_from_me
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.message_text || "📎 Media message"}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                
                {/* Empty state for selected conversation */}
                {messages.filter(msg => {
                  const threadId = msg.is_from_me ? msg.to_number : msg.from_number;
                  return threadId === selectedThread;
                }).length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Start a conversation by sending a message</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-border bg-card">
                <div className="flex items-end space-x-3">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Image className="h-5 w-5" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Type your message..."
                    className="flex-1 min-h-[44px] resize-none"
                  />
                  <Button size="default" className="bg-gradient-primary hover:opacity-90 px-6">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-12 w-12 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Select a Conversation</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Choose a conversation from the list to start messaging with your contacts
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-primary">{filteredThreads.length}</div>
                    <div>Total Conversations</div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-primary">
                      {filteredThreads.reduce((acc, thread) => acc + thread.unreadCount, 0)}
                    </div>
                    <div>Unread Messages</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;