import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Share, Crown, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types";

interface ShareSessionDialogProps {
  trigger?: React.ReactNode;
  sessionName: string;
  onShare?: (adminId: string) => void;
}

// Mock admin users
const mockAdmins: User[] = [
  { id: "admin1", email: "admin1@example.com", name: "Sarah Manager", roleId: "admin", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "admin2", email: "admin2@example.com", name: "Mike Supervisor", roleId: "admin", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "admin3", email: "admin3@example.com", name: "Lisa Leader", roleId: "admin", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
];

export const ShareSessionDialog = ({ trigger, sessionName, onShare }: ShareSessionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const { toast } = useToast();

  const handleShare = () => {
    if (!selectedAdminId) {
      toast({
        title: "Error",
        description: "Please select an admin to share with",
        variant: "destructive",
      });
      return;
    }

    const selectedAdmin = mockAdmins.find(admin => admin.id === selectedAdminId);
    onShare?.(selectedAdminId);
    setOpen(false);
    
    toast({
      title: "Session Shared",
      description: `"${sessionName}" has been shared with ${selectedAdmin?.name}`,
    });

    setSelectedAdminId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share to Admin
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-primary" />
            <span>Share Session to Admin</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm">
              <span className="font-medium">Session:</span> {sessionName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This session will be shared with the selected admin who can then distribute it to their team members.
            </p>
          </div>

          <div>
            <Label>Select Admin *</Label>
            <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an admin to share with" />
              </SelectTrigger>
              <SelectContent>
                {mockAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {admin.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{admin.name}</div>
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