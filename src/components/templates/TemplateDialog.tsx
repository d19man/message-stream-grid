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
    allowed_in: template?.allowed_in || [] as PoolType[],
    content_json: template?.content_json || {},
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Filter available pools based on user role
  const getAvailablePools = (): PoolType[] => {
    if (!profile?.role) return ["CRM"];
    
    switch (profile.role) {
      case 'crm':
        return ["CRM"];
      case 'blaster':
        return ["BLASTER"];
      case 'warmup':
        return ["WARMUP"];
      case 'admin':
      case 'superadmin':
        return ["CRM", "BLASTER", "WARMUP"];
      default:
        return ["CRM"];
    }
  };

  const availablePools = getAvailablePools();

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
        content_json: { 
          ...prev.content_json, 
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
        content_json: { 
          ...prev.content_json, 
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
      content_json: { 
        ...prev.content_json, 
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

    if (formData.allowed_in.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one pool",
        variant: "destructive",
      });
      return;
    }

    // Validate content based on template kind
    if (formData.kind === "text" && !formData.content_json.text?.trim()) {
      toast({
        title: "Error",
        description: "Text content is required",
        variant: "destructive",
      });
      return;
    }

    if ((formData.kind === "image" || formData.kind === "text_image" || formData.kind === "image_text_button") && !formData.content_json.mediaUrl) {
      toast({
        title: "Error",
        description: "Please upload an image",
        variant: "destructive",
      });
      return;
    }

    if (formData.kind === "audio" && !formData.content_json.mediaUrl) {
      toast({
        title: "Error",
        description: "Please upload an audio file",
        variant: "destructive",
      });
      return;
    }

    if ((formData.kind === "button" || formData.kind === "text_button" || formData.kind === "image_text_button") && (!formData.content_json.tombolList || formData.content_json.tombolList.length === 0)) {
      toast({
        title: "Error",
        description: "Please add at least one button",
        variant: "destructive",
      });
      return;
    }

    onSave?.(formData);
    setOpen(false);
  };

  const togglePool = (pool: PoolType) => {
    setFormData(prev => ({
      ...prev,
      allowed_in: prev.allowed_in.includes(pool)
        ? prev.allowed_in.filter(p => p !== pool)
        : [...prev.allowed_in, pool]
    }));
  };

  const addButton = () => {
    const buttons = formData.content_json.tombolList || [];
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        tombolList: [...buttons, { title: "", link: "" }]
      }
    }));
  };

  const updateButton = (index: number, field: 'title' | 'link', value: string) => {
    const buttons = [...(formData.content_json.tombolList || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      content_json: { ...prev.content_json, tombolList: buttons }
    }));
  };

  const removeButton = (index: number) => {
    const buttons = formData.content_json.tombolList || [];
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        tombolList: buttons.filter((_, i) => i !== index)
      }
    }));
  };

  const getKindIcon = (kind: TemplateKind) => {
    switch (kind) {
      case "text": return <FileText className="h-4 w-4" />;
      case "image":
      case "text_image": return <Image className="h-4 w-4" />;
      case "audio": return <Mic className="h-4 w-4" />;
      case "button":
      case "text_button": return <Square className="h-4 w-4" />;
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
                setFormData(prev => ({ ...prev, kind: value, content_json: {} }))
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
                  <SelectItem value="text_image">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("text_image")}
                      <span>Text + Image</span>
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
                  <SelectItem value="text_button">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("text_button")}
                      <span>Text + Button</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="image_text_button">
                    <div className="flex items-center space-x-2">
                      {getKindIcon("image_text_button")}
                      <span>Full</span>
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
              {availablePools.map(pool => (
                <div key={pool} className="flex items-center space-x-2">
                  <Checkbox
                    id={pool}
                    checked={formData.allowed_in.includes(pool)}
                    onCheckedChange={() => togglePool(pool)}
                  />
                  <Label htmlFor={pool} className="text-sm">{pool}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Text Content */}
          {(formData.kind === "text" || formData.kind === "text_button" || formData.kind === "text_image" || formData.kind === "image_text_button") && (
            <div>
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                value={formData.content_json.text || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content_json: { ...prev.content_json, text: e.target.value }
                }))}
                placeholder="Enter your message text (use {{variable}} for dynamic content)"
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Image Upload */}
          {(formData.kind === "image" || formData.kind === "text_image" || formData.kind === "image_text_button") && (
            <div>
              <Label>Image Upload</Label>
              {formData.content_json.mediaUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Image className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{formData.content_json.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.content_json.fileSize && (formData.content_json.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeMediaFile}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <img 
                    src={formData.content_json.mediaUrl} 
                    alt="Preview" 
                    className="w-full max-w-xs h-32 object-cover rounded-lg border"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> an image
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP (max 5MB)</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileInputChange(e, 'image')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      <span className="text-sm text-muted-foreground">Uploading image...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Audio Upload */}
          {formData.kind === "audio" && (
            <div>
              <Label>Audio Upload</Label>
              {formData.content_json.mediaUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mic className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{formData.content_json.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.content_json.fileSize && (formData.content_json.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeMediaFile}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <audio controls className="w-full">
                    <source src={formData.content_json.mediaUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="audio-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> an audio file
                        </p>
                        <p className="text-xs text-muted-foreground">MP3, WAV, OGG, M4A (max 10MB)</p>
                      </div>
                      <input
                        id="audio-upload"
                        type="file"
                        className="hidden"
                        accept="audio/*"
                        onChange={(e) => handleFileInputChange(e, 'audio')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      <span className="text-sm text-muted-foreground">Uploading audio...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Interactive Buttons */}
          {(formData.kind === "button" || formData.kind === "text_button" || formData.kind === "image_text_button") && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Interactive Buttons</Label>
                <Button type="button" variant="outline" size="sm" onClick={addButton}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Button
                </Button>
              </div>
              
              <div className="space-y-2">
                {(formData.content_json.tombolList || []).map((button: any, index: number) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg">
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
                        <Label className="text-xs">Button Title</Label>
                        <Input
                          value={button.title || ""}
                          onChange={(e) => updateButton(index, 'title', e.target.value)}
                          placeholder="e.g., DAFTAR SEKARANG"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Link URL</Label>
                        <Input
                          value={button.link || ""}
                          onChange={(e) => updateButton(index, 'link', e.target.value)}
                          placeholder="https://example.com/register"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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