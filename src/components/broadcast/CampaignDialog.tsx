import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Users, Clock, Settings, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BroadcastJob, PoolType, Template, Contact, Session } from "@/types";
import { PREDEFINED_TAGS } from "../contacts/ImportContactDialog";

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
    manualPhones: [] as string[],
    manualPhoneText: "",
    selectedTags: [] as string[],
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

    if (formData.targetContacts.length === 0 && formData.manualPhones.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one contact or add phone numbers manually",
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

    const allTargetContacts = [...formData.targetContacts, ...formData.manualPhones];
    
    const campaignData: Partial<BroadcastJob> = {
      name: formData.name,
      pool: formData.pool,
      templateId: formData.templateId,
      targetContacts: allTargetContacts,
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
        total: allTargetContacts.length,
        sent: 0,
        failed: 0,
        pending: allTargetContacts.length,
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
      manualPhones: [],
      manualPhoneText: "",
      selectedTags: [],
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

  const handleManualPhonesChange = (text: string) => {
    setFormData(prev => ({ ...prev, manualPhoneText: text }));
    
    // Parse phone numbers from text
    const phoneNumbers = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => /^[0-9+\-\s()]+$/.test(line)); // Basic phone number validation
    
    setFormData(prev => ({ ...prev, manualPhones: phoneNumbers }));
  };

  const validatePhoneNumbers = (phones: string[]): string[] => {
    return phones.filter(phone => {
      // Remove all non-digit characters except +
      const cleaned = phone.replace(/[^0-9+]/g, '');
      // Check if it's a valid phone format (at least 8 digits, can start with +)
      return /^(\+?[0-9]{8,15})$/.test(cleaned);
    });
  };

  const handleSessionToggle = (sessionId: string) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.includes(sessionId)
        ? prev.sessions.filter(id => id !== sessionId)
        : [...prev.sessions, sessionId]
    }));
  };

  // Get contacts filtered by selected tags
  const getFilteredContacts = () => {
    if (formData.selectedTags.length === 0) {
      return contacts;
    }
    return contacts.filter(contact => 
      formData.selectedTags.some(tag => contact.tags.includes(tag))
    );
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
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
        const totalContacts = formData.targetContacts.length + formData.manualPhones.length;
        const validManualPhones = validatePhoneNumbers(formData.manualPhones);
        const filteredContacts = getFilteredContacts();
        // Get all unique tags from contacts
        const allTags = Array.from(new Set(contacts.flatMap(contact => contact.tags)));
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Target Contacts</h3>
              <p className="text-sm text-muted-foreground">Select contacts or add phone numbers manually</p>
              <div className="mt-2">
                <span className="text-sm font-medium text-primary">
                  Total: {totalContacts} contacts selected
                </span>
              </div>
            </div>

            {/* Tag Filter Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span className="font-medium">Filter by Tags</span>
                {formData.selectedTags.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({formData.selectedTags.length} tag(s) selected)
                  </span>
                )}
              </div>
              
              {/* Predefined Tags */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2">Quick Filter Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {PREDEFINED_TAGS.slice(0, 6).map((tag) => (
                    <Badge
                      key={tag}
                      variant={formData.selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Available Tags from Contacts */}
              {allTags.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">All Available Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={formData.selectedTags.includes(tag) ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.selectedTags.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Showing {filteredContacts.length} of {contacts.length} contacts
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, selectedTags: [] }))}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Phone Numbers Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Manual Phone Numbers</span>
                <span className="text-xs text-muted-foreground">
                  ({formData.manualPhones.length} numbers, {validManualPhones.length} valid)
                </span>
              </div>
              <div>
                <Label htmlFor="manualPhones" className="text-sm">
                  Paste phone numbers (one per line)
                </Label>
                <Textarea
                  id="manualPhones"
                  value={formData.manualPhoneText}
                  onChange={(e) => handleManualPhonesChange(e.target.value)}
                  placeholder="628128045556&#10;628128045557&#10;628128045558&#10;628128045559&#10;&#10;Example formats:&#10;628128045556&#10;+628128045556&#10;08128045556"
                  className="h-32 font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Enter one phone number per line. Supports Indonesian format (62xxx) and international (+62xxx)
                  </p>
                  {formData.manualPhones.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleManualPhonesChange("")}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                {formData.manualPhones.length > 0 && validManualPhones.length !== formData.manualPhones.length && (
                  <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-xs text-warning-foreground">
                      ⚠️ {formData.manualPhones.length - validManualPhones.length} invalid phone number(s) detected. 
                      Please check the format.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact List Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Saved Contacts</span>
                  <span className="text-xs text-muted-foreground">
                    ({formData.targetContacts.length} selected from {filteredContacts.length} shown)
                  </span>
                </div>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={filteredContacts.length > 0 && filteredContacts.every(c => formData.targetContacts.includes(c.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newSelected = [...new Set([...formData.targetContacts, ...filteredContacts.map(c => c.id)])];
                        setFormData(prev => ({ ...prev, targetContacts: newSelected }));
                      } else {
                        const filteredIds = filteredContacts.map(c => c.id);
                        setFormData(prev => ({ 
                          ...prev, 
                          targetContacts: prev.targetContacts.filter(id => !filteredIds.includes(id))
                        }));
                      }
                    }}
                  />
                  <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    Select All {formData.selectedTags.length > 0 ? 'Filtered' : ''} Contacts
                  </Label>
                </div>
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={contact.id}
                      checked={formData.targetContacts.includes(contact.id)}
                      onCheckedChange={() => handleContactToggle(contact.id)}
                    />
                    <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <span>{contact.name || "Unknown"}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contact.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{contact.phone}</span>
                      </div>
                    </Label>
                  </div>
                ))}
                {filteredContacts.length === 0 && formData.selectedTags.length > 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No contacts found with selected tags</p>
                    <p className="text-xs">Try different tags or clear filters</p>
                  </div>
                )}
                {contacts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved contacts found</p>
                    <p className="text-xs">Use manual input above to add phone numbers</p>
                  </div>
                )}
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