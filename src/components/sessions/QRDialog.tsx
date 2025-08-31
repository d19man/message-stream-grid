import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw } from "lucide-react";

interface QRDialogProps {
  sessionName: string;
  trigger?: React.ReactNode;
}

export const QRDialog = ({ sessionName, trigger }: QRDialogProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshQR = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Mock QR code - in real implementation, this would come from the backend
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp-auth-${sessionName}-${refreshKey}`;

  return (
    <Dialog>
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
            <img 
              src={qrCodeUrl} 
              alt="WhatsApp QR Code" 
              className="w-48 h-48"
              key={refreshKey}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Go to Settings → Linked Devices</p>
            <p>3. Tap "Link a Device"</p>
            <p>4. Point your phone at this screen</p>
          </div>

          {/* Refresh Button */}
          <Button variant="outline" onClick={refreshQR} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
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