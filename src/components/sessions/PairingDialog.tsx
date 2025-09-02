import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, RefreshCw, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PairingDialogProps {
  sessionName: string;
  sessionId: string;
  trigger?: React.ReactNode;
}

export const PairingDialog = ({ sessionName, sessionId, trigger }: PairingDialogProps) => {
  const [pairingCode, setPairingCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Request pairing code from demo system
  const requestPairingCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate a mock pairing code for demo purposes
      const mockCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setPairingCode(mockCode);
      
      // Update session status
      await supabase
        .from('sessions')
        .update({ 
          status: 'pairing_required',
          phone: phoneNumber 
        })
        .eq('id', sessionId);
      
      toast({
        title: "Pairing Code Generated",
        description: "Enter this code in your WhatsApp app",
      });
    } catch (error: any) {
      console.error('Error requesting pairing code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request pairing code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pairingCode);
    toast({
      title: "Copied!",
      description: "Pairing code copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <KeyRound className="h-3 w-3 mr-1" />
            Pairing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5" />
            <span>Pairing Code</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Session: <span className="font-medium">{sessionName}</span>
          </div>
          
          {/* Phone Number Input */}
          {!pairingCode && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number (e.g., +628123456789)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <div className="text-xs text-muted-foreground">
                Include country code (e.g., +62 for Indonesia)
              </div>
            </div>
          )}

          {/* Pairing Code Display */}
          {pairingCode && (
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="text-3xl font-mono font-bold tracking-wider text-primary mb-2">
                {pairingCode}
              </div>
              <div className="text-sm text-muted-foreground">
                Enter this code in WhatsApp
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Instructions:</p>
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Go to Settings → Linked Devices</p>
            <p>3. Tap "Link a Device"</p>
            <p>4. Tap "Link with Phone Number Instead"</p>
            {pairingCode && <p>5. Enter the code: <strong className="text-foreground">{pairingCode}</strong></p>}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!pairingCode ? (
              <Button 
                onClick={requestPairingCode} 
                className="w-full"
                disabled={loading || !phoneNumber.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Get Pairing Code
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button variant="outline" onClick={() => {
                  setPairingCode("");
                  setPhoneNumber("");
                }} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Code
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};