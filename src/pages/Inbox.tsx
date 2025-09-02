import { useState } from "react";
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
} from "lucide-react";
import type { PoolType, InboxMessage } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const Inbox = () => {
  const { profile } = useAuth();
  
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

  const [selectedPool, setSelectedPool] = useState<PoolType>(getDefaultPool());
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  // Mock data
  const messages: InboxMessage[] = [
    {
      id: "1",
      pool: "CRM",
      sessionId: "session1",
      contactPhone: "+1234567890",
      contactName: "John Doe",
      direction: "incoming",
      content: { text: "Hi, I need help with my order" },
      messageType: "text",
      isRead: false,
      threadId: "thread1",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      pool: "CRM",
      sessionId: "session1",
      contactPhone: "+1234567891",
      contactName: "Jane Smith",
      direction: "outgoing",
      content: { text: "Thank you for contacting us!" },
      messageType: "text",
      isRead: true,
      threadId: "thread2",
      createdAt: "2024-01-15T10:25:00Z",
    },
    {
      id: "3",
      pool: "BLASTER",
      sessionId: "session2",
      contactPhone: "+1234567892",
      contactName: "Mike Johnson",
      direction: "outgoing",
      content: { text: "Check out our latest offers!" },
      messageType: "text",
      isRead: true,
      threadId: "thread3",
      createdAt: "2024-01-15T10:20:00Z",
    },
  ];

  const threads = messages.reduce((acc, msg) => {
    if (!acc[msg.threadId]) {
      acc[msg.threadId] = {
        id: msg.threadId,
        contactPhone: msg.contactPhone,
        contactName: msg.contactName,
        lastMessage: msg,
        unreadCount: 0,
        pool: msg.pool,
      };
    }
    
    if (new Date(msg.createdAt) > new Date(acc[msg.threadId].lastMessage.createdAt)) {
      acc[msg.threadId].lastMessage = msg;
    }
    
    if (!msg.isRead && msg.direction === "incoming") {
      acc[msg.threadId].unreadCount++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const filteredThreads = Object.values(threads).filter((thread: any) => thread.pool === selectedPool);

  return (
    <div className="h-[calc(100vh-200px)] animate-fade-in">
      <div className="flex h-full">
        {/* Sidebar - Thread List */}
        <div className="w-80 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold mb-4">Inbox</h1>
            
            {/* Pool Tabs - Only show pools available to user */}
            <Tabs value={selectedPool} onValueChange={(value) => setSelectedPool(value as PoolType)}>
              <TabsList className={`grid w-full ${availablePools.length === 1 ? 'grid-cols-1' : availablePools.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {availablePools.includes("CRM") && (
                  <TabsTrigger value="CRM" className="text-xs">CRM</TabsTrigger>
                )}
                {availablePools.includes("BLASTER") && (
                  <TabsTrigger value="BLASTER" className="text-xs">BLAST</TabsTrigger>
                )}
                {availablePools.includes("WARMUP") && (
                  <TabsTrigger value="WARMUP" className="text-xs">WARM</TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filteredThreads.map((thread: any) => (
                <div
                  key={thread.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedThread === thread.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedThread(thread.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-foreground">
                          {thread.contactName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{thread.contactName || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{thread.contactPhone}</p>
                      </div>
                    </div>
                    {thread.unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {thread.lastMessage.content.text || "Media message"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(thread.lastMessage.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {threads[selectedThread]?.contactName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{threads[selectedThread]?.contactName || "Unknown"}</h3>
                      <p className="text-sm text-muted-foreground">{threads[selectedThread]?.contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages
                  .filter(msg => msg.threadId === selectedThread)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === "outgoing"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;