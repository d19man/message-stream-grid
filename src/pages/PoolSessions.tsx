import { useState } from "react";
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
  Loader2
} from "lucide-react";
import type { PoolType } from "@/types";
import { SessionDialog } from "@/components/sessions/SessionDialog";
import { ShareSessionDialog } from "@/components/sessions/ShareSessionDialog";
import { ShareToUserDialog } from "@/components/sessions/ShareToUserDialog";

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

  const filteredSessions = sessions.filter(session => session.pool === activeTab);
  const poolStats = {
    CRM: sessions.filter(s => s.pool === "CRM"),
    BLASTER: sessions.filter(s => s.pool === "BLASTER"), 
    WARMUP: sessions.filter(s => s.pool === "WARMUP")
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
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Manage and share WhatsApp sessions across teams
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
                          <span className="text-sm text-muted-foreground">Assigned to</span>
                          <span className="text-sm font-medium">{getUserName(session.user_id || "")}</span>
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