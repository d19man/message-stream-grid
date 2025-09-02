import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Smartphone, Zap, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, PoolType } from "@/types";

interface ShareToUserDialogProps {
  trigger?: React.ReactNode;
  sessionName: string;
  sessionPool: PoolType;
  onShare?: (userId: string) => void;
}

// Mock users with specific roles
const mockTeamUsers: (User & { poolRole: PoolType })[] = [
  { id: "user1", email: "alice@example.com", name: "Alice Johnson", roleId: "user", poolRole: "CRM", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user2", email: "bob@example.com", name: "Bob Wilson", roleId: "user", poolRole: "CRM", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user3", email: "carol@example.com", name: "Carol Davis", roleId: "user", poolRole: "BLASTER", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user4", email: "david@example.com", name: "David Brown", roleId: "user", poolRole: "BLASTER", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user5", email: "eve@example.com", name: "Eve Miller", roleId: "user", poolRole: "BLASTER", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user6", email: "frank@example.com", name: "Frank Wilson", roleId: "user", poolRole: "WARMUP", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
];

export const ShareToUserDialog = ({ trigger, sessionName, sessionPool, onShare }: ShareToUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { toast } = useToast();

  // Filter users by pool role
  const availableUsers = mockTeamUsers.filter(user => user.poolRole === sessionPool);

  const handleShare = () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to assign the session to",
        variant: "destructive",
      });
      return;
    }

    const selectedUser = availableUsers.find(user => user.id === selectedUserId);
    onShare?.(selectedUserId);
    setOpen(false);
    
    toast({
      title: "Session Assigned",
      description: `"${sessionName}" has been assigned to ${selectedUser?.name}`,
    });

    setSelectedUserId("");
  };

  const getPoolIcon = (pool: PoolType) => {
    switch (pool) {
      case "CRM": return <Smartphone className="h-4 w-4" />;
      case "BLASTER": return <Zap className="h-4 w-4" />;
      case "WARMUP": return <Wifi className="h-4 w-4" />;
    }
  };

  const getPoolColor = (pool: PoolType) => {
    switch (pool) {
      case "CRM": return "bg-blue-100 text-blue-800";
      case "BLASTER": return "bg-orange-100 text-orange-800";
      case "WARMUP": return "bg-green-100 text-green-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Assign to User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md" aria-describedby="assign-session-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Assign Session to User</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3" id="assign-session-description">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Session: {sessionName}</span>
              <Badge className={getPoolColor(sessionPool)}>
                <div className="flex items-center space-x-1">
                  {getPoolIcon(sessionPool)}
                  <span>{sessionPool}</span>
                </div>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a user from your {sessionPool} team to assign this session to.
            </p>
          </div>

          <div>
            <Label>Available {sessionPool} Users ({availableUsers.length})</Label>
            {availableUsers.length > 0 ? (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${sessionPool} user`} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {user.poolRole}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {sessionPool} users available</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={availableUsers.length === 0}>
              <Users className="h-4 w-4 mr-2" />
              Assign Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};