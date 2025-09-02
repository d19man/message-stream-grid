import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Smartphone, Zap, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/useUsers";
import type { PoolType } from "@/types";

interface ShareToUserDialogProps {
  trigger?: React.ReactNode;
  sessionName: string;
  sessionPool: PoolType;
  onShare?: (userId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ShareToUserDialog = ({ trigger, sessionName, sessionPool, onShare, open: controlledOpen, onOpenChange }: ShareToUserDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { toast } = useToast();
  const { getUsersByPool } = useUsers();

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Filter users by pool role - for now, get all regular users
  const availableUsers = getUsersByPool(sessionPool);

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
      description: `"${sessionName}" has been assigned to ${selectedUser?.full_name || selectedUser?.email}`,
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
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
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
                            {(user.full_name || user.email).split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name || user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {user.role}
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