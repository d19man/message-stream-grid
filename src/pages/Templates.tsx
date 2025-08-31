import { useState } from "react";
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
} from "lucide-react";
import { TemplateDialog } from "@/components/templates/TemplateDialog";
import { TemplatePreviewDialog } from "@/components/templates/TemplatePreviewDialog";
import type { Template, TemplateKind, PoolType } from "@/types";

const Templates = () => {
  const [activeTab, setActiveTab] = useState<TemplateKind>("text");

  // Mock data - replace with API call
  const mockTemplates: Template[] = [
    {
      id: "1",
      name: "Welcome Message",
      kind: "text",
      allowedIn: ["CRM", "WARMUP"],
      contentJson: {
        text: "Hello {{name}}! Welcome to our service. How can we help you today?"
      },
      preview: "Hello John! Welcome to our service. How can we help you today?",
      userId: "user1",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      name: "Product Promotion",
      kind: "image",
      allowedIn: ["BLASTER"],
      contentJson: {
        caption: "🔥 MEGA SALE ALERT! Get {{discount}}% off on all products!",
        mediaUrl: "/api/uploads/promo-image.jpg"
      },
      preview: "🔥 MEGA SALE ALERT! Get 50% off on all products!",
      userId: "user1",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T09:00:00Z",
    },
    {
      id: "3",
      name: "Voice Greeting",
      kind: "audio",
      allowedIn: ["CRM"],
      contentJson: {
        mediaUrl: "/api/uploads/greeting.mp3",
        caption: "Listen to our special message!"
      },
      preview: "🎵 Voice message: Listen to our special message!",
      userId: "user1",
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-01-15T08:00:00Z",
    },
    {
      id: "4",
      name: "Quick Actions Menu",
      kind: "button",
      allowedIn: ["CRM", "BLASTER"],
      contentJson: {
        text: "How can we help you today?",
        buttons: [
          { id: "1", text: "📦 Track Order" },
          { id: "2", text: "💬 Support" },
          { id: "3", text: "📋 Catalog" }
        ]
      },
      preview: "How can we help you today?\n[📦 Track Order] [💬 Support] [📋 Catalog]",
      userId: "user1",
      createdAt: "2024-01-15T07:00:00Z",
      updatedAt: "2024-01-15T07:00:00Z",
    },
  ];

  const [templates, setTemplates] = useState<Template[]>(mockTemplates);

  const handleSaveTemplate = (templateData: Partial<Template>) => {
    if (templateData.id) {
      // Edit existing template
      setTemplates(prev => prev.map(t => 
        t.id === templateData.id ? { ...t, ...templateData, updatedAt: new Date().toISOString() } : t
      ));
    } else {
      // Create new template
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateData.name!,
        kind: templateData.kind!,
        allowedIn: templateData.allowedIn!,
        contentJson: templateData.contentJson!,
        preview: generatePreview(templateData.kind!, templateData.contentJson!),
        userId: "user1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const generatePreview = (kind: TemplateKind, contentJson: any): string => {
    switch (kind) {
      case "text":
        return contentJson.text?.replace(/\{\{(\w+)\}\}/g, (_, key) => {
          const examples: Record<string, string> = { name: "John", company: "Acme Corp" };
          return examples[key] || `{{${key}}}`;
        }) || "";
      case "image":
        return contentJson.caption || "📷 Image message";
      case "audio":
        return "🎵 " + (contentJson.caption || "Audio message");
      case "button":
        const text = contentJson.text || "";
        const buttons = contentJson.buttons?.map((b: any) => `[${b.text}]`).join(" ") || "";
        return `${text}${buttons ? "\n" + buttons : ""}`;
      default:
        return "Template preview";
    }
  };

  const getKindIcon = (kind: TemplateKind) => {
    switch (kind) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "audio":
        return <Mic className="h-4 w-4" />;
      case "button":
        return <Square className="h-4 w-4" />;
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
    audio: templates.filter(t => t.kind === "audio").length,
    button: templates.filter(t => t.kind === "button").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground">Manage your message templates for different pools</p>
        </div>
        <TemplateDialog onSave={handleSaveTemplate} />
      </div>

      {/* Template Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateKind)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Text ({templateCounts.text})</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>Image ({templateCounts.image})</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center space-x-2">
            <Mic className="h-4 w-4" />
            <span>Audio ({templateCounts.audio})</span>
          </TabsTrigger>
          <TabsTrigger value="button" className="flex items-center space-x-2">
            <Square className="h-4 w-4" />
            <span>Button ({templateCounts.button})</span>
          </TabsTrigger>
        </TabsList>

        {["text", "image", "audio", "button"].map((kind) => (
          <TabsContent key={kind} value={kind} className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {getKindIcon(kind as TemplateKind)}
                  <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
                    No {kind} templates
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first {kind} template to get started
                  </p>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <TemplateDialog 
                      onSave={handleSaveTemplate}
                      trigger={
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Create {kind} template
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
                        {template.allowedIn.map((pool) => (
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
                          {template.kind === "image" && (
                            <div className="mb-2">
                              <div className="w-full h-24 bg-gradient-accent rounded flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                          {template.kind === "audio" && (
                            <div className="mb-2">
                              <div className="flex items-center space-x-2 p-2 bg-accent rounded">
                                <Mic className="h-4 w-4 text-primary" />
                                <div className="flex-1 h-1 bg-primary/30 rounded"></div>
                                <span className="text-xs">0:15</span>
                              </div>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{template.preview}</p>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">{template.kind}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pools:</span>
                          <span>{template.allowedIn.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Updated:</span>
                          <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
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