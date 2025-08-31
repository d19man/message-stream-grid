import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Plus,
  Wifi,
  WifiOff,
  RotateCcw,
  Trash2,
  QrCode,
  Zap,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SessionDialog } from "@/components/sessions/SessionDialog";
import { QRDialog } from "@/components/sessions/QRDialog";
import { useToast } from "@/hooks/use-toast";
import type { Session, PoolType, SessionStatus } from "@/types";

const Sessions = () => {
  const [activeTab, setActiveTab] = useState<PoolType>("CRM");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock data
  const initialSessions: Session[] = [
    {
      id: "1",
      name: "CRM-Main",
      pool: "CRM",
      status: "connected",
      phone: "+1234567890",
      lastSeen: "2 min ago",
      userId: "user1",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      name: "CRM-Support",
      pool: "CRM",
      status: "disconnected",
      phone: "+1234567891",
      lastSeen: "1 hour ago",
      userId: "user1",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T09:00:00Z",
    },
    {
      id: "3",
      name: "Blast-Campaign",
      pool: "BLASTER",
      status: "connected",
      phone: "+1234567892",
      lastSeen: "Active now",
      userId: "user1",
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-01-15T08:00:00Z",
    },
    {
      id: "4",
      name: "Warmup-01",
      pool: "WARMUP",
      status: "connecting",
      userId: "user1",
      createdAt: "2024-01-15T07:00:00Z",
      updatedAt: "2024-01-15T07:00:00Z",
    },
  ];

  const [sessions, setSessions] = useState<Session[]>(initialSessions);

  const handleSaveSession = (sessionData: Partial<Session>) => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: sessionData.name!,
      pool: sessionData.pool!,
      status: "qr_ready",
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
  };

  const handleDeleteSession = (id: string) => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      setSessions(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Session deleted successfully!",
      });
    }
  };

  const handleReconnect = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: "connecting" as SessionStatus, updatedAt: new Date().toISOString() } : s
    ));
    toast({
      title: "Reconnecting",
      description: "Attempting to reconnect session...",
    });
    
    // Simulate reconnection process
    setTimeout(() => {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: "qr_ready" as SessionStatus } : s
      ));
    }, 2000);
  };

  const handleNewCampaign = () => {
    navigate("/broadcast");
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-success" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-destructive" />;
      case "connecting":
      case "qr_ready":
      case "pairing":
        return <RotateCcw className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    const statusConfig = {
      connected: { variant: "default" as const, className: "bg-success text-success-foreground" },
      disconnected: { variant: "destructive" as const, className: "" },
      connecting: { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
      qr_ready: { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
      pairing: { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
      error: { variant: "destructive" as const, className: "" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const filteredSessions = sessions.filter(session => session.pool === activeTab);

  const poolStats = {
    CRM: { total: sessions.filter(s => s.pool === "CRM").length, connected: sessions.filter(s => s.pool === "CRM" && s.status === "connected").length },
    BLASTER: { total: sessions.filter(s => s.pool === "BLASTER").length, connected: sessions.filter(s => s.pool === "BLASTER" && s.status === "connected").length },
    WARMUP: { total: sessions.filter(s => s.pool === "WARMUP").length, connected: sessions.filter(s => s.pool === "WARMUP" && s.status === "connected").length },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground">Manage your WhatsApp sessions across different pools</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleNewCampaign}>
            <Send className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <SessionDialog onSave={handleSaveSession} />
        </div>
      </div>

      {/* Pool Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PoolType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="CRM" className="relative">
            <Smartphone className="h-4 w-4 mr-2" />
            CRM ({poolStats.CRM.connected}/{poolStats.CRM.total})
          </TabsTrigger>
          <TabsTrigger value="BLASTER" className="relative">
            <Zap className="h-4 w-4 mr-2" />
            Blaster ({poolStats.BLASTER.connected}/{poolStats.BLASTER.total})
          </TabsTrigger>
          <TabsTrigger value="WARMUP" className="relative">
            <Wifi className="h-4 w-4 mr-2" />
            Warmup ({poolStats.WARMUP.connected}/{poolStats.WARMUP.total})
          </TabsTrigger>
        </TabsList>

        {["CRM", "BLASTER", "WARMUP"].map((pool) => (
          <TabsContent key={pool} value={pool} className="space-y-4">
            {filteredSessions.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No {pool} Sessions</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first {pool.toLowerCase()} session to start messaging
                  </p>
                  <SessionDialog 
                    onSave={handleSaveSession}
                    trigger={
                      <Button className="bg-gradient-primary hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add {pool} Session
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session) => (
                  <Card key={session.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        {getStatusIcon(session.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                        <Badge variant="outline" className="text-xs">
                          {session.pool}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {session.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-mono text-sm">{session.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Last Seen</p>
                        <p className="text-sm">{session.lastSeen || "Never"}</p>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        {session.status === "qr_ready" && (
                          <QRDialog 
                            sessionName={session.name}
                            trigger={
                              <Button size="sm" variant="outline" className="flex-1">
                                <QrCode className="h-3 w-3 mr-1" />
                                QR
                              </Button>
                            }
                          />
                        )}
                        {session.status === "disconnected" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleReconnect(session.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reconnect
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Sessions;