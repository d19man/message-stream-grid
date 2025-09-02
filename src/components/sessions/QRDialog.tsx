import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRDialogProps {
  sessionName: string;
  sessionId?: string;
  trigger?: React.ReactNode;
}

export const QRDialog = ({ sessionName, sessionId, trigger }: QRDialogProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchQRCode = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'getQR',
          sessionId: sessionId
        }
      });

      if (error) throw error;

      if (data.qrCode) {
        setQrCode(data.qrCode);
      } else {
        toast({
          title: "QR Code Not Available",
          description: "Please try connecting the session first.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast({
        title: "Error",
        description: "Failed to fetch QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && sessionId) {
      fetchQRCode();
    }
  }, [open, sessionId]);

  const refreshQR = () => {
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
                src={`data:image/png;base64,${qrCode}`}
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
            QR code expires in 20 seconds. Click refresh if needed.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};