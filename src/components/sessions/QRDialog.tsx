import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { socketClient } from "@/lib/socket-client";

interface QRDialogProps {
  sessionName: string;
  sessionId: string;
  trigger?: React.ReactNode;
}

export const QRDialog = ({ sessionName, sessionId, trigger }: QRDialogProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Connect to socket and listen for QR codes when dialog opens
  useEffect(() => {
    if (open && sessionId) {
      console.log('Setting up QR listener for session:', sessionId);
      
      const socket = socketClient.connect();
      
      const handleQRCode = (data: { session: string; qr: string }) => {
        console.log('QR code received in dialog:', data);
        if (data.session === sessionId) {
          setQrCode(data.qr);
          setLoading(false);
          toast({
            title: "QR Code Ready",
            description: "Scan the QR code with your WhatsApp app",
          });
        }
      };

      const handleStatusUpdate = (data: { session: string; status: string }) => {
        console.log('Status update in QR dialog:', data);
        if (data.session === sessionId && data.status === 'connected') {
          setOpen(false);
          setQrCode(null);
          toast({
            title: "Connected!",
            description: "WhatsApp session connected successfully",
          });
        }
      };

      socketClient.onQRCode(handleQRCode);
      socketClient.onStatusUpdate(handleStatusUpdate);

      return () => {
        socketClient.offQRCode(handleQRCode);
        socketClient.offStatusUpdate(handleStatusUpdate);
      };
    }
  }, [open, sessionId, toast]);

  // Request QR code when dialog opens
  useEffect(() => {
    if (open && sessionId) {
      setLoading(true);
      setQrCode(null);
      
      // Request QR code from socket
      const socket = socketClient.getSocket();
      if (socket) {
        socket.emit('request_qr', sessionId);
      }
      
      // Set timeout to stop loading if no QR received
      const timeout = setTimeout(() => {
        setLoading(false);
        if (!qrCode) {
          toast({
            title: "Timeout",
            description: "QR code generation timed out. Try refreshing.",
            variant: "destructive"
          });
        }
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [open, sessionId]);

  const refreshQR = () => {
    setLoading(true);
    setQrCode(null);
    
    const socket = socketClient.getSocket();
    if (socket) {
      socket.emit('request_qr', sessionId);
    }
    
    toast({
      title: "Refreshing QR Code",
      description: "Generating new QR code...",
    });
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