import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, FileText, Image, Mic, Square, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplateKind, PoolType } from "@/types";

interface TemplateDialogProps {
  template?: Template;
  trigger?: React.ReactNode;
  onSave?: (template: Partial<Template>) => void;
}

export const TemplateDialog = ({ template, trigger, onSave }: TemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || "",
    kind: template?.kind || "text" as TemplateKind,
    allowedIn: template?.allowedIn || [] as PoolType[],
    contentJson: template?.contentJson || {},
  });
  const { toast } = useToast();

  const isEdit = !!template;

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.allowedIn.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one pool",
        variant: "destructive",
      });
      return;
    }

    // Validate content based on template kind
    if (formData.kind === "text" && !formData.contentJson.text?.trim()) {
      toast({
        title: "Error",
        description: "Text content is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.kind === "button" && (!formData.contentJson.text?.trim() || !formData.contentJson.buttons?.length)) {
      toast({
        title: "Error",
        description: "Button template requires text and at least one button",
        variant: "destructive",
      });
      return;
    }

    if (formData.kind === "image_text_button" && (!formData.contentJson.mediaUrl?.trim() || !formData.contentJson.text?.trim() || !formData.contentJson.buttons?.length)) {
      toast({
        title: "Error",
        description: "Image + Text + Button template requires image URL, text content, and at least one button",
        variant: "destructive",
      });
      return;
    }

    onSave?.(formData);
    setOpen(false);
    toast({
      title: "Success",
      description: `Template ${isEdit ? 'updated' : 'created'} successfully!`,
    });
  };

  const togglePool = (pool: PoolType) => {
    setFormData(prev => ({
      ...prev,
      allowedIn: prev.allowedIn.includes(pool)
        ? prev.allowedIn.filter(p => p !== pool)
        : [...prev.allowedIn, pool]
    }));
  };

  const addButton = () => {
    const buttons = formData.contentJson.buttons || [];
    setFormData(prev => ({
      ...prev,
      contentJson: {
        ...prev.contentJson,
        buttons: [...buttons, { id: Date.now().toString(), text: "", url: "" }]
      }
    }));
  };

  const updateButton = (index: number, field: 'text' | 'url', value: string) => {
    const buttons = [...(formData.contentJson.buttons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      contentJson: { ...prev.contentJson, buttons }
    }));
  };

  const removeButton = (index: number) => {
    const buttons = formData.contentJson.buttons || [];
    setFormData(prev => ({
      ...prev,
      contentJson: {
        ...prev.contentJson,
        buttons: buttons.filter((_, i) => i !== index)
      }
    }));
  };

  const getKindIcon = (kind: TemplateKind) => {
    switch (kind) {
      case "text": return <FileText className="h-4 w-4" />;
      case "image": return <Image className="h-4 w-4" />;
      case "audio": return <Mic className="h-4 w-4" />;
      case "button": return <Square className="h-4 w-4" />;
      case "image_text_button": return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isEdit ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span>{isEdit ? 'Edit Template' : 'Create New Template'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label htmlFor="kind">Template Type</Label>
              <Select value={formData.kind} onValueChange={(value: TemplateKind) => 
                setFormData(prev => ({ ...prev, kind: value, contentJson: {} }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("text")}
                      <span>Text</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("image")}
                      <span>Image</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("audio")}
                      <span>Audio</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="button">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("button")}
                      <span>Button</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="image_text_button">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("image_text_button")}
                      <span>Image + Text + Button</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Allowed Pools */}
          <div>
            <Label className="mb-3 block">Allowed in Pools</Label>
            <div className="flex space-x-4">
              {(["CRM", "BLASTER", "WARMUP"] as PoolType[]).map(pool => (
                <div key={pool} className="flex items-center space-x-2">
                  <Checkbox
                    id={pool}
                    checked={formData.allowedIn.includes(pool)}
                    onCheckedChange={() => togglePool(pool)}
                  />
                  <Label htmlFor={pool} className="text-sm">{pool}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Content Fields */}
          {formData.kind === "text" && (
            <div>
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                value={formData.contentJson.text || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contentJson: { ...prev.contentJson, text: e.target.value }
                }))}
                placeholder="Enter your message text (use {{variable}} for dynamic content)"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variables like {"{{name}}"}, {"{{company}}"} for personalization
              </p>
            </div>
          )}

          {formData.kind === "image" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={formData.contentJson.mediaUrl || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, mediaUrl: e.target.value }
                  }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="image-caption">Caption</Label>
                <Textarea
                  id="image-caption"
                  value={formData.contentJson.caption || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, caption: e.target.value }
                  }))}
                  placeholder="Optional image caption"
                />
              </div>
            </div>
          )}

          {formData.kind === "audio" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="audio-url">Audio URL</Label>
                <Input
                  id="audio-url"
                  value={formData.contentJson.mediaUrl || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, mediaUrl: e.target.value }
                  }))}
                  placeholder="https://example.com/audio.mp3"
                />
              </div>
              <div>
                <Label htmlFor="audio-caption">Caption</Label>
                <Input
                  id="audio-caption"
                  value={formData.contentJson.caption || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, caption: e.target.value }
                  }))}
                  placeholder="Optional audio caption"
                />
              </div>
            </div>
          )}

          {formData.kind === "button" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="button-text">Message Text</Label>
                <Textarea
                  id="button-text"
                  value={formData.contentJson.text || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, text: e.target.value }
                  }))}
                  placeholder="Enter message text that will appear above buttons"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Interactive Buttons</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addButton}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Button
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Button names that will appear as interactive buttons in WhatsApp
                </p>
                
                <div className="space-y-2">
                  {(formData.contentJson.buttons || []).map((button: any, index: number) => (
                    <div key={button.id} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Button {index + 1}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeButton(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Button Name</Label>
                          <Input
                            value={button.text || ""}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            placeholder="e.g., DAFTAR SEKARANG"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Link URL</Label>
                          <Input
                            value={button.url || ""}
                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                            placeholder="https://example.com/register"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.kind === "image_text_button" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="combo-image-url">Image URL</Label>
                <Input
                  id="combo-image-url"
                  value={formData.contentJson.mediaUrl || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, mediaUrl: e.target.value }
                  }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="combo-text">Text Content</Label>
                <Textarea
                  id="combo-text"
                  value={formData.contentJson.text || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contentJson: { ...prev.contentJson, text: e.target.value }
                  }))}
                  placeholder="Enter message text (use {{variable}} for dynamic content)"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variables like {"{{name}}"}, {"{{company}}"} for personalization
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Interactive Buttons</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addButton}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Button
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Button names that will appear as interactive buttons in WhatsApp
                </p>
                
                <div className="space-y-2">
                  {(formData.contentJson.buttons || []).map((button: any, index: number) => (
                    <div key={button.id} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Button {index + 1}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeButton(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Button Name</Label>
                          <Input
                            value={button.text || ""}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            placeholder="e.g., DAFTAR SEKARANG"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Link URL</Label>
                          <Input
                            value={button.url || ""}
                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                            placeholder="https://example.com/register"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
              {isEdit ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};