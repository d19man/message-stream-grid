import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, RefreshCw, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PairingDialogProps {
  sessionName: string;
  trigger?: React.ReactNode;
}

export const PairingDialog = ({ sessionName, trigger }: PairingDialogProps) => {
  const [pairingCode, setPairingCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const { toast } = useToast();

  // Generate random 8-digit pairing code
  const generatePairingCode = () => {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    setPairingCode(code);
    setTimeLeft(60);
  };

  // Initialize pairing code on mount
  useEffect(() => {
    generatePairingCode();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pairingCode);
    toast({
      title: "Copied!",
      description: "Pairing code copied to clipboard",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog>
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
        
        <div className="space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            Session: <span className="font-medium">{sessionName}</span>
          </div>
          
          {/* Pairing Code Display */}
          <div className="bg-muted rounded-lg p-6">
            <div className="text-3xl font-mono font-bold tracking-wider text-primary mb-2">
              {pairingCode.slice(0, 4)} {pairingCode.slice(4)}
            </div>
            <div className="text-sm text-muted-foreground">
              Expires in: <span className="font-medium text-warning">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-muted-foreground text-left">
            <p className="font-medium text-foreground">Instructions:</p>
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Go to Settings → Linked Devices</p>
            <p>3. Tap "Link a Device"</p>
            <p>4. Tap "Link with Phone Number Instead"</p>
            <p>5. Enter the 8-digit code above</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={copyToClipboard} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
            <Button variant="outline" onClick={generatePairingCode} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              New Code
            </Button>
          </div>

          {timeLeft === 0 && (
            <div className="text-sm text-destructive">
              Code expired. Click "New Code" to generate a fresh one.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};