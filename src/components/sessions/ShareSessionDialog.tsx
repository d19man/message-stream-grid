import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Share, Crown, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/useUsers";

interface ShareSessionDialogProps {
  trigger?: React.ReactNode;
  sessionName: string;
  onShare?: (adminId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ShareSessionDialog = ({ trigger, sessionName, onShare, open: controlledOpen, onOpenChange }: ShareSessionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const { toast } = useToast();
  const { getAdmins } = useUsers();

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const admins = getAdmins();

  const handleShare = () => {
    if (!selectedAdminId) {
      toast({
        title: "Error",
        description: "Please select an admin to share with",
        variant: "destructive",
      });
      return;
    }

    const selectedAdmin = admins.find(admin => admin.id === selectedAdminId);
    onShare?.(selectedAdminId);
    setOpen(false);
    
    toast({
      title: "Session Shared",
      description: `"${sessionName}" has been shared with ${selectedAdmin?.full_name || selectedAdmin?.email}`,
    });

    setSelectedAdminId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md" aria-describedby="share-session-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-primary" />
            <span>Share Session to Admin</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3" id="share-session-description">
            <p className="text-sm">
              <span className="font-medium">Session:</span> {sessionName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Share this session to admin's storage. The admin can then assign it to their team members (CRM/Blaster/Warmup users) as needed.
            </p>
          </div>

          <div>
            <Label>Select Admin *</Label>
            <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an admin to share with" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {(admin.full_name || admin.email).split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                        <div>
                          <div className="font-medium">{admin.full_name || admin.email}</div>
                          <div className="text-xs text-muted-foreground">{admin.email}</div>
                        </div>
                      <Shield className="h-3 w-3 text-blue-500 ml-auto" />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};