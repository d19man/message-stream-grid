import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Tag, X, Smartphone, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@/types";

// Predefined tags for grouping
export const PREDEFINED_TAGS = [
  "No Deposit After Registration",
  "No Recent Deposit",
  "VIP Customer",
  "New Registration",
  "Active Player",
  "Dormant User",
  "High Roller",
  "Promotional Target"
];

export const SYSTEM_TYPES = [
  { value: "crm", label: "CRM", color: "bg-blue-500", description: "Customer relationship management" },
  { value: "blaster", label: "Blaster", color: "bg-red-500", description: "Mass messaging campaigns" },
  { value: "warmup", label: "Warming Up", color: "bg-green-500", description: "Account warming activities" },
];

interface ImportContactDialogProps {
  onImport?: (contacts: Partial<Contact>[]) => void;
}

export const ImportContactDialog = ({ onImport }: ImportContactDialogProps) => {
  const [open, setOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<"crm" | "blaster" | "warmup">("crm");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const { toast } = useToast();

  const handleImport = () => {
    if (!importText.trim()) {
      toast({
        title: "Error",
        description: "Please enter contact data to import",
        variant: "destructive",
      });
      return;
    }

    // Parse contacts from text (each line = one contact)
    const lines = importText.trim().split('\n');
    const contacts: Partial<Contact>[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Support different formats: phone, name|phone, name,phone
      let phone = "";
      let name = "";

      if (trimmedLine.includes('|')) {
        const parts = trimmedLine.split('|');
        name = parts[0]?.trim() || "";
        phone = parts[1]?.trim() || "";
      } else if (trimmedLine.includes(',')) {
        const parts = trimmedLine.split(',');
        name = parts[0]?.trim() || "";
        phone = parts[1]?.trim() || "";
      } else {
        // Just phone number
        phone = trimmedLine;
        name = "";
      }

      if (phone) {
        contacts.push({
          phone,
          name,
          system: selectedSystem,
          tags: [...selectedTags],
          optOut: false,
        });
      }
    }

    if (contacts.length === 0) {
      toast({
        title: "Error", 
        description: "No valid contacts found to import",
        variant: "destructive",
      });
      return;
    }

    onImport?.(contacts);
    setOpen(false);
    setImportText("");
    setSelectedSystem("crm");
    setSelectedTags([]);
    setCustomTag("");

    const systemLabel = SYSTEM_TYPES.find(s => s.value === selectedSystem)?.label || selectedSystem;
    toast({
      title: "Success",
      description: `Successfully imported ${contacts.length} contact(s) to ${systemLabel} with ${selectedTags.length} tag(s)`,
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import Contacts with Tags</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* System Selection */}
          <div>
            <Label className="flex items-center space-x-1">
              <Smartphone className="h-4 w-4" />
              <span>Select System</span>
            </Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {SYSTEM_TYPES.map((systemType) => (
                <button
                  key={systemType.value}
                  type="button"
                  onClick={() => setSelectedSystem(systemType.value as "crm" | "blaster" | "warmup")}
                  className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                    selectedSystem === systemType.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${systemType.color}`}></div>
                    <span className="font-medium">{systemType.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{systemType.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Import Data */}
          <div>
            <Label htmlFor="importData" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>Contact Data</span>
            </Label>
            <Textarea
              id="importData"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Enter contacts (one per line):&#10;628128045556&#10;John Doe|628128045557&#10;Jane Smith,628128045558"
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formats supported: phone, name|phone, name,phone (one per line)
            </p>
          </div>

          {/* Predefined Tags */}
          <div>
            <Label className="flex items-center space-x-1">
              <Tag className="h-4 w-4" />
              <span>Apply Tags to All Imported Contacts</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PREDEFINED_TAGS.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <Label htmlFor={tag} className="text-sm cursor-pointer">
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Tag */}
          <div>
            <Label>Add Custom Tag</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Enter custom tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomTag}>
                Add
              </Button>
            </div>
          </div>

          {/* Selected Tags Preview */}
          {selectedTags.length > 0 && (
            <div>
              <Label>Selected Tags ({selectedTags.length})</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

           {/* Import Preview */}
          {importText && (
            <div>
              <Label>Import Preview</Label>
              <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-2">
                <p className="font-medium">
                  {importText.trim().split('\n').filter(line => line.trim()).length} contact(s) will be imported
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">System:</span>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${SYSTEM_TYPES.find(s => s.value === selectedSystem)?.color}`}></div>
                    <span>{SYSTEM_TYPES.find(s => s.value === selectedSystem)?.label}</span>
                  </Badge>
                </div>
                {selectedTags.length > 0 && (
                  <p className="text-muted-foreground">
                    Each contact will be tagged with: {selectedTags.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              className="bg-gradient-primary hover:opacity-90"
              disabled={!importText.trim()}
            >
              Import Contacts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};