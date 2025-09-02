import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, FileText, Image, Mic, Square, Layers, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Template, TemplateKind, PoolType } from "@/types";

interface TemplateDialogProps {
  template?: Template;
  trigger?: React.ReactNode;
  onSave?: (template: Partial<Template>) => void;
}

export const TemplateDialog = ({ template, trigger, onSave }: TemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || "",
    kind: template?.kind || "text" as TemplateKind,
    allowedIn: template?.allowedIn || [] as PoolType[],
    contentJson: template?.contentJson || {},
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAudioUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid audio file (MP3, WAV, OGG, M4A)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('template-audio')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('template-audio')
        .getPublicUrl(fileName);

      // Update form data with the uploaded file URL
      setFormData(prev => ({
        ...prev,
        contentJson: { 
          ...prev.contentJson, 
          mediaUrl: publicUrl,
          fileName: file.name,
          fileSize: file.size
        }
      }));

      toast({
        title: "Success",
        description: "Audio file uploaded successfully!",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload audio file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('template-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('template-images')
        .getPublicUrl(fileName);

      // Update form data with the uploaded file URL
      setFormData(prev => ({
        ...prev,
        contentJson: { 
          ...prev.contentJson, 
          mediaUrl: publicUrl,
          fileName: file.name,
          fileSize: file.size
        }
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'audio') {
        handleAudioUpload(file);
      } else {
        handleImageUpload(file);
      }
    }
  };

  const removeMediaFile = () => {
    setFormData(prev => ({
      ...prev,
      contentJson: { 
        ...prev.contentJson, 
        mediaUrl: undefined,
        fileName: undefined,
        fileSize: undefined
      }
    }));
  };

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

    if (formData.kind === "image" && !formData.contentJson.mediaUrl?.trim()) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (formData.kind === "audio" && !formData.contentJson.mediaUrl?.trim()) {
      toast({
        title: "Error",
        description: "Please upload an audio file",
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
                <Label>Image File Upload</Label>
                <div className="space-y-3">
                  {!formData.contentJson.mediaUrl ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload an image file for your template
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                        </p>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'image')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            disabled={uploading}
                            className="pointer-events-none"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Uploading..." : "Choose Image File"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={formData.contentJson.mediaUrl} 
                              alt="Template image"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg1NlY1NkgyNFYyNFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjM0IiBjeT0iMzQiIHI9IjQiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDQ4TDMyIDQwTDQwIDQ4SDI0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {formData.contentJson.fileName || "Image file"}
                            </p>
                            {formData.contentJson.fileSize && (
                              <p className="text-xs text-muted-foreground">
                                {(formData.contentJson.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeMediaFile}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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
                <Label>Audio File Upload</Label>
                <div className="space-y-3">
                  {!formData.contentJson.mediaUrl ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload an audio file for your template
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Supported formats: MP3, WAV, OGG, M4A (max 10MB)
                        </p>
                        <div className="relative">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileInputChange(e, 'audio')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            disabled={uploading}
                            className="pointer-events-none"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Uploading..." : "Choose Audio File"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Mic className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {formData.contentJson.fileName || "Audio file"}
                            </p>
                            {formData.contentJson.fileSize && (
                              <p className="text-xs text-muted-foreground">
                                {(formData.contentJson.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <audio 
                            controls 
                            className="h-8"
                            src={formData.contentJson.mediaUrl}
                          >
                            Your browser does not support the audio element.
                          </audio>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeMediaFile}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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