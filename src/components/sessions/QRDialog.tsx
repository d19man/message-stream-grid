import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { socketClient } from "@/lib/socket-client";

interface QRDialogProps {
  sessionName: string;
  sessionId?: string;
  trigger?: React.ReactNode;
}

export const QRDialog = ({ sessionName, sessionId, trigger }: QRDialogProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const { toast } = useToast();

  const fetchQRCode = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      
      // QR codes will come from Express server via Socket.io
      // For now, show message to user
      toast({
        title: "Connecting to Express Server",
        description: "QR code will be provided by Express server via Socket.io. Please wait...",
      });
      
      // Simulate loading for now - real QR will come via Socket.io
      setTimeout(() => {
        setLoading(false);
        toast({
          title: "QR Code Not Available",
          description: "QR codes are now handled by Express server. Please ensure your Express server is running.",
          variant: "destructive"
        });
      }, 3000);
      
    } catch (error: unknown) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "QR codes are now handled by Express server",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    if (open && sessionId) {
      setQrCode(null); // Reset QR code
      setPollCount(0); // Reset poll count
      
      // Connect to Express server and listen for QR codes
      const socket = socketClient.connect();
      
      // Listen for QR codes from Express server
      socketClient.onQRCode((data) => {
        console.log('QR code received from Express server:', data);
        if (data.session === sessionName || data.session === sessionId) {
          setQrCode(data.qr);
          setLoading(false);
          toast({
            title: "QR Code Ready",
            description: "Scan the QR code with WhatsApp to connect",
          });
        }
      });
      
      fetchQRCode();
    }
    
    return () => {
      // Clean up socket listeners when dialog closes
      socketClient.offQRCode();
    };
  }, [open, sessionId, sessionName, fetchQRCode, toast]);

  const refreshQR = () => {
    setQrCode(null);
    setPollCount(0);
    setLoading(true);
    
    // Request new QR from Express server
    toast({
      title: "Refreshing QR Code",
      description: "Requesting new QR code from Express server...",
    });
    
    fetchQRCode();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <QrCode className="h-3 w-3 mr-1" />
            QR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Connect WhatsApp</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            Session: <span className="font-medium">{sessionName}</span>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            {loading ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : qrCode ? (
              <img 
                src={qrCode}
                alt="WhatsApp QR Code" 
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                No QR Code Available
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Go to Settings → Linked Devices</p>
            <p>3. Tap "Link a Device"</p>
            <p>4. Point your phone at this screen</p>
          </div>

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            onClick={refreshQR} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh QR Code
          </Button>

          <div className="text-xs text-muted-foreground">
            QR code will be provided by Express server via Socket.io. Ensure Express server is running.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};