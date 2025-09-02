import { useState, useEffect } from "react";
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
  KeyRound,
  Loader2,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SessionDialog } from "@/components/sessions/SessionDialog";
import { QRDialog } from "@/components/sessions/QRDialog";
import { PairingDialog } from "@/components/sessions/PairingDialog";
import { useToast } from "@/hooks/use-toast";
import { useSessions, Session } from "@/hooks/useSessions";
import { useAuth } from "@/contexts/AuthContext";
import type { PoolType } from "@/types";

const Sessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { sessions, loading, createSession, deleteSession, updateSession } = useSessions();

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
  
  // Set default active tab based on user role
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

  const [activeTab, setActiveTab] = useState<PoolType>("CRM");

  // Update active tab when profile loads
  useEffect(() => {
    if (profile?.role) {
      const defaultPool = getDefaultPool();
      setActiveTab(defaultPool);
    }
  }, [profile?.role]);
  
  const handleSaveSession = async (sessionData: Partial<Session>) => {
    const result = await createSession({
      name: sessionData.name || "New Session",
      pool: sessionData.pool || activeTab,
    });
    
    if (result) {
      toast({
        title: "Session Created",
        description: `Session "${result.name}" has been created.`
      });
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      const success = await deleteSession(id);
      if (success) {
        toast({
          title: "Success",
          description: "Session deleted successfully!",
        });
      }
    }
  };

  const handleReconnect = async (sessionId: string) => {
    const result = await updateSession(sessionId, { status: "connecting" });
    if (result) {
      toast({
        title: "Reconnecting",
        description: "Attempting to reconnect session...",
      });
      
      // Simulate reconnection process
      setTimeout(async () => {
        await updateSession(sessionId, { status: "disconnected" });
      }, 2000);
    }
  };

  const handleNewCampaign = () => {
    navigate("/broadcast");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-success" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-destructive" />;
      case "connecting":
        return <RotateCcw className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      connected: { variant: "default" as const, className: "bg-success text-success-foreground" },
      disconnected: { variant: "destructive" as const, className: "" },
      connecting: { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  // Filter sessions based on user role and assignment
  const getUserSessions = () => {
    if (!user) return [];
    
    if (profile?.role === "superadmin") {
      return sessions; // Superadmin sees all sessions
    } else if (profile?.role === "admin") {
      return sessions.filter(s => s.admin_id === user.id || s.user_id === user.id);
    } else {
      return sessions.filter(s => s.user_id === user.id); // Regular users only see their assigned sessions
    }
  };

  const filteredSessions = getUserSessions().filter(session => session.pool === activeTab);
  const allUserSessions = getUserSessions();

  const poolStats = {
    CRM: { total: allUserSessions.filter(s => s.pool === "CRM").length, connected: allUserSessions.filter(s => s.pool === "CRM" && s.status === "connected").length },
    BLASTER: { total: allUserSessions.filter(s => s.pool === "BLASTER").length, connected: allUserSessions.filter(s => s.pool === "BLASTER" && s.status === "connected").length },
    WARMUP: { total: allUserSessions.filter(s => s.pool === "WARMUP").length, connected: allUserSessions.filter(s => s.pool === "WARMUP" && s.status === "connected").length },
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading sessions...</span>
        </div>
      </div>
    );
  }

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

      {/* Info Banner for Users */}
      {profile?.role !== "superadmin" && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {profile?.role === "admin" 
              ? "These are sessions assigned to you and your users by Super Admin"
              : "These are sessions assigned to you by your Admin"
            }
          </span>
        </div>
      )}

      {/* Pool Tabs - Only show pools available to user */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PoolType)}>
        <TabsList className={`grid w-full ${availablePools.length === 1 ? 'grid-cols-1' : availablePools.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {availablePools.includes("CRM") && (
            <TabsTrigger value="CRM" className="relative">
              <Smartphone className="h-4 w-4 mr-2" />
              CRM ({poolStats.CRM.connected}/{poolStats.CRM.total})
            </TabsTrigger>
          )}
          {availablePools.includes("BLASTER") && (
            <TabsTrigger value="BLASTER" className="relative">
              <Zap className="h-4 w-4 mr-2" />
              Blaster ({poolStats.BLASTER.connected}/{poolStats.BLASTER.total})
            </TabsTrigger>
          )}
          {availablePools.includes("WARMUP") && (
            <TabsTrigger value="WARMUP" className="relative">
              <Wifi className="h-4 w-4 mr-2" />
              Warmup ({poolStats.WARMUP.connected}/{poolStats.WARMUP.total})
            </TabsTrigger>
          )}
        </TabsList>

        {availablePools.map((pool) => (
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
                        <p className="text-sm">{session.last_seen || "Never"}</p>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
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