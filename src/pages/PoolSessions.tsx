import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useSessions, Session } from "@/hooks/useSessions";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { socketClient } from "@/lib/socket-client";
import { 
  Plus, 
  MoreHorizontal, 
  QrCode, 
  Key, 
  RefreshCw, 
  Trash2,
  Shield,
  ShieldAlert,
  Info,
  ArrowRightLeft,
  Crown,
  Loader2,
  Activity,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import type { PoolType } from "@/types";
import { SessionDialog } from "@/components/sessions/SessionDialog";
import { ShareSessionDialog } from "@/components/sessions/ShareSessionDialog";
import { ShareToUserDialog } from "@/components/sessions/ShareToUserDialog";

interface BackendHealth {
  ok: boolean;
  timestamp?: string;
  backend?: string;
  supabase?: string;
  whatsapp?: string;
  error?: string;
}

interface WhatsAppStatus {
  session: string;
  status: 'qr_ready' | 'connected' | 'disconnected';
  qr?: string;
}

const PoolSessions = () => {
  const { user, profile } = useAuth();
  const { sessions, loading: sessionsLoading, createSession, deleteSession, shareToAdmin, assignToUser, clearDistribution } = useSessions();
  const { users, loading: usersLoading, getAdmins, getUsersByPool, getUserName } = useUsers();
  const { toast } = useToast();
  
  const [selectedSessionForAssignment, setSelectedSessionForAssignment] = useState<Session | null>(null);
  const [selectedSessionForSharing, setSelectedSessionForSharing] = useState<Session | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sessionId: string | null; isHardDelete: boolean }>({
    open: false, 
    sessionId: null,
    isHardDelete: false
  });
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    session: 'device1',
    status: 'disconnected'
  });
  const [healthLoading, setHealthLoading] = useState(false);

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = socketClient.connect();
    
    socket.on('connect', () => {
      setBackendConnected(true);
      checkBackendHealth();
    });

    socket.on('disconnect', () => {
      setBackendConnected(false);
    });
    
    socketClient.onQRCode((data) => {
      setWhatsappStatus({
        session: data.session,
        status: 'qr_ready',
        qr: data.qr
      });
      toast({
        title: "QR Code Ready",
        description: `Scan QR code to connect ${data.session}`,
      });
    });
    
    socketClient.onStatusUpdate((data) => {
      setWhatsappStatus({
        session: data.session,
        status: data.status as any,
      });
    });
    
    return () => {
      socketClient.offQRCode();
      socketClient.offStatusUpdate();
    };
  }, [toast]);

  const checkBackendHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setBackendHealth(data);
    } catch (error) {
      setBackendHealth({
        ok: false,
        error: "Backend connection failed"
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      const response = await fetch('http://localhost:3001/wa/device1/sendText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jid: '6281234567890@s.whatsapp.net',
          text: 'Test message from Pool Sessions!'
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "Message Sent",
          description: "Test message sent successfully!",
        });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const getWhatsAppStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'qr_ready':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  // Get available pools based on user role
  const getAvailablePools = (): PoolType[] => {
    if (!profile) return ["CRM"];
    
    if (profile.role === "superadmin" || profile.role === "admin") {
      return ["CRM", "BLASTER", "WARMUP"];
    }
    // Regular users see all pools for now - could be customized later
    return ["CRM", "BLASTER", "WARMUP"];
  };

  const availablePools = getAvailablePools();
  const [activeTab, setActiveTab] = useState<PoolType>(availablePools[0] || "CRM");

  // Permission checks
  const canCreateSession = profile?.role === "superadmin";
  const canDeleteSession = profile?.role === "superadmin" || profile?.role === "admin";
  const canPurgeSession = profile?.role === "superadmin";

  const handleSaveSession = async (sessionData: Partial<Session>) => {
    const result = await createSession({
      name: sessionData.name || "New Session",
      pool: sessionData.pool || activeTab,
      user_id: sessionData.user_id
    });
    
    if (result) {
      toast({
        title: "Session Created",
        description: `Session "${result.name}" has been created.`
      });
    }
  };

  const handleDeleteSession = async (sessionId: string, isHardDelete = false) => {
    if (isHardDelete && !canPurgeSession) {
      toast({
        title: "Permission Denied",
        description: "Only Super Admin can permanently delete sessions.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isHardDelete && !canDeleteSession) {
      toast({
        title: "Permission Denied", 
        description: "You don't have permission to delete sessions.",
        variant: "destructive"
      });
      return;
    }

    const success = await deleteSession(sessionId);
    if (success) {
      setDeleteDialog({ open: false, sessionId: null, isHardDelete: false });
    }
  };

  const handleClearDistribution = async (sessionId: string) => {
    const result = await clearDistribution(sessionId);
    if (result) {
      toast({
        title: "Distribution Cleared",
        description: `Session "${result.name}" has been cleared and is ready for admin distribution.`
      });
    }
  };

  const handleAssignToUser = async (userId: string) => {
    if (!selectedSessionForAssignment) return;

    const result = await assignToUser(selectedSessionForAssignment.id, userId);
    if (result) {
      const userName = getUserName(userId);
      toast({
        title: "Session Assigned",
        description: `"${result.name}" has been assigned to ${userName}`,
      });
    }

    setSelectedSessionForAssignment(null);
  };

  const handleShareToAdmin = async (adminId: string) => {
    if (!selectedSessionForSharing) return;

    const result = await shareToAdmin(selectedSessionForSharing.id, adminId);
    if (result) {
      const adminName = getUserName(adminId);
      toast({
        title: "Session Shared to Admin",
        description: `"${result.name}" has been shared to ${adminName}`,
      });
    }

    setSelectedSessionForSharing(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "connecting": return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected": return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case "connecting": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Connecting</Badge>;
      default: return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  // Filter sessions based on user role and assignment status for Pool Sessions
  const getPoolSessions = () => {
    if (profile?.role === "superadmin") {
      return sessions; // Superadmin sees all sessions in pool
    } else if (profile?.role === "admin") {
      // Admin sees sessions that are assigned to them or not yet assigned to users
      return sessions.filter(s => s.admin_id === user?.id || (!s.user_id && !s.admin_id));
    } else {
      // Regular users don't access pool sessions
      return [];
    }
  };

  const filteredSessions = getPoolSessions().filter(session => session.pool === activeTab);
  const allPoolSessions = getPoolSessions();
  
  const poolStats = {
    CRM: allPoolSessions.filter(s => s.pool === "CRM"),
    BLASTER: allPoolSessions.filter(s => s.pool === "BLASTER"), 
    WARMUP: allPoolSessions.filter(s => s.pool === "WARMUP")
  };

  // Show loading state
  if (sessionsLoading || usersLoading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pool Sessions</h1>
          <p className="text-muted-foreground">
            Monitor and manage WhatsApp sessions across teams with real-time backend integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={checkBackendHealth} disabled={healthLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
            Check Health
          </Button>
          <Button variant="outline" onClick={sendTestMessage}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Test Message
          </Button>
          {canCreateSession ? (
            <SessionDialog 
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Session
                </Button>
              }
              onSave={handleSaveSession}
            />
          ) : (
            <Button disabled title="Only Super Admin can add sessions">
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          )}
        </div>
      </div>

      {/* Backend Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend Health */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Backend Health</span>
              </div>
              <Badge variant={backendHealth?.ok ? 'default' : 'destructive'} className="text-xs">
                {backendHealth?.ok ? 'Healthy' : 'Error'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {backendHealth ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supabase:</span>
                  <span className={backendHealth.supabase === 'Connected' ? 'text-green-600' : 'text-red-600'}>
                    {backendHealth.supabase || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp:</span>
                  <span className="text-green-600">{backendHealth.whatsapp || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Click "Check Health" to verify backend status</div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                {getWhatsAppStatusIcon(whatsappStatus.status)}
                <span>WhatsApp Integration</span>
              </div>
              <Badge variant={backendConnected ? 'default' : 'destructive'} className="text-xs">
                {backendConnected ? 'Connected' : 'Offline'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{whatsappStatus.session}</div>
                <div className="text-xs text-muted-foreground">{whatsappStatus.status.replace('_', ' ')}</div>
              </div>
              {whatsappStatus.status === 'qr_ready' && whatsappStatus.qr && (
                <img 
                  src={whatsappStatus.qr} 
                  alt="WhatsApp QR Code" 
                  className="w-12 h-12 border rounded"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permission Banner */}
      {!canCreateSession && (
        <div className="flex items-center space-x-2 p-3 bg-muted/50 border border-muted rounded-lg">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Only Super Admin can add new sessions to users.
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PoolType)}>
        <TabsList className={`grid w-full ${availablePools.length === 3 ? 'grid-cols-3' : availablePools.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {availablePools.includes("CRM") && (
            <TabsTrigger value="CRM" className="flex items-center space-x-2">
              <span>CRM</span>
              <Badge variant="secondary">
                {poolStats.CRM.filter(s => s.status === "connected").length}/{poolStats.CRM.length}
              </Badge>
            </TabsTrigger>
          )}
          {availablePools.includes("BLASTER") && (
            <TabsTrigger value="BLASTER" className="flex items-center space-x-2">
              <span>Blaster</span>
              <Badge variant="secondary">
                {poolStats.BLASTER.filter(s => s.status === "connected").length}/{poolStats.BLASTER.length}
              </Badge>
            </TabsTrigger>
          )}
          {availablePools.includes("WARMUP") && (
            <TabsTrigger value="WARMUP" className="flex items-center space-x-2">
              <span>Warmup</span>
              <Badge variant="secondary">
                {poolStats.WARMUP.filter(s => s.status === "connected").length}/{poolStats.WARMUP.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Content */}
        {availablePools.map(pool => (
          <TabsContent key={pool} value={pool} className="space-y-4">
            {filteredSessions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <CardTitle className="text-base">{session.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            Pairing Code
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reconnect
                          </DropdownMenuItem>
                          {profile?.role === "superadmin" && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedSessionForSharing(session);
                                }}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Share to Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClearDistribution(session.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Clear Distribution
                              </DropdownMenuItem>
                            </>
                          )}
                          {profile?.role === "admin" && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedSessionForAssignment(session);
                              }}
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Assign to User
                            </DropdownMenuItem>
                          )}
                          {canDeleteSession && (
                            <DropdownMenuItem 
                              onClick={() => setDeleteDialog({ open: true, sessionId: session.id, isHardDelete: false })}
                              className="text-orange-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Soft Delete
                            </DropdownMenuItem>
                          )}
                          {canPurgeSession && (
                            <DropdownMenuItem 
                              onClick={() => setDeleteDialog({ open: true, sessionId: session.id, isHardDelete: true })}
                              className="text-red-600"
                            >
                              <ShieldAlert className="h-4 w-4 mr-2" />
                              Purge (Hard Delete)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          {getStatusBadge(session.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {session.user_id ? "Assigned to" : session.admin_id ? "With Admin" : "Available"}
                          </span>
                          <span className="text-sm font-medium">
                            {session.user_id 
                              ? getUserName(session.user_id)
                              : session.admin_id 
                                ? getUserName(session.admin_id)
                                : "Not assigned"
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Phone</span>
                          <span className="text-sm">{session.phone || "Not connected"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last seen</span>
                          <span className="text-sm">{session.last_seen}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <CardTitle className="text-lg mb-2">No {pool} Sessions</CardTitle>
                  <CardDescription className="text-center mb-4">
                    No sessions found in the {pool} pool.
                    {canCreateSession && " Create a new session to get started."}
                  </CardDescription>
                  {canCreateSession && (
                    <SessionDialog 
                      trigger={
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Session
                        </Button>
                      }
                      onSave={handleSaveSession}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Share to Admin Dialog */}
      {selectedSessionForSharing && (
        <ShareSessionDialog 
          sessionName={selectedSessionForSharing.name}
          onShare={handleShareToAdmin}
          open={true}
          onOpenChange={(open) => !open && setSelectedSessionForSharing(null)}
        />
      )}

      {/* Assign to User Dialog */}
      {selectedSessionForAssignment && (
        <ShareToUserDialog 
          sessionName={selectedSessionForAssignment.name}
          sessionPool={selectedSessionForAssignment.pool}
          onShare={handleAssignToUser}
          open={true}
          onOpenChange={(open) => !open && setSelectedSessionForAssignment(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              {deleteDialog.isHardDelete ? (
                <ShieldAlert className="h-5 w-5 text-red-500" />
              ) : (
                <Trash2 className="h-5 w-5 text-orange-500" />
              )}
              <span>{deleteDialog.isHardDelete ? "Permanently Delete Session" : "Delete Session"}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isHardDelete ? (
                "This action cannot be undone. This will permanently delete the session and remove all associated data."
              ) : (
                "This will soft delete the session. The session can be restored later if needed."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.sessionId && handleDeleteSession(deleteDialog.sessionId, deleteDialog.isHardDelete)}
              className={deleteDialog.isHardDelete ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {deleteDialog.isHardDelete ? "Permanently Delete" : "Soft Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PoolSessions;