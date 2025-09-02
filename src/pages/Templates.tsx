import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Image,
  Mic,
  Square,
  Eye,
  Layers,
} from "lucide-react";
import { TemplateDialog } from "@/components/templates/TemplateDialog";
import { TemplatePreviewDialog } from "@/components/templates/TemplatePreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Template, TemplateKind, PoolType } from "@/types";

const Templates = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TemplateKind>("text");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch templates from database
  const fetchTemplates = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase.from('templates').select('*');

      // Apply role-based filtering
      if (profile?.role === 'superadmin') {
        // Superadmin sees all templates
      } else if (profile?.role === 'admin') {
        // Admin sees their own and their users' templates
        query = query.or(`user_id.eq.${user.id},admin_id.eq.${user.id}`);
      } else {
        // Regular users see only their own templates
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
        return;
      }

      setTemplates((data as Template[]) || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role) {
      fetchTemplates();
    }
  }, [user?.id, profile?.role]);

  const handleSaveTemplate = async (templateData: Partial<Template>) => {
    if (!user) return;

    try {
        const templatePayload: any = {
          ...templateData,
          user_id: templateData.user_id || user.id,
          admin_id: profile?.admin_id || (profile?.role === 'admin' ? user.id : null),
          preview: templateData.preview || generatePreview(templateData.kind!, templateData.content_json!),
        };

      if (templateData.id) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(templatePayload)
          .eq('id', templateData.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template updated successfully!",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('templates')
          .insert([templatePayload]);

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Template created successfully!",
        });
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error", 
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const generatePreview = (kind: TemplateKind, contentJson: any): string => {
    switch (kind) {
      case "text":
        return contentJson.text?.replace(/\{\{(\w+)\}\}/g, (_, key) => {
          const examples: Record<string, string> = { name: "John", company: "Acme Corp" };
          return examples[key] || `{{${key}}}`;
        }) || "";
      case "image":
      case "text_image":
        return contentJson.text || contentJson.caption || "📷 Image message";
      case "audio":
        return "🎵 " + (contentJson.caption || "Audio message");
      case "button":
      case "text_button":
        const text = contentJson.text || "";
        const buttons = contentJson.tombolList?.map((b: any) => `[${b.title}]`).join(" ") || "";
        return `${text}${buttons ? "\n" + buttons : ""}`;
      case "image_text_button":
        const imageText = contentJson.text?.replace(/\{\{(\w+)\}\}/g, (_, key) => {
          const examples: Record<string, string> = { name: "John", company: "Acme Corp" };
          return examples[key] || `{{${key}}}`;
        }) || "";
        const imageButtons = contentJson.tombolList?.map((b: any) => `[${b.title}]`).join(" ") || "";
        return `📷 Image\n${imageText}${imageButtons ? "\n" + imageButtons : ""}`;
      default:
        return "Template preview";
    }
  };

  const getKindIcon = (kind: TemplateKind) => {
    switch (kind) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "image":
      case "text_image":
        return <Image className="h-4 w-4" />;
      case "audio":
        return <Mic className="h-4 w-4" />;
      case "button":
      case "text_button":
        return <Square className="h-4 w-4" />;
      case "image_text_button":
        return <Layers className="h-4 w-4" />;
    }
  };

  const getPoolBadgeColor = (pool: PoolType) => {
    switch (pool) {
      case "CRM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BLASTER":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "WARMUP":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const filteredTemplates = templates.filter(template => template.kind === activeTab);

  const templateCounts = {
    text: templates.filter(t => t.kind === "text").length,
    image: templates.filter(t => t.kind === "image").length,
    text_image: templates.filter(t => t.kind === "text_image").length,
    audio: templates.filter(t => t.kind === "audio").length,
    button: templates.filter(t => t.kind === "button").length,
    text_button: templates.filter(t => t.kind === "text_button").length,
    image_text_button: templates.filter(t => t.kind === "image_text_button").length,
  };

  const availablePools = getAvailablePools();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'superadmin' 
              ? 'Manage all message templates across pools'
              : profile?.role === 'admin'
              ? 'Manage message templates for your teams'
              : `Manage your ${availablePools.join(', ')} message templates`
            }
          </p>
        </div>
        <TemplateDialog onSave={handleSaveTemplate} />
      </div>

      {/* Template Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateKind)}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="text" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Text ({templateCounts.text})</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>Image ({templateCounts.image})</span>
          </TabsTrigger>
          <TabsTrigger value="text_image" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>Text+Image ({templateCounts.text_image})</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center space-x-2">
            <Mic className="h-4 w-4" />
            <span>Audio ({templateCounts.audio})</span>
          </TabsTrigger>
          <TabsTrigger value="button" className="flex items-center space-x-2">
            <Square className="h-4 w-4" />
            <span>Button ({templateCounts.button})</span>
          </TabsTrigger>
          <TabsTrigger value="text_button" className="flex items-center space-x-2">
            <Square className="h-4 w-4" />
            <span>Text+Button ({templateCounts.text_button})</span>
          </TabsTrigger>
          <TabsTrigger value="image_text_button" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>Full ({templateCounts.image_text_button})</span>
          </TabsTrigger>
        </TabsList>

        {["text", "image", "text_image", "audio", "button", "text_button", "image_text_button"].map((kind) => (
          <TabsContent key={kind} value={kind} className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {getKindIcon(kind as TemplateKind)}
                  <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
                    No {kind.replace('_', ' ')} templates
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first {kind.replace('_', ' ')} template to get started
                  </p>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <TemplateDialog 
                      onSave={handleSaveTemplate}
                      trigger={
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Create {kind.replace('_', ' ')} template
                        </div>
                      }
                    />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {getKindIcon(template.kind)}
                          <span>{template.name}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-1">
                          <TemplatePreviewDialog 
                            template={template}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <TemplateDialog 
                            template={template}
                            onSave={handleSaveTemplate}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.allowed_in.map((pool) => (
                          <Badge
                            key={pool}
                            variant="secondary"
                            className={`text-xs ${getPoolBadgeColor(pool)}`}
                          >
                            {pool}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Template Preview */}
                      <div className="bg-muted rounded-lg p-3 mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                        <div className="text-sm">
                          {(template.kind === "image" || template.kind === "text_image" || template.kind === "image_text_button") && (
                            <div className="mb-2">
                              {template.content_json.mediaUrl ? (
                                <img 
                                  src={template.content_json.mediaUrl} 
                                  alt="Template preview"
                                  className="w-full h-24 object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-24 bg-gradient-accent rounded flex items-center justify-center">
                                  <Image className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          )}
                          {template.kind === "audio" && (
                            <div className="mb-2">
                              {template.content_json.mediaUrl ? (
                                <audio controls className="w-full h-8">
                                  <source src={template.content_json.mediaUrl} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              ) : (
                                <div className="flex items-center space-x-2 p-2 bg-accent rounded">
                                  <Mic className="h-4 w-4 text-primary" />
                                  <div className="flex-1 h-1 bg-primary/30 rounded"></div>
                                  <span className="text-xs">Audio</span>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{template.preview}</p>
                          {template.content_json.tombolList && template.content_json.tombolList.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {template.content_json.tombolList.map((button: any, index: number) => (
                                <div key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  🔗 {button.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">{template.kind.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pools:</span>
                          <span>{template.allowed_in.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Updated:</span>
                          <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Templates;