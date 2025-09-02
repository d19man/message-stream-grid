import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Smartphone, Zap, Wifi, QrCode, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Session, PoolType } from "@/types";

type ConnectionMethod = "qr" | "pairing";

interface SessionDialogProps {
  trigger?: React.ReactNode;
  onSave?: (session: Partial<Session>) => void;
}

export const SessionDialog = ({ trigger, onSave }: SessionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pool: "" as PoolType | "",
    connectionMethod: "qr" as ConnectionMethod,
  });
  const { toast } = useToast();

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Session name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.pool) {
      toast({
        title: "Error",
        description: "Please select a pool",
        variant: "destructive",
      });
      return;
    }

    const sessionStatus = formData.connectionMethod === "qr" ? "qr_required" : "pairing_required";
    onSave?.({ ...formData, status: sessionStatus } as Partial<Session>);
    setOpen(false);
    toast({
      title: "Success",
      description: `Session created successfully! Please use ${formData.connectionMethod === "qr" ? "QR code" : "pairing code"} to connect.`,
    });

    // Reset form
    setFormData({ name: "", pool: "" as PoolType | "", connectionMethod: "qr" });
  };

  const getPoolIcon = (pool: string) => {
    switch (pool) {
      case "CRM": return <Smartphone className="h-4 w-4" />;
      case "BLASTER": return <Zap className="h-4 w-4" />;
      case "WARMUP": return <Wifi className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPoolDescription = (pool: string) => {
    switch (pool) {
      case "CRM": return "For customer relationship management";
      case "BLASTER": return "For bulk message campaigns";
      case "WARMUP": return "For account warming activities";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Session</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Session Name */}
          <div>
            <Label htmlFor="name">Session Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter session name (e.g., CRM-Main, Blast-01)"
            />
          </div>

          {/* Pool Selection */}
          <div>
            <Label>Pool Type *</Label>
            <Select value={formData.pool} onValueChange={(value: PoolType) => 
              setFormData(prev => ({ ...prev, pool: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select pool type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRM">
                  <div className="flex items-center space-x-2">
                    {getPoolIcon("CRM")}
                    <div>
                      <div className="font-medium">CRM</div>
                      <div className="text-xs text-muted-foreground">{getPoolDescription("CRM")}</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="BLASTER">
                  <div className="flex items-center space-x-2">
                    {getPoolIcon("BLASTER")}
                    <div>
                      <div className="font-medium">Blaster</div>
                      <div className="text-xs text-muted-foreground">{getPoolDescription("BLASTER")}</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="WARMUP">
                  <div className="flex items-center space-x-2">
                    {getPoolIcon("WARMUP")}
                    <div>
                      <div className="font-medium">Warmup</div>
                      <div className="text-xs text-muted-foreground">{getPoolDescription("WARMUP")}</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Connection Method */}
          <div>
            <Label>Connection Method *</Label>
            <RadioGroup 
              value={formData.connectionMethod} 
              onValueChange={(value: ConnectionMethod) => 
                setFormData(prev => ({ ...prev, connectionMethod: value }))
              }
              className="mt-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="qr" id="qr" />
                <div className="flex items-center space-x-2 flex-1">
                  <QrCode className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="qr" className="font-medium cursor-pointer">QR Code</Label>
                    <p className="text-xs text-muted-foreground">Scan QR code with WhatsApp mobile app</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="pairing" id="pairing" />
                <div className="flex items-center space-x-2 flex-1">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="pairing" className="font-medium cursor-pointer">Pairing Code</Label>
                    <p className="text-xs text-muted-foreground">Enter 8-digit code in WhatsApp settings</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Info */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              {formData.connectionMethod === "qr" 
                ? "After creating the session, you'll need to scan a QR code to connect your WhatsApp account."
                : "After creating the session, you'll get an 8-digit pairing code to enter in WhatsApp settings."
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
              Create Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};