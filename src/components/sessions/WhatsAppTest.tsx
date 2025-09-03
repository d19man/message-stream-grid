import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { QRDialog } from './QRDialog';
import { PairingDialog } from './PairingDialog';
import { useToast } from '@/hooks/use-toast';

export const WhatsAppTest = () => {
  const [sessionName, setSessionName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const { sessions, loading, createSession, connectSession, disconnectSession, sendMessage } = useWhatsApp();
  const { toast } = useToast();

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session name",
        variant: "destructive"
      });
      return;
    }

    try {
      await createSession(sessionName);
      setSessionName('');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSendMessage = async (sessionId: string) => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({
        title: "Error", 
        description: "Please enter phone number and message",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendMessage(sessionId, phoneNumber, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'connecting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';  
      case 'qr_ready': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'disconnected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  if (loading) {
    return <div className="p-4">Loading WhatsApp sessions...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Baileys Integration Test</CardTitle>
          <CardDescription>
            Test WhatsApp API dan Socket integration dengan Baileys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Session */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                placeholder="Enter session name..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateSession}>
                Create Session
              </Button>
            </div>
          </div>

          {/* Message Test */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="628123456789@s.whatsapp.net"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                placeholder="Test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">WhatsApp Sessions</h3>
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No sessions yet. Create your first session above.
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{session.session_name}</h4>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    {session.phone_number && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Phone: {session.phone_number}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Last seen: {new Date(session.last_seen).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {session.status === 'disconnected' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => connectSession(session.id)}
                        >
                          Connect
                        </Button>
                        <QRDialog
                          sessionName={session.session_name}
                          sessionId={session.id}
                          trigger={
                            <Button size="sm" variant="outline">
                              QR Code
                            </Button>
                          }
                        />
                        <PairingDialog
                          sessionName={session.session_name}
                          sessionId={session.id}
                          trigger={
                            <Button size="sm" variant="outline">
                              Pairing
                            </Button>
                          }
                        />
                      </>
                    )}
                    
                    {session.status === 'connecting' && (
                      <div className="text-sm text-muted-foreground">
                        Connecting...
                      </div>
                    )}
                    
                    {session.status === 'qr_ready' && (
                      <QRDialog
                        sessionName={session.session_name}
                        sessionId={session.id}
                        trigger={
                          <Button size="sm" variant="default">
                            Scan QR Code
                          </Button>
                        }
                      />
                    )}
                    
                    {session.status === 'connected' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSendMessage(session.id)}
                          disabled={!phoneNumber.trim() || !message.trim()}
                        >
                          Send Message
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => disconnectSession(session.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};