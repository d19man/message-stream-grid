import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, X, Phone, User, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@/types";
import { PREDEFINED_TAGS } from "./ImportContactDialog";

interface ContactDialogProps {
  contact?: Contact;
  trigger?: React.ReactNode;
  onSave?: (contact: Partial<Contact>) => void;
}

export const ContactDialog = ({ contact, trigger, onSave }: ContactDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: contact?.name || "",
    phone: contact?.phone || "",
    tags: contact?.tags || [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const isEdit = !!contact;

  const handleSave = () => {
    if (!formData.phone.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    onSave?.(formData);
    setOpen(false);
    toast({
      title: "Success",
      description: `Contact ${isEdit ? 'updated' : 'created'} successfully!`,
    });

    // Reset form if creating new
    if (!isEdit) {
      setFormData({ name: "", phone: "", tags: [] });
      setNewTag("");
    }
  };

  const addTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      if (!tagToAdd) {
        setNewTag("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isEdit ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span>{isEdit ? 'Edit Contact' : 'Add New Contact'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Name</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter contact name"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>Phone Number *</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1234567890"
              disabled={isEdit} // Don't allow phone changes in edit mode
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="flex items-center space-x-1">
              <Tag className="h-4 w-4" />
              <span>Tags</span>
            </Label>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {formData.tags.map((tag) => (
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

            {/* Quick Select Predefined Tags */}
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground">Quick Select Tags</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {PREDEFINED_TAGS.slice(0, 6).map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`preset-${tag}`}
                      checked={formData.tags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addTag(tag);
                        } else {
                          removeTag(tag);
                        }
                      }}
                    />
                    <Label htmlFor={`preset-${tag}`} className="text-xs cursor-pointer">
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Tag */}
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add custom tag and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addTag()}>
                Add
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
              {isEdit ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};