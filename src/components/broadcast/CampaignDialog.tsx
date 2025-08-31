import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Send, Users, Clock, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BroadcastJob, PoolType, Template, Contact, Session } from "@/types";

interface CampaignDialogProps {
  trigger?: React.ReactNode;
  onSave?: (campaign: Partial<BroadcastJob>) => void;
}

export const CampaignDialog = ({ trigger, onSave }: CampaignDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    pool: "" as PoolType | "",
    templateId: "",
    targetContacts: [] as string[],
    delayMin: 30,
    delayMax: 120,
    sessions: [] as string[],
    startAt: "",
    endAt: "",
    quietHours: [] as number[],
  });
  const { toast } = useToast();

  // Mock data - in real app, these would come from API
  const templates: Template[] = [
    { id: "1", name: "Welcome Message", kind: "text", allowedIn: ["CRM", "WARMUP"], contentJson: { text: "Hello {{name}}!" }, userId: "1", createdAt: "", updatedAt: "" },
    { id: "2", name: "Product Promo", kind: "image", allowedIn: ["BLASTER"], contentJson: { mediaUrl: "", caption: "50% OFF!" }, userId: "1", createdAt: "", updatedAt: "" },
    { id: "3", name: "Survey Request", kind: "button", allowedIn: ["CRM", "BLASTER"], contentJson: { text: "Please rate us", buttons: [] }, userId: "1", createdAt: "", updatedAt: "" },
  ];

  const contacts: Contact[] = [
    { id: "1", name: "John Doe", phone: "+1234567890", tags: ["customer"], optOut: false, userId: "1", createdAt: "", updatedAt: "" },
    { id: "2", name: "Jane Smith", phone: "+1234567891", tags: ["prospect"], optOut: false, userId: "1", createdAt: "", updatedAt: "" },
    { id: "3", name: "Mike Johnson", phone: "+1234567892", tags: ["lead"], optOut: false, userId: "1", createdAt: "", updatedAt: "" },
  ];

  const sessions: Session[] = [
    { id: "1", name: "CRM-Main", pool: "CRM", status: "connected", userId: "1", createdAt: "", updatedAt: "" },
    { id: "2", name: "Blast-01", pool: "BLASTER", status: "connected", userId: "1", createdAt: "", updatedAt: "" },
    { id: "3", name: "Warmup-01", pool: "WARMUP", status: "connected", userId: "1", createdAt: "", updatedAt: "" },
  ];

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
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

    if (!formData.templateId) {
      toast({
        title: "Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return;
    }

    if (formData.targetContacts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one contact",
        variant: "destructive",
      });
      return;
    }

    if (formData.sessions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one session",
        variant: "destructive",
      });
      return;
    }

    const campaignData: Partial<BroadcastJob> = {
      name: formData.name,
      pool: formData.pool,
      templateId: formData.templateId,
      targetContacts: formData.targetContacts,
      status: "draft",
      planJson: {
        delayMin: formData.delayMin,
        delayMax: formData.delayMax,
        sessions: formData.sessions,
        schedule: {
          startAt: formData.startAt || undefined,
          endAt: formData.endAt || undefined,
          quietHours: formData.quietHours.length > 0 ? formData.quietHours : undefined,
        },
      },
      stats: {
        total: formData.targetContacts.length,
        sent: 0,
        failed: 0,
        pending: formData.targetContacts.length,
      },
    };

    onSave?.(campaignData);
    setOpen(false);
    setCurrentStep(1);
    toast({
      title: "Success",
      description: "Campaign created successfully!",
    });

    // Reset form
    setFormData({
      name: "",
      pool: "" as PoolType | "",
      templateId: "",
      targetContacts: [],
      delayMin: 30,
      delayMax: 120,
      sessions: [],
      startAt: "",
      endAt: "",
      quietHours: [],
    });
  };

  const handleContactToggle = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      targetContacts: prev.targetContacts.includes(contactId)
        ? prev.targetContacts.filter(id => id !== contactId)
        : [...prev.targetContacts, contactId]
    }));
  };

  const handleSessionToggle = (sessionId: string) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.includes(sessionId)
        ? prev.sessions.filter(id => id !== sessionId)
        : [...prev.sessions, sessionId]
    }));
  };

  const getAvailableTemplates = () => {
    return templates.filter(t => formData.pool ? t.allowedIn.includes(formData.pool) : true);
  };

  const getAvailableSessions = () => {
    return sessions.filter(s => formData.pool ? s.pool === formData.pool : true);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Campaign Details</h3>
              <p className="text-sm text-muted-foreground">Set up your campaign basics</p>
            </div>
            
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
              />
            </div>

            <div>
              <Label>Pool Type *</Label>
              <Select value={formData.pool} onValueChange={(value: PoolType) => 
                setFormData(prev => ({ ...prev, pool: value, templateId: "", sessions: [] }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select pool type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRM">CRM - Customer Relationship</SelectItem>
                  <SelectItem value="BLASTER">Blaster - Bulk Campaigns</SelectItem>
                  <SelectItem value="WARMUP">Warmup - Account Warming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Template & Sessions</h3>
              <p className="text-sm text-muted-foreground">Choose template and sessions to use</p>
            </div>

            <div>
              <Label>Message Template *</Label>
              <Select value={formData.templateId} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, templateId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTemplates().map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.kind})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sessions *</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {getAvailableSessions().map((session) => (
                  <div key={session.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={session.id}
                      checked={formData.sessions.includes(session.id)}
                      onCheckedChange={() => handleSessionToggle(session.id)}
                    />
                    <Label htmlFor={session.id} className="flex-1 cursor-pointer">
                      {session.name} ({session.status})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Target Contacts</h3>
              <p className="text-sm text-muted-foreground">Select who will receive this campaign</p>
            </div>

            <div>
              <Label>Contacts ({formData.targetContacts.length} selected)</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={formData.targetContacts.length === contacts.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({ ...prev, targetContacts: contacts.map(c => c.id) }));
                      } else {
                        setFormData(prev => ({ ...prev, targetContacts: [] }));
                      }
                    }}
                  />
                  <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    Select All Contacts
                  </Label>
                </div>
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={contact.id}
                      checked={formData.targetContacts.includes(contact.id)}
                      onCheckedChange={() => handleContactToggle(contact.id)}
                    />
                    <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{contact.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{contact.phone}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Scheduling & Settings</h3>
              <p className="text-sm text-muted-foreground">Configure timing and delays</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delayMin">Min Delay (seconds)</Label>
                <Input
                  id="delayMin"
                  type="number"
                  value={formData.delayMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, delayMin: parseInt(e.target.value) || 30 }))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="delayMax">Max Delay (seconds)</Label>
                <Input
                  id="delayMax"
                  type="number"
                  value={formData.delayMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, delayMax: parseInt(e.target.value) || 120 }))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startAt">Start Time (Optional)</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endAt">End Time (Optional)</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Create New Campaign</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : step < currentStep 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-success' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
                Create Campaign
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};