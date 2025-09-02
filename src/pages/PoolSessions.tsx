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
  Crown
} from "lucide-react";
import type { Session, PoolType, User, Role } from "@/types";
import { SessionDialog } from "@/components/sessions/SessionDialog";
import { ShareSessionDialog } from "@/components/sessions/ShareSessionDialog";
import { ShareToUserDialog } from "@/components/sessions/ShareToUserDialog";

// Mock current user - in real app, this would come from auth context
const getCurrentUser = (role: "Super Admin" | "Admin" | "CRM" | "Blaster" | "Warmup"): User & { role: Role } => ({
  id: "current-user",
  email: "admin@example.com",
  name: "John Smith",
  roleId: role === "Super Admin" ? "1" : role === "Admin" ? "2" : "3",
  role: {
    id: role === "Super Admin" ? "1" : role === "Admin" ? "2" : "3",
    name: role,
    permissions: role === "Super Admin" ? ["*"] : 
                role === "Admin" ? ["read:pool-session", "create:pool-session", "transfer:pool-session", "delete:pool-session"] :
                ["read:pool-session"],
    description: role === "Super Admin" ? "Full system access" : 
                role === "Admin" ? "Admin access" : 
                `${role} user access`,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
});

// Permission checking utility
const hasPermission = (user: User & { role: Role }, permission: string): boolean => {
  if (user.role.permissions.includes("*")) return true;
  return user.role.permissions.includes(permission);
};

// Mock users for assignment
const mockUsers: User[] = [
  { id: "user1", email: "user1@example.com", name: "Alice Johnson", roleId: "2", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user2", email: "user2@example.com", name: "Bob Wilson", roleId: "3", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user3", email: "user3@example.com", name: "Carol Davis", roleId: "2", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
];

const PoolSessions = () => {
  const [currentUserRole, setCurrentUserRole] = useState<"Super Admin" | "Admin" | "CRM" | "Blaster" | "Warmup">("Super Admin");
  
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "ps1",
      name: "CRM Session - Alice",
      pool: "CRM",
      status: "connected",
      phone: "+1234567890",
      lastSeen: "2 minutes ago",
      userId: "user1",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "ps2", 
      name: "Blaster Session - Bob",
      pool: "BLASTER",
      status: "disconnected",
      phone: "+1987654321",
      lastSeen: "1 hour ago",
      userId: "user2",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T09:00:00Z"
    }
  ]);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sessionId: string | null; isHardDelete: boolean }>({
    open: false, 
    sessionId: null,
    isHardDelete: false
  });
  
  const [selectedSessionForAssignment, setSelectedSessionForAssignment] = useState<Session | null>(null);
  
  const currentUser = getCurrentUser(currentUserRole);
  
  // Get available pools based on user role
  const getAvailablePools = (): PoolType[] => {
    if (currentUser.role.name === "Super Admin" || currentUser.role.name === "Admin") {
      return ["CRM", "BLASTER", "WARMUP"];
    }
    // Regular users only see their specific pool
    return [currentUser.role.name as PoolType];
  };

  const availablePools = getAvailablePools();
  const [activeTab, setActiveTab] = useState<PoolType>(availablePools[0] || "CRM");
  
  const { toast } = useToast();

  const canCreateSession = hasPermission(currentUser, "create:pool-session");
  const canTransferSession = hasPermission(currentUser, "transfer:pool-session");
  const canDeleteSession = hasPermission(currentUser, "delete:pool-session");
  const canPurgeSession = hasPermission(currentUser, "purge:pool-session");

  const handleSaveSession = (sessionData: Partial<Session>) => {
    const newSession: Session = {
      id: `ps${Date.now()}`,
      name: sessionData.name || "New Session",
      pool: sessionData.pool || activeTab,
      status: "disconnected",
      phone: "",
      lastSeen: "Never",
      userId: sessionData.userId || mockUsers[0].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSessions(prev => [...prev, newSession]);
    toast({
      title: "Session Created",
      description: `Pool session "${newSession.name}" has been created and assigned.`
    });
  };

  const handleDeleteSession = (sessionId: string, isHardDelete = false) => {
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

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setDeleteDialog({ open: false, sessionId: null, isHardDelete: false });
    
    toast({
      title: isHardDelete ? "Session Purged" : "Session Deleted",
      description: `Session has been ${isHardDelete ? 'permanently removed' : 'soft deleted'}.`
    });
  };

  const handleTransferSession = (sessionId: string) => {
    if (!canTransferSession) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to transfer sessions.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Transfer Session",
      description: "Transfer functionality would be implemented here."
    });
  };

  const handleClearDistribution = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Reset session assignment
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, userId: "", status: "disconnected", phone: "", lastSeen: "Never" }
        : s
    ));

    toast({
      title: "Distribution Cleared",
      description: `Session "${session.name}" has been cleared and is ready for admin distribution.`
    });
  };

  const handleAssignToUser = (userId: string) => {
    if (!selectedSessionForAssignment) return;

    setSessions(prev => prev.map(s => 
      s.id === selectedSessionForAssignment.id 
        ? { ...s, userId: userId }
        : s
    ));

    setSelectedSessionForAssignment(null);
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

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user?.name || "Unknown User";
  };

  const filteredSessions = sessions.filter(session => session.pool === activeTab);
  const poolStats = {
    CRM: sessions.filter(s => s.pool === "CRM"),
    BLASTER: sessions.filter(s => s.pool === "BLASTER"), 
    WARMUP: sessions.filter(s => s.pool === "WARMUP")
  };

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
          <Button 
            variant={currentUserRole === "Super Admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentUserRole("Super Admin")}
          >
            Super Admin
          </Button>
          <Button 
            variant={currentUserRole === "Admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentUserRole("Admin")}
          >
            Admin
          </Button>
          <Button 
            variant={currentUserRole === "CRM" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentUserRole("CRM")}
          >
            CRM User
          </Button>
          <Button 
            variant={currentUserRole === "Blaster" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentUserRole("Blaster")}
          >
            Blaster User
          </Button>
          <Button 
            variant={currentUserRole === "Warmup" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentUserRole("Warmup")}
          >
            Warmup User
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
                          {currentUser.role.name === "Super Admin" && (
                            <>
                              <DropdownMenuItem asChild>
                                <div>
                                  <ShareSessionDialog 
                                    sessionName={session.name}
                                    onShare={(adminId) => console.log('Shared to admin:', adminId)}
                                    trigger={
                                      <div className="flex items-center w-full cursor-pointer">
                                        <Crown className="h-4 w-4 mr-2" />
                                        Share to Admin
                                      </div>
                                    }
                                  />
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClearDistribution(session.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Clear Distribution
                              </DropdownMenuItem>
                            </>
                          )}
                          {currentUser.role.name === "Admin" && (
                            <DropdownMenuItem 
                              onClick={() => {
                                // We'll handle this with a separate state
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
                          <span className="text-sm font-medium">{getUserName(session.userId)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Phone</span>
                          <span className="text-sm">{session.phone || "Not connected"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last seen</span>
                          <span className="text-sm">{session.lastSeen}</span>
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